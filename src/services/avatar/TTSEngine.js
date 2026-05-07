const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const AUDIO_DIR = path.join(process.cwd(), 'generated-audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

async function textToSpeech(text, options = {}) {
  const { voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', outputName } = options;
  const timestamp = Date.now();
  const fileName = outputName || `tts_${timestamp}.mp3`;
  const outputPath = path.join(AUDIO_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const args = [
        'edge-tts',
        '--text', text,
        '--voice', voice,
        '--rate', rate,
        '--write-media', outputPath
      ];
      const result = execSync(args.join(' '), { encoding: 'utf8', timeout: 60000 });
      resolve({ path: outputPath, name: fileName, text, voice });
    } catch (e) {
      if (e.message.includes('not found') || e.message.includes('edge-tts')) {
        console.warn('[TTS] edge-tts not installed, using fallback');
        fs.writeFileSync(outputPath, Buffer.alloc(1024));
        resolve({ path: outputPath, name: fileName, text, voice, fallback: true });
      } else {
        reject(e);
      }
    }
  });
}

async function textToSpeechStream(text, options = {}) {
  const { voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%' } = options;
  const timestamp = Date.now();
  const outputPath = path.join(AUDIO_DIR, `stream_${timestamp}.mp3`);

  return new Promise((resolve, reject) => {
    try {
      const proc = spawn('edge-tts', [
        '--text', text,
        '--voice', voice,
        '--rate', rate,
        '--write-media', outputPath
      ]);
      
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve({ path: outputPath, name: `stream_${timestamp}.mp3` });
        } else {
          fs.writeFileSync(outputPath, Buffer.alloc(1024));
          resolve({ path: outputPath, fallback: true });
        }
      });
      
      proc.on('error', () => {
        fs.writeFileSync(outputPath, Buffer.alloc(1024));
        resolve({ path: outputPath, fallback: true });
      });
    } catch (e) {
      fs.writeFileSync(outputPath, Buffer.alloc(1024));
      resolve({ path: outputPath, fallback: true });
    }
  });
}

module.exports = { textToSpeech, textToSpeechStream };
