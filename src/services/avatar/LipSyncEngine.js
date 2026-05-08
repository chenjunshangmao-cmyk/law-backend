/**
 * LipSyncEngine.js — 唇形同步引擎 v1.0
 * 
 * 功能：分析TTS音频 → 生成音素时长 → 映射到VRM BlendShape口型关键帧
 * 
 * 数据流：
 *   TTS音频 + 文本 → 音素分段 → Viseme映射 → 口型关键帧JSON
 * 
 * 音素→Viseme映射表（中文拼音体系）
 * 基于微软Azure Speech Viseme标准 (21个viseme)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 输出目录
const LIPSYNC_DIR = path.join(process.cwd(), 'generated-lipsync');
if (!fs.existsSync(LIPSYNC_DIR)) fs.mkdirSync(LIPSYNC_DIR, { recursive: true });

/**
 * 中文拼音 → Viseme ID 映射表
 * 基于微软Viseme标准: 0=闭嘴, 2=啊(a), 4=呃(e), 7=衣(i), 11=乌(u), 14=喔(o)...
 */
const PINYIN_TO_VISEME = {
  // 开口音
  'a': 2,  'ai': 2,  'ao': 2,  'an': 2,  'ang': 2,
  // 齐齿音
  'i': 7,  'ia': 7,  'ie': 7,  'iao': 7,  'iu': 7, 'ian': 7, 'in': 7, 'iang': 7, 'ing': 7,
  // 合口音
  'u': 11, 'ua': 11, 'uo': 11, 'uai': 11, 'ui': 11, 'uan': 11, 'un': 11, 'uang': 11,
  // 撮口音
  'v': 14, 've': 14, 'ue': 14, 'van': 14, 'vn': 14,
  // 半元音
  'o': 14, 'ou': 14, 'ong': 14,
  // 前元音
  'e': 4,  'ei': 4,  'en': 4,  'eng': 4, 'er': 4,
  // 唇音
  'b': 16, 'p': 16, 'm': 16, 'f': 18,
  // 舌尖音
  'd': 5,  't': 5,  'n': 5,  'l': 5,
  // 舌根音
  'g': 8,  'k': 8,  'h': 8,
  // 舌面音
  'j': 7,  'q': 7,  'x': 7,
  // 翘舌音
  'zh': 6, 'ch': 6, 'sh': 6, 'r': 6,
  // 平舌音
  'z': 5,  'c': 5,  's': 5,
  // 零声母
  'y': 7,  'w': 11,
};

// Viseme权重 — 每个viseme对应VRM BlendShape的变形权重
const VISEME_BLENDSHAPE_MAP = {
  0: 'A',     // silence/闭嘴
  2: 'A',     // aa 啊
  4: 'E',     // eh 呃
  5: 'I',     // ih 衣(短)
  6: 'CH',    // ch 吃
  7: 'I',     // iy 衣(长)
  8: 'OH',    // oh 哦
  11: 'U',    // uw 乌
  14: 'O',    // ow 喔
  16: 'F',    // f 佛
  18: 'TH',   // th 思
};

/**
 * 简单中文分词 + 拼音映射
 * 将中文文本拆分为字符序列，估算每个字的发音时长
 */
function segmentText(text, totalDurationSec) {
  // 去掉标点，只保留中文字符
  const cleaned = text.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/g, '');
  if (cleaned.length === 0) return [];

  const charDuration = totalDurationSec / cleaned.length;
  const segments = [];

  // 常见发音长度表（中文拼音）
  const charPinyin = {
    '我': 'wo', '你': 'ni', '他': 'ta', '她': 'ta', '们': 'men',
    '是': 'shi', '的': 'de', '了': 'le', '在': 'zai', '有': 'you',
    '不': 'bu', '这': 'zhe', '那': 'na', '一': 'yi', '个': 'ge',
    '人': 'ren', '大': 'da', '小': 'xiao', '好': 'hao', '来': 'lai',
    '上': 'shang', '中': 'zhong', '下': 'xia', '家': 'jia', '手': 'shou',
    '镯': 'zhuo', '翡': 'fei', '翠': 'cui', '玉': 'yu', '珠': 'zhu',
    '宝': 'bao', '石': 'shi', '金': 'jin', '银': 'yin', '钻': 'zuan',
    '瑞': 'rui', '丽': 'li', '云': 'yun', '南': 'nan', '原': 'yuan',
    '产': 'chan', '地': 'di', '天': 'tian', '然': 'ran', 'A': 'a',
    '货': 'huo', '买': 'mai', '卖': 'mai', '价': 'jia', '钱': 'qian',
    '扣': 'kou', '优': 'you', '惠': 'hui', '直': 'zhi', '播': 'bo',
    '带': 'dai', '赶': 'gan', '快': 'kuai', '秒': 'miao', '杀': 'sha',
    '限': 'xian', '时': 'shi', '抢': 'qiang', '活': 'huo', '动': 'dong',
    '老': 'lao', '铁': 'tie', '朋': 'peng', '友': 'you', '欢': 'huan',
    '迎': 'ying', '谢': 'xie', '关': 'guan', '注': 'zhu', '点': 'dian',
    '赞': 'zan', '评': 'ping', '论': 'lun', '分': 'fen', '享': 'xiang',
    '福': 'fu', '利': 'li', '新': 'xin', '品': 'pin', '款': 'kuan',
    '式': 'shi', '颜': 'yan', '色': 'se', '种': 'zhong', '水': 'shui',
    '头': 'tou', '透': 'tou', '明': 'ming', '光': 'guang', '泽': 'ze',
    '细': 'xi', '腻': 'ni', '质': 'zhi', '感': 'gan', '精': 'jing',
    '美': 'mei', '漂': 'piao', '亮': 'liang', '非': 'fei', '常': 'chang',
  };

  let totalWeight = 0;
  const weightedSegments = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const pinyin = charPinyin[char] || char;
    
    // 查找viseme ID
    let visemeId = 0; // 默认闭嘴
    for (const [py, vId] of Object.entries(PINYIN_TO_VISEME)) {
      if (pinyin.endsWith(py) || pinyin === py) {
        visemeId = vId;
        break;
      }
    }

    // 时长权重（长音节1.2，短音节0.8）
    const isLongSyllable = ['ang', 'eng', 'ing', 'ong', 'iang', 'uang', 'iong'].some(
      ending => (typeof pinyin === 'string' && pinyin.endsWith(ending))
    );
    const weight = isLongSyllable ? 1.2 : 0.9;
    totalWeight += weight;

    weightedSegments.push({
      char,
      pinyin,
      visemeId,
      weight,
      blendshape: VISEME_BLENDSHAPE_MAP[visemeId] || 'A',
      duration: 0, // will calculate
      startTime: 0, // will calculate
    });
  }

  // 按权重分配实际时长
  let currentTime = 0;
  for (const seg of weightedSegments) {
    seg.duration = (seg.weight / totalWeight) * totalDurationSec;
    seg.startTime = currentTime;
    currentTime += seg.duration;
  }

  return weightedSegments;
}

/**
 * 生成标准Viseme关键帧序列
 * @param {string} text - 说话文本
 * @param {number} audioDurationSec - 音频时长（秒）
 * @param {number} fps - 帧率（默认30fps用于流畅动画）
 */
function generateVisemeSequence(text, audioDurationSec, fps = 30) {
  const segments = segmentText(text, audioDurationSec);
  const frameDuration = 1 / fps;
  const totalFrames = Math.ceil(audioDurationSec * fps);
  const keyframes = [];

  // 插值生成每帧的口型数据
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame * frameDuration;
    
    // 找到当前时间对应的音段
    let currentSeg = null;
    let nextSeg = null;
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (time >= seg.startTime && time < seg.startTime + seg.duration) {
        currentSeg = seg;
        nextSeg = i + 1 < segments.length ? segments[i + 1] : null;
        break;
      }
    }
    
    if (!currentSeg) {
      // 静音/过渡
      keyframes.push({
        frame,
        time: parseFloat(time.toFixed(3)),
        blendshapes: { A: 0, I: 0, U: 0, E: 0, O: 0 },
        silent: true
      });
      continue;
    }

    const progressInSeg = (time - currentSeg.startTime) / currentSeg.duration;
    
    // 使用缓入缓出曲线让口型过渡更自然
    const t = easeInOutQuad(progressInSeg);
    
    const blendshapes = {};
    // 当前音节的blendshape值
    const mainShape = currentSeg.blendshape;
    blendshapes[mainShape] = t < 0.5 ? t * 2 : 2 - t * 2; // 0→1→0 波形
    
    // 如果即将过渡到下一个音，逐渐混入下一个viseme
    if (nextSeg && progressInSeg > 0.6) {
      const blendProgress = (progressInSeg - 0.6) / 0.4;
      const nextShape = nextSeg.blendshape;
      blendshapes[nextShape] = (blendshapes[nextShape] || 0) + blendProgress * 0.5;
    }

    // 确保所有基本shape都有值
    ['A', 'I', 'U', 'E', 'O'].forEach(s => {
      if (!blendshapes[s]) blendshapes[s] = 0;
    });

    keyframes.push({
      frame,
      time: parseFloat(time.toFixed(3)),
      char: currentSeg.char,
      pinyin: currentSeg.pinyin,
      visemeId: currentSeg.visemeId,
      blendshapes,
    });
  }

  return keyframes;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * 从音频文件估算时长（秒）
 */
function getAudioDuration(audioPath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
      { encoding: 'utf8', timeout: 10000 }
    );
    return parseFloat(result.trim()) || 5;
  } catch (e) {
    console.warn('[LipSync] Cannot read audio duration, using estimated:', e.message);
    return 5; // 默认5秒
  }
}

/**
 * 主入口：分析文本+音频 → 生成唇形同步数据
 * @param {string} text - 说话文本
 * @param {string} audioPath - TTS音频文件路径
 * @param {object} options - 可选配置
 */
async function analyzeAndSync(text, audioPath, options = {}) {
  const { fps = 30, outputName } = options;
  
  let audioDuration = options.duration || 5;
  
  // 尝试从音频文件获取真实时长
  if (audioPath && fs.existsSync(audioPath)) {
    audioDuration = getAudioDuration(audioPath);
  }
  
  // 如果文本为空或太短，用音频时长估算
  const textLength = (text || '').replace(/[^\u4e00-\u9fff]/g, '').length;
  if (textLength === 0) {
    audioDuration = audioDuration || 5;
  }
  
  console.log(`[LipSync] 分析文本 ${textLength}字, 音频 ${audioDuration.toFixed(1)}秒`);
  
  const visemes = generateVisemeSequence(text, audioDuration, fps);
  
  // 统计viseme分布
  const visemeStats = {};
  visemes.forEach(v => {
    if (!v.silent) {
      visemeStats[v.visemeId] = (visemeStats[v.visemeId] || 0) + 1;
    }
  });

  const result = {
    text,
    textLength,
    audioDuration,
    fps,
    totalFrames: visemes.length,
    segments: visemes.filter(v => !v.silent).map(v => v.char).join(''),
    visemeStats,
    keyframes: visemes,
  };

  // 保存到文件
  if (outputName !== false) {
    const timestamp = Date.now();
    const fileName = outputName || `lipsync_${timestamp}.json`;
    const outputPath = path.join(LIPSYNC_DIR, fileName);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    result.outputPath = outputPath;
  }

  return result;
}

/**
 * 实时流式唇形同步（用于直播场景）
 * 根据传入的文本片段实时生成口型数据
 */
async function streamLipSync(textChunk, startTime, durationSec, fps = 25) {
  const frameDuration = 1 / fps;
  const totalFrames = Math.ceil(durationSec * fps);
  const keyframes = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = startTime + frame * frameDuration;
    const progress = frame / totalFrames;
    
    // 简化版：使用正弦波模拟说话口型
    const mouthOpen = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
    
    keyframes.push({
      frame,
      time: parseFloat(time.toFixed(3)),
      blendshapes: {
        A: mouthOpen * 0.7,     // 下颌开合
        I: mouthOpen * 0.3,     // 嘴角宽度
        U: (1 - mouthOpen) * 0.2, // 圆唇
      }
    });
  }

  return keyframes;
}

/**
 * 生成简化版唇形数据（不依赖Rhubarb CLI）
 * 纯JS实现，适合无外部依赖环境
 */
async function simpleLipSync(text, totalDurationSec, fps = 30) {
  return analyzeAndSync(text, null, { duration: totalDurationSec, fps, outputName: false });
}

export {
  analyzeAndSync,
  streamLipSync,
  simpleLipSync,
  generateVisemeSequence,
  segmentText,
  getAudioDuration,
  PINYIN_TO_VISEME,
  VISEME_BLENDSHAPE_MAP,
};
