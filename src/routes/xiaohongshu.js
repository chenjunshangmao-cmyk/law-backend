/**
 * 小红书 API 路由
 * 支持：登录、发布图文、发布视频、店铺绑定
 * 文件通过 Base64 传输，不依赖 multer
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { getXiaohongshuInstance } from '../services/xiaohongshuAutomation.js';

const router = express.Router();
const xhs = getXiaohongshuInstance();

const STATE_DIR = path.join(process.cwd(), 'browser-states');
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'xiaohongshu');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 保存 base64 文件到临时目录
 */
function saveBase64File(base64Data, filename) {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('无效的 base64 数据');

  const mimeType = matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';

  // 生成唯一文件名
  const finalName = `${Date.now()}_${filename || `file.${ext}`}`;
  const filePath = path.join(UPLOAD_DIR, finalName);
  fs.writeFileSync(filePath, data);

  return {
    path: filePath,
    mimeType,
    ext,
    originalName: filename || finalName,
  };
}

// =============================================================
// 1. 获取登录二维码
// =============================================================
router.post('/login/qrcode', async (req, res) => {
  try {
    const { accountId } = req.body || {};
    await xhs.createContext(accountId, { headless: false });
    const qrData = await xhs.getLoginQRCode();

    res.json({
      success: true,
      data: {
        qrImage: qrData.screenshot,
        loginUrl: qrData.loginUrl,
        tip: '请使用小红书App扫码登录',
      },
    });
  } catch (error) {
    console.error('[小红书] 获取二维码失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 2. 轮询等待登录完成
// =============================================================
router.post('/login/wait', async (req, res) => {
  try {
    const { accountId, timeout = 120000 } = req.body || {};
    const loggedIn = await xhs.waitForLogin(timeout);

    if (loggedIn) {
      await xhs.saveSession(accountId);
      res.json({ success: true, data: { loggedIn: true } });
    } else {
      res.json({ success: false, error: '登录超时', code: 'TIMEOUT' });
    }
  } catch (error) {
    console.error('[小红书] 等待登录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 3. 检查登录状态
// =============================================================
router.get('/login/status', async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const hasSession = xhs.hasSavedSession(accountId);

    let isValid = false;
    if (hasSession) {
      isValid = await xhs.validateSession(accountId);
    }

    res.json({
      success: true,
      data: {
        hasSession,
        loggedIn: isValid,
        accountId: accountId || null,
      },
    });
  } catch (error) {
    console.error('[小红书] 检查状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 3.5 小红书合规检测（发布前自动扫描敏感词）
// =============================================================

// 小红书敏感词/违禁词库
const XHS_BLOCKED_WORDS = {
  // 引流违规（封号级别）
  contact: [
    '微信', 'WeChat', 'wechat', '扫码加', '加我微信',
    '私信我', '私聊', '加V', '加v',
    'QQ', 'qq号', '手机号', '电话',
    '二维码', '扫码', '扫一扫',
  ],
  // 价格促销
  price: [
    '多少钱', '价格', '原价', '现价', '只要',
    '优惠', '折扣', '限时', '秒杀', '抢购', '包邮',
    '免费', '白送', '送XX', '买一送',
    '下单', '购买链接', '点击购买', '去我店',
  ],
  // 广告法绝对化用语
  absolute: [
    '最好', '第一', '唯一', '全网', '独家',
    '绝对', '100%', '百分百', '无敌',
    '国家级', '顶级', '极品', '王牌',
  ],
  // 外部平台引流
  external: [
    '淘宝', '天猫', '京东', '拼多多', '抖音号',
    '快手号', '闲鱼', '1688',
  ],
};

/**
 * 检测内容是否包含小红书违规词
 * @returns {{ safe: boolean, warnings: string[] }}
 */
function checkXhsCompliance(title, content, tags = []) {
  const text = `${title} ${content} ${tags.join(' ')}`.toLowerCase();
  const warnings = [];

  for (const [category, words] of Object.entries(XHS_BLOCKED_WORDS)) {
    for (const word of words) {
      if (text.includes(word.toLowerCase())) {
        warnings.push(`[${category}] 发现敏感词: "${word}"`);
      }
    }
  }

  return {
    safe: warnings.length === 0,
    warnings: warnings.slice(0, 5), // 最多返回5条
    risk: warnings.length >= 3 ? 'high' : warnings.length > 0 ? 'medium' : 'low',
  };
}

// =============================================================
// 4. 发布图文笔记（含合规检测）
// =============================================================
router.post('/publish/note', async (req, res) => {
  try {
    const {
      accountId,
      title,
      content,
      images,      // base64 图片数组
      tags,
      location,
      isPrivate,
      semiAuto,    // ✅ 半自动模式：填完不点发布
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和正文不能为空' });
    }

    // 合规检测
    const compliance = checkXhsCompliance(title, content, tags || []);
    if (!compliance.safe) {
      console.warn('[小红书] ⚠️ 内容合规警告:', compliance.warnings);
      if (compliance.risk === 'high') {
        return res.status(400).json({
          success: false,
          error: '内容包含高风险敏感词，请修改后重试',
          code: 'COMPLIANCE_HIGH_RISK',
          warnings: compliance.warnings,
        });
      }
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: '请提供至少一张图片（base64）' });
    }

    const hasSession = xhs.hasSavedSession(accountId);
    if (!hasSession) {
      // 扩展同步的账号没有 Playwright session，需要通过 Chrome 扩展在本地浏览器发布
      return res.status(401).json({
        success: false,
        error: '此账号通过Chrome扩展同步，需要通过扩展在浏览器中发布',
        code: 'NEED_EXTENSION_PUBLISH',
        publishData: { accountId, title, content, images, tags, location, isPrivate },
      });
    }

    // 将 base64 图片保存为临时文件
    const imageFiles = images.map((img, i) => saveBase64File(img, `image_${i}.jpg`));

    // 半自动 → 有头浏览器，方便用户手动点发布
    await xhs.createContext(accountId, { headless: semiAuto ? false : true });

    const result = await xhs.publishNote({
      images: imageFiles.map(f => f.path),
      title,
      content,
      tags: tags || [],
      location: location || '',
      isPrivate: isPrivate || false,
      accountId: accountId || 'default',
      semiAuto: !!semiAuto,
    });

    // 半自动模式：不关闭浏览器，让用户手动点发布
    if (!semiAuto) {
      await xhs.close();
    }

    // 清理临时图片文件
    imageFiles.forEach(f => {
      try { fs.unlinkSync(f.path); } catch {}
    });

    res.json({
      success: true,
      data: result,
      message: semiAuto ? '内容已填充，请在浏览器窗口手动点击【发布】' : '图文发布成功！',
      ...(compliance.warnings.length > 0 ? { complianceWarning: compliance.warnings } : {}),
    });
  } catch (error) {
    console.error('[小红书] 发布图文失败:', error);
    if (!semiAuto) {
      await xhs.close().catch(() => {});
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 5. 发布视频笔记（含合规检测）
// =============================================================
router.post('/publish/video', async (req, res) => {
  try {
    const {
      accountId,
      title,
      content,
      videoBase64,    // 视频文件的 base64
      coverBase64,    // 封面图片 base64（可选）
      videoName,      // 视频文件名（可选）
      tags,
      location,
      isPrivate,
      semiAuto,      // ✅ 半自动模式
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和正文不能为空' });
    }

    // 合规检测
    const compliance = checkXhsCompliance(title, content, tags || []);
    if (!compliance.safe) {
      console.warn('[小红书] ⚠️ 视频内容合规警告:', compliance.warnings);
      if (compliance.risk === 'high') {
        return res.status(400).json({
          success: false,
          error: '内容包含高风险敏感词，请修改后重试',
          code: 'COMPLIANCE_HIGH_RISK',
          warnings: compliance.warnings,
        });
      }
    }

    if (!videoBase64) {
      return res.status(400).json({ success: false, error: '请提供视频文件（base64）' });
    }

    const hasSession = xhs.hasSavedSession(accountId);
    if (!hasSession) {
      return res.status(401).json({ success: false, error: '请先登录小红书账号', code: 'NEED_LOGIN' });
    }

    // 保存视频文件
    const videoFile = saveBase64File(videoBase64, videoName || 'video.mp4');

    // 保存封面（如果有）
    let coverFile = null;
    if (coverBase64) {
      coverFile = saveBase64File(coverBase64, 'cover.jpg');
    }

    // 半自动 → 有头浏览器
    await xhs.createContext(accountId, { headless: semiAuto ? false : true });

    const result = await xhs.publishVideo({
      videoPath: videoFile.path,
      coverImage: coverFile?.path,
      title,
      content,
      tags: tags || [],
      location: location || '',
      isPrivate: isPrivate || false,
      semiAuto: !!semiAuto,
    });

    // 半自动模式：不关闭浏览器
    if (!semiAuto) {
      await xhs.close();
    }

    // 清理临时文件
    try { fs.unlinkSync(videoFile.path); } catch {}
    if (coverFile) { try { fs.unlinkSync(coverFile.path); } catch {} }

    res.json({
      success: true,
      data: result,
      message: semiAuto ? '内容已填充，请在浏览器窗口手动点击【发布】' : '视频发布成功！',
    });
  } catch (error) {
    console.error('[小红书] 发布视频失败:', error);
    if (!semiAuto) {
      await xhs.close().catch(() => {});
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 6. 获取店铺/账号信息
// =============================================================
router.get('/shop/info', async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const hasSession = xhs.hasSavedSession(accountId);

    if (!hasSession) {
      return res.status(401).json({ success: false, error: '请先登录小红书账号', code: 'NEED_LOGIN' });
    }

    await xhs.createContext(accountId, { headless: true });
    const shopInfo = await xhs.getShopInfo();
    await xhs.close();

    res.json({
      success: true,
      data: shopInfo,
    });
  } catch (error) {
    console.error('[小红书] 获取店铺信息失败:', error);
    await xhs.close().catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 7. 启动绑定店铺流程
// =============================================================
router.post('/shop/bind', async (req, res) => {
  try {
    const { accountId } = req.body || {};
    if (!accountId) {
      return res.status(400).json({ success: false, error: '请提供账号标识' });
    }

    // 启动浏览器让用户手动登录小红书创作者中心
    await xhs.createContext(accountId, { headless: false });
    await xhs.gotoLogin();

    res.json({
      success: true,
      data: {
        message: '浏览器已打开，请在小红书登录页面完成登录',
        tip: '登录后调用 /api/xiaohongshu/login/wait 等待登录完成',
      },
    });
  } catch (error) {
    console.error('[小红书] 绑定店铺失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 8. 获取已绑定的账号列表
// =============================================================
router.get('/accounts', async (req, res) => {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      return res.json({ success: true, data: { accounts: [], total: 0 } });
    }

    const accounts = fs.readdirSync(STATE_DIR)
      .filter(f => f.startsWith('xiaohongshu_') && f.endsWith('.json'))
      .map(f => ({
        accountId: f.replace('xiaohongshu_', '').replace('.json', ''),
        displayName: f === 'xiaohongshu_default.json' ? '默认账号' : f.replace('xiaohongshu_', '').replace('.json', ''),
        bound: true,
        boundAt: fs.statSync(path.join(STATE_DIR, f)).mtime.toISOString(),
      }));

    res.json({
      success: true,
      data: { accounts, total: accounts.length },
    });
  } catch (error) {
    console.error('[小红书] 获取账号列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 9. 解绑/移除账号
// =============================================================
router.delete('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const stateFile = path.join(STATE_DIR, `xiaohongshu_${accountId}.json`);

    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }

    res.json({ success: true, message: `账号 ${accountId} 已解绑` });
  } catch (error) {
    console.error('[小红书] 解绑失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 10. 系统状态
// =============================================================
router.get('/status', async (req, res) => {
  try {
    const sessions = fs.existsSync(STATE_DIR)
      ? fs.readdirSync(STATE_DIR).filter(f => f.startsWith('xiaohongshu_'))
      : [];

    res.json({
      success: true,
      data: {
        boundAccounts: sessions.map(f => ({
          id: f.replace('xiaohongshu_', '').replace('.json', ''),
        })),
        total: sessions.length,
        uploadDir: UPLOAD_DIR,
      },
    });
  } catch (error) {
    console.error('[小红书] 获取状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// AI 配置（复用百炼，与 generate.js 共享 env）
// =============================================================
const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';
const BAILIAN_BASE_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_API_KEY = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';

/**
 * 百炼文本调用（Qwen）
 */
async function callQwen(messages, model = 'qwen-turbo') {
  const response = await fetch(`${BAILIAN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BAILIAN_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Qwen API错误: ${response.status} - ${errText}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 百炼 Qwen-VL 多模态识图
 * imageBase64: "data:image/jpeg;base64,..."
 */
async function callQwenVL(imageBase64, prompt) {
  // Qwen3-VL 需要通过 image_url 传 base64
  // 2026-04: 升级到 qwen3-vl-plus（比旧 qwen-vl-plus 识别精度大幅提升）
  const response = await fetch(`${BAILIAN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BAILIAN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen3-vl-plus',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`QwenVL API错误: ${response.status} - ${errText}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 百炼 Wanx 图生图（image-to-image / style transfer）
 * 使用 Wan 2.7 模型 + messages 格式，支持 base64 直接传入（不再需要临时文件URL）
 */
async function callWanxImageToImage(imageSource, prompt, style = 'product') {
  // 风格映射到电商实用 prompt（wan2.7 用 prompt 控制风格）
  const STYLE_PROMPTS = {
    product: '生成电商产品白底图，纯白背景，产品居中，专业影棚灯光，高清质感，适合电商平台主图',
    lifestyle: '生成电商生活场景图，产品融入真实家居/生活场景，温馨自然光，氛围感强，适合小红书种草',
    flatlay: '生成电商平铺摆拍图，俯视角度，产品与配饰精心摆放在桌面上，ins风布景，简洁高级',
    model: '生成电商模特展示图，模特使用/穿着产品，自然姿态，户外或室内场景，真实感强',
    detail: '生成电商细节特写图，放大产品材质/工艺细节，微距镜头质感，突出品质感',
    comparison: '生成电商对比展示图，产品使用前后对比或尺寸参照，信息清晰，直观展示效果',
    unboxing: '生成电商开箱展示图，产品精美包装打开状态，配件齐全展示，仪式感强',
    aesthetic: '生成电商氛围感图片，柔和光影，高级色调，ins风构图，突出产品调性和生活方式',
    // 兼容旧风格值
    general: '生成高质量产品图，商业摄影风格',
  };

  const effectivePrompt = prompt || STYLE_PROMPTS[style] || STYLE_PROMPTS.product;

  // 发起异步任务
  const submitResp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wan2.7-image',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageSource },  // 支持 URL 或 base64（data:image/jpeg;base64,...）
              { text: effectivePrompt },
            ],
          },
        ],
      },
      parameters: {
        n: 1,
        size: '1K',
      },
    }),
  });

  if (!submitResp.ok) {
    const errText = await submitResp.text();
    throw new Error(`Wanx提交任务失败: ${submitResp.status} - ${errText}`);
  }
  const submitData = await submitResp.json();
  const taskId = submitData.output?.task_id;
  if (!taskId) throw new Error('Wanx未返回任务ID');

  // 轮询等待任务完成（最多 90 秒，wan2.7 比 v1 慢）
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pollResp = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      { headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` } }
    );
    const pollData = await pollResp.json();
    const status = pollData.output?.task_status;

    if (status === 'SUCCEEDED') {
      // wan2.7 返回格式: output.choices[0].message.content[0].image
      const resultUrl = pollData.output?.choices?.[0]?.message?.content?.[0]?.image
        || pollData.output?.results?.[0]?.url;  // 兼容旧格式
      if (!resultUrl) throw new Error('Wanx未返回图片URL');
      return resultUrl;
    } else if (status === 'FAILED') {
      const msg = pollData.output?.message || pollData.output?.choices?.[0]?.message?.content?.[0]?.text || '未知原因';
      throw new Error(`Wanx任务失败: ${msg}`);
    }
    // RUNNING / PENDING 继续等待
  }
  throw new Error('Wanx任务超时（90秒）');
}

/**
 * 百炼 Wanx 文生图（text-to-image）
 * 使用 Wan 2.7 模型 + messages 格式
 */
async function callWanxTextToImage(prompt, style = 'product') {
  // 电商风格 prompt 前缀
  const STYLE_PREFIXES = {
    product: '电商产品白底图，纯白背景，专业影棚灯光，高清质感：',
    lifestyle: '电商生活场景图，产品融入真实场景，温馨自然光：',
    flatlay: '电商平铺摆拍图，俯视ins风布景，简洁高级：',
    model: '电商模特展示图，自然姿态，真实场景：',
    detail: '电商细节特写图，微距质感，突出品质：',
    comparison: '电商对比展示图，信息清晰直观：',
    unboxing: '电商开箱展示图，精美包装，仪式感：',
    aesthetic: '电商氛围感图，柔和光影，高级色调ins风：',
    general: '高质量产品图，商业摄影风格：',
  };

  const effectivePrompt = (STYLE_PREFIXES[style] || STYLE_PREFIXES.product) + prompt;
  const submitResp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wan2.7-image',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { text: effectivePrompt },
            ],
          },
        ],
      },
      parameters: {
        n: 1,
        size: '1K',
      },
    }),
  });

  if (!submitResp.ok) {
    const errText = await submitResp.text();
    throw new Error(`Wanx文生图提交失败: ${submitResp.status} - ${errText}`);
  }
  const submitData = await submitResp.json();
  const taskId = submitData.output?.task_id;
  if (!taskId) throw new Error('Wanx文生图未返回任务ID');

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pollResp = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      { headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` } }
    );
    const pollData = await pollResp.json();
    const status = pollData.output?.task_status;

    if (status === 'SUCCEEDED') {
      const resultUrl = pollData.output?.choices?.[0]?.message?.content?.[0]?.image
        || pollData.output?.results?.[0]?.url;
      if (!resultUrl) throw new Error('Wanx文生图未返回URL');
      return resultUrl;
    } else if (status === 'FAILED') {
      const msg = pollData.output?.message || '未知原因';
      throw new Error(`Wanx文生图失败: ${msg}`);
    }
  }
  throw new Error('Wanx文生图超时（90秒）');
}

// Wanx 风格映射（图生图）
const WANX_STYLE_MAP = {
  anime: 0,       // 水墨动漫
  oil: 1,         // 油画质感
  watercolor: 2,  // 水彩
  sketch: 3,      // 素描
  flat: 4,        // 扁平插画
  pop: 5,         // 流行艺术
};

// Wanx 文生图风格
const WANX_T2I_STYLE_MAP = {
  general: '<auto>',
  anime: '<anime>',
  realistic: '<photography>',
  art: '<art>',
};

// =============================================================
// 11b. AI 批量文案生成（一次生成4种风格 — 合规版）
// POST /api/xiaohongshu/ai/generate-multi-content
// =============================================================
router.post('/ai/generate-multi-content', async (req, res) => {
  try {
    const {
      imageDescription,
      productName,
      extraInfo,
    } = req.body || {};

    const effectiveDesc = (imageDescription || productName || '').trim();
    if (!effectiveDesc) {
      return res.status(400).json({ success: false, error: '请提供图片描述或产品名称' });
    }

    const systemPrompt = `你是一个普通的小红书用户，偶尔分享自己买过、用过的东西。
你的笔记风格：真实自然，像是在跟朋友聊天，偶尔有口语化表达和小瑕疵反而更真实。

⚠️ 小红书合规要求（必须遵守）：
- 禁止使用任何直接推销话术（如"快买""必入""限时"）
- 禁止出现价格、微信号、二维码、链接
- 禁止使用绝对化广告用语（最好、第一、全网、独家）
- 不要刻意引导购买，只是分享个人体验
- 不要堆积关键词，正常说话即可

请为同一产品生成4种不同角度的生活分享：
1. 购物开箱 — 收到了XX，分享一下第一印象
2. 使用心得 — 用了一段时间的真实感受
3. 日常碎片 — 把产品自然融入某天的生活记录里
4. 对比感受 — 和之前用过的东西对比一下

要求：
- 标题：自然有生活感，15字以内，可以有一两个emoji点缀，不要标题党
- 正文：150-300字，像发朋友圈一样自然，段落短小，偶尔用"哈哈哈""绝了"这种真实语气
- 标签：3-5个精准话题就够了`

    const userPrompt = `产品信息：${effectiveDesc}
${productName && productName !== effectiveDesc ? `产品名称：${productName}` : ''}
${extraInfo ? `补充：${extraInfo}` : ''}

输出纯JSON（不要markdown代码块）：
{
  "plans": [
    {"style":"购物开箱","title":"标题","content":"正文","tags":["标签1","标签2","标签3"]},
    {"style":"使用心得","title":"标题","content":"正文","tags":["标签1","标签2"]},
    {"style":"日常碎片","title":"标题","content":"正文","tags":["标签1","标签2","标签3"]},
    {"style":"对比感受","title":"标题","content":"正文","tags":["标签1","标签2"]}
  ]
}`;

    const rawContent = await callQwen([
      { role: 'system', content: '你是一位小红书爆款内容创作者。' },
      { role: 'user', content: systemPrompt },
    ]);

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result?.plans || !Array.isArray(result.plans)) {
      // fallback：用单次生成结果拆分
      result = {
        plans: [
          { style: '种草推荐', title: '', content: rawContent, tags: [] },
          { style: '真实测评', title: '', content: '', tags: [] },
          { style: '日常分享', title: '', content: '', tags: [] },
          { style: '好物带货', title: '', content: '', tags: [] },
        ],
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[小红书AI] 批量文案生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 11. AI 文案生成（基于图片描述或关键词 — 合规版）
// POST /api/xiaohongshu/ai/generate-content
// =============================================================
router.post('/ai/generate-content', async (req, res) => {
  try {
    const {
      imageDescription,
      productName,
      style,
      extraInfo,
    } = req.body || {};

    if (!imageDescription && !productName) {
      return res.status(400).json({ success: false, error: '请提供图片描述或产品名称' });
    }

    const stylePrompts = {
      '开箱': '分享刚收到一个东西的第一印象，像给朋友发消息一样自然',
      '心得': '用了XX一段时间的真实感受，有好有坏，诚实分享',
      '日常': '把产品自然融入今天的生活记录里，不刻意提它',
      '对比': '和之前用过的东西简单对比一下，客观不吹不黑',
    };
    const selectedStyle = stylePrompts[style] || stylePrompts['心得'];

    const systemPrompt = `你是一个普通小红书用户，偶尔记录自己的购物和生活。
风格：真实、自然、像发朋友圈，不需要完美。偶尔用"吧""啊""哈哈哈"更真实。

⚠️ 严禁以下行为：
- 推销话术（快买、必入、限时、抢购）
- 价格、微信号、二维码、链接
- 绝对化用语（最好、第一、全网、独家、无敌）
- 刻意引导购买行为
- 关键词堆砌、营销号语气`;

    const userPrompt = `${selectedStyle}

参考信息：${imageDescription || productName}
${productName ? `名称：${productName}` : ''}
${extraInfo ? `补充：${extraInfo}` : ''}

写一篇150-300字的笔记，标题15字以内自然有生活感，标签3-5个。

输出纯JSON：{"title":"标题","content":"正文","tags":["标签1","标签2"]}`;

    const rawContent = await callQwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // 解析 JSON
    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result || !result.title) {
      // 无法解析JSON时，返回原始文本
      result = {
        title: '',
        content: rawContent,
        tags: [],
        _raw: true,
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[小红书AI] 文案生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 12. AI 图片识别（上传图→识别产品信息）
// POST /api/xiaohongshu/ai/analyze-image
// =============================================================
router.post('/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: '请提供图片（base64）' });
    }

    const prompt = `你是一位专业的跨境电商选品专家。请仔细观察这张图片，精准识别其中的商品信息。

要求：
- 如果图片中有多个商品，以最醒目的主商品为准
- 产品名称要具体（如"女童碎花连衣裙"而非"衣服"）
- 类目要精确到三级类目
- 特点要从视觉可辨识的角度提取

请严格以JSON格式输出：
{
  "productName": "具体产品名称（15字以内）",
  "category": "一级类目/二级类目/三级类目",
  "features": ["视觉可见特点1", "视觉可见特点2", "视觉可见特点3"],
  "targetAudience": "适合人群",
  "description": "3-5句话详细描述这个产品的外观、材质、用途"
}`;

    const rawContent = await callQwenVL(imageBase64, prompt);

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      result = { productName: '', category: '', features: [], targetAudience: '', description: rawContent };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[小红书AI] 图片识别失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 13. AI 图生图（Wanx 2.7 风格迁移）
// POST /api/xiaohongshu/ai/image-to-image
// wan2.7 支持直接传入 base64，不再需要临时文件URL
// =============================================================
router.post('/ai/image-to-image', async (req, res) => {
  try {
    let { imageBase64, style = 'product', prompt: customPrompt } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: '请提供图片（base64）' });
    }

    // 如果传入的是 URL 而非 base64，先下载并转 base64
    if (imageBase64.startsWith('http')) {
      console.log('[小红书AI] 图生图：传入URL，先下载转base64...', imageBase64.substring(0, 80));
      try {
        const imgResp = await fetch(imageBase64);
        if (!imgResp.ok) throw new Error(`下载图片失败: ${imgResp.status}`);
        const imgBuffer = await imgResp.buffer();
        const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
        imageBase64 = `data:${contentType};base64,${imgBuffer.toString('base64')}`;
      } catch (dlErr) {
        return res.status(400).json({ success: false, error: `图片URL下载失败: ${dlErr.message}` });
      }
    }

    // 校验 base64 格式
    if (!imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: '图片格式无效，需要 data:image/xxx;base64,... 格式' });
    }

    // 直接传 base64 给 Wanx 2.7（不再需要保存临时文件构造 URL）
    const resultUrl = await callWanxImageToImage(imageBase64, customPrompt || '', style);

    res.json({ success: true, data: { url: resultUrl, style } });
  } catch (error) {
    console.error('[小红书AI] 图生图失败:', error);
    // 区分 Wanx API 错误和内部错误
    if (error.message?.includes('resolution must be at least')) {
      return res.status(400).json({ success: false, error: '图片分辨率太低，需要至少 240x240 像素' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 14. AI 文生图（Wanx 文生图）
// POST /api/xiaohongshu/ai/text-to-image
// =============================================================
router.post('/ai/text-to-image', async (req, res) => {
  try {
    const { prompt, style = 'product' } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ success: false, error: '请提供图片描述' });
    }

    const resultUrl = await callWanxTextToImage(prompt, style);
    res.json({ success: true, data: { url: resultUrl } });
  } catch (error) {
    console.error('[小红书AI] 文生图失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 15. 产品链接抓取 → AI 生成完整发布资料（核心流程）
// POST /api/xiaohongshu/ai/fetch-product
// =============================================================

/**
 * 下载网络图片转 base64
 */
async function downloadImageToBase64(imageUrl) {
  try {
    const resp = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      },
    });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
    return base64;
  } catch {
    return null;
  }
}

/**
 * 通用网页抓取（不需要 Playwright 的轻量方案）
 */
async function fetchUrlContent(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    const html = await resp.text();
    return html;
  } catch (err) {
    throw new Error(`无法访问链接: ${err.message}`);
  }
}

/**
 * 从 HTML 提取产品信息（通用，不依赖浏览器自动化）
 */
function extractProductFromHtml(html, url) {
  // 标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const title = (ogTitleMatch?.[1] || titleMatch?.[1] || '').replace(/[-_|–].*$/, '').trim();

  // 描述
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const description = (ogDescMatch?.[1] || descMatch?.[1] || '').trim();

  // 图片（提取所有商品图）
  const images = [];
  const imgRegex = /(?:src|data-src|data-original)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 15) {
    const imgUrl = imgMatch[1];
    // 过滤掉小图标/logo
    if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('avatar') || imgUrl.includes('sprite')) continue;
    if (imgUrl.includes('logo')) continue;
    if (imgUrl.length < 40) continue;
    // 去重
    if (!images.some(i => i.replace(/\?.*$/, '') === imgUrl.replace(/\?.*$/, ''))) {
      images.push(imgUrl);
    }
  }

  // 价格
  const priceText = html.match(/(?:price| Price|价格|优惠价)["'\s:]*[>"]?\s*(?:¥|￥|\$)?\s*([\d,.]+)/i);
  const price = priceText ? parseFloat(priceText[1].replace(/,/g, '')) : null;

  // 平台检测
  let platform = 'unknown';
  if (url.includes('1688.com')) platform = '1688';
  else if (url.includes('taobao.com') || url.includes('tmall.com')) platform = 'taobao';
  else if (url.includes('jd.com')) platform = 'jd';
  else if (url.includes('pinduoduo.com') || url.includes('yangkeduo.com')) platform = 'pdd';
  else if (url.includes('amazon.')) platform = 'amazon';
  else if (url.includes('aliexpress.com')) platform = 'aliexpress';
  else if (url.includes('shein.com')) platform = 'shein';
  else if (url.includes('temu.com')) platform = 'temu';
  else if (url.includes('etsy.com')) platform = 'etsy';

  return { title, description, images, price, platform };
}

router.post('/ai/fetch-product', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: '请提供产品链接' });
    }

    setMessageSafe(res, '🔍 正在抓取产品信息...');

    // Step 1: 抓取 HTML
    const html = await fetchUrlContent(url);
    const product = extractProductFromHtml(html, url);
    product.sourceUrl = url;

    if (!product.title) {
      return res.status(400).json({ success: false, error: '无法提取产品信息，请确认链接正确' });
    }

    // Step 2: 下载图片转 base64（最多取前6张）
    setMessageSafe(res, `📸 找到 ${product.images.length} 张图片，正在下载...`);
    const base64Images = [];
    const imageUrls = [];
    for (const imgUrl of product.images.slice(0, 6)) {
      const b64 = await downloadImageToBase64(imgUrl);
      if (b64) {
        base64Images.push(b64);
        imageUrls.push(imgUrl);
      }
    }

    res.json({
      success: true,
      data: {
        title: product.title,
        description: product.description,
        price: product.price,
        platform: product.platform,
        sourceUrl: url,
        images: base64Images,    // base64 用于识图/图生图
        imageUrls: imageUrls,   // 原始 URL 用于展示
      },
    });
  } catch (error) {
    console.error('[小红书AI] 产品抓取失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 用于 SSE 场景的辅助（当前简化为直接返回）
function setMessageSafe(res, msg) {
  // 不做 SSE，仅 console
  console.log(`[小红书AI] ${msg}`);
}

// =============================================================
// 16. AI 竞品分析 + 高竞争力产品详情全套生成
// POST /api/xiaohongshu/ai/competitive-analysis
// =============================================================
router.post('/ai/competitive-analysis', async (req, res) => {
  try {
    const { productData } = req.body || {};
    if (!productData) {
      return res.status(400).json({ success: false, error: '请提供产品信息' });
    }

    const { title, description, price, platform, images } = productData;

    // Step 1: 用 Qwen-VL 识别第一张图，获取产品细节
    let visualInfo = '';
    if (images && images.length > 0 && images[0].startsWith('data:')) {
      try {
        const visualPrompt = `仔细观察这张产品图片，描述：
1. 产品外观（颜色、材质、形状、设计特点）
2. 产品场景/使用环境
3. 目标用户群
4. 与同类产品相比的视觉优势
请简洁回答，100字以内。`;
        visualInfo = await callQwenVL(images[0], visualPrompt);
      } catch { /* 识图失败不影响后续 */ }
    }

    // Step 2: 竞品分析 + 生成全套发布资料
    const systemPrompt = `你是一位资深小红书运营专家和电商分析师。
你的核心能力：
1. 分析全网竞品数据，找出爆款产品共有的成功要素
2. 基于竞品分析，为产品生成有差异化和竞争力的发布资料
3. 擅长小红书文案写作，了解什么内容容易爆（种草笔记平均5000+赞）

你的分析逻辑：
- 分析该品类在小红书的爆款趋势和用户痛点
- 找出竞品的共同优势和我们产品的差异化机会
- 生成的内容必须在视觉效果、文案吸引力、标签覆盖上有竞争力`;

    const userPrompt = `请对以下产品进行深度竞品分析，并生成一套完整的小红书发布资料。

## 原始产品信息
- 产品名称：${title || '未知'}
- 来源平台：${platform || '未知'}
- 价格：${price ? `¥${price}` : '未知'}
- 产品描述：${description || '无'}
${visualInfo ? `\n## AI 识图结果\n${visualInfo}` : ''}

## 请完成以下任务

### Part 1: 竞品分析（内部思考）
分析该品类在小红书上的：
- 爆款产品的共同特征
- 用户最关注的卖点（材质/设计/价格/功能）
- 热门笔记的文案套路和标签策略
- 该产品的差异化竞争机会

### Part 2: 生成发布资料

请生成 **2套** 不同风格的小红书笔记资料，每套包含：

**方案A：种草推荐风**（适合日常种草）
**方案B：测评对比风**（适合专业测评）

每套包含：
1. **标题**：15-20字，有冲击力，带emoji，有好奇心/紧迫感/反差感
2. **正文**：300-500字，口语化，像真实用户分享，分段清晰
   - 开头：制造共鸣/痛点（2-3句）
   - 中间：产品亮点描述，有具体场景（使用体验/效果对比）
   - 结尾：引导互动（提问/求赞/引导评论）
3. **标签**：12-15个，包含大词+精准词+热门词+冷门词组合
4. **定价建议**：基于市场分析给出建议零售价区间
5. **卖点提炼**：3-5个最有竞争力的核心卖点（一句话一个）

请严格以如下JSON格式输出：
{
  "analysis": {
    "marketInsight": "市场分析摘要，2-3句话",
    "topSellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4"],
    "priceSuggestion": "建议零售价区间，如 29.9-39.9",
    "competitorSummary": "竞品概况，1-2句话"
  },
  "planA": {
    "style": "种草推荐",
    "title": "标题",
    "content": "正文内容",
    "tags": ["标签1", "标签2", "...共12-15个"],
    "sellingPoints": ["卖点1", "卖点2", "卖点3"]
  },
  "planB": {
    "style": "测评对比",
    "title": "标题",
    "content": "正文内容",
    "tags": ["标签1", "标签2", "...共12-15个"],
    "sellingPoints": ["卖点1", "卖点2", "卖点3"]
  }
}`;

    const rawContent = await callQwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // 解析 JSON
    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      result = {
        analysis: { marketInsight: rawContent.slice(0, 200) },
        planA: { title: '', content: rawContent, tags: [], sellingPoints: [] },
        planB: { title: '', content: '', tags: [], sellingPoints: [] },
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[小红书AI] 竞品分析失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 17. AI 图生图增强 — 基于竞品分析生成有竞争力的产品图
// POST /api/xiaohongshu/ai/competitive-images
// =============================================================
router.post('/ai/competitive-images', async (req, res) => {
  try {
    const { imageBase64, productTitle, sellingPoints = [], style = 'product' } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: '请提供原始产品图片' });
    }

    // 1. 用 Qwen-VL 分析原图，生成优化的图生图 prompt
    const analysisPrompt = `你是一位电商产品摄影总监。分析这张产品图并生成一个优化的图片描述prompt。
目标：让新图片比原图更有吸引力、更有质感、更适合小红书种草。

产品名：${productTitle || '商品'}
${sellingPoints.length > 0 ? `核心卖点：${sellingPoints.join('、')}` : ''}

请返回一段50-100字的图片描述prompt（英文），用于AI图生图。只返回prompt文本，不要其他内容。`;

    const imgPrompt = await callQwenVL(imageBase64, analysisPrompt);

    // 2. 直接传 base64 给 Wanx 2.7（不再需要临时文件 URL）
    const resultUrl = await callWanxImageToImage(imageBase64, imgPrompt, style);

    res.json({ success: true, data: { url: resultUrl, prompt: imgPrompt, style } });
  } catch (error) {
    console.error('[小红书AI] 竞品图生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 16. 合规检测接口（前端发布前预检）
// POST /api/xiaohongshu/check-compliance
// =============================================================
router.post('/check-compliance', async (req, res) => {
  try {
    const { title, content, tags } = req.body || {};
    if (!title && !content) {
      return res.status(400).json({ success: false, error: '请提供标题或正文' });
    }
    const result = checkXhsCompliance(title || '', content || '', tags || []);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 暴露 uploads 目录（供 Wanx 获取图片）
router.use('/uploads', express.static(UPLOAD_DIR));

export default router;

