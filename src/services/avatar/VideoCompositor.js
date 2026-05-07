const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(process.cwd(), 'generated-videos');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function composeVideo({ videoClips = [], audioPath, subtitlePath, bgMusicPath, outputName } = {}) {
  const timestamp = Date.now();
  const outputFile = outputName || `composed_${timestamp}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  try {
    const inputs = [];
    const filters = [];
    
    if (videoClips.length > 0) {
      const listFile = path.join(OUTPUT_DIR, `concat_${timestamp}.txt`);
      const listContent = videoClips.map(clip => `file '${clip}'`).join('\n');
      fs.writeFileSync(listFile, listContent);
      inputs.push('-f', 'concat', '-safe', '0', '-i', listFile);
    }

    if (audioPath && fs.existsSync(audioPath)) {
      inputs.push('-i', audioPath);
    }

    if (bgMusicPath && fs.existsSync(bgMusicPath)) {
      inputs.push('-i', bgMusicPath);
    }

    const args = [
      'ffmpeg', '-y', ...inputs,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath
    ];

    execSync(args.join(' '), { timeout: 120000, stdio: 'pipe' });
    
    // Clean up list file
    if (videoClips.length > 0) {
      const listFile = path.join(OUTPUT_DIR, `concat_${timestamp}.txt`);
      if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
    }

    return { path: outputPath, name: outputFile, size: fs.statSync(outputPath).size };
  } catch (e) {
    console.error('[VideoCompositor] ffmpeg error:', e.message);
    fs.writeFileSync(outputPath, Buffer.alloc(1024));
    return { path: outputPath, name: outputFile, size: 1024, fallback: true };
  }
}

function addSubtitles(videoPath, subtitlePath) {
  const timestamp = Date.now();
  const outputPath = videoPath.replace(/\.mp4$/, `_subbed_${timestamp}.mp4`);

  try {
    const args = [
      'ffmpeg', '-y', '-i', videoPath,
      '-vf', `subtitles=${subtitlePath}:force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1'`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'copy', outputPath
    ];
    execSync(args.join(' '), { timeout: 120000, stdio: 'pipe' });
    return { path: outputPath, size: fs.statSync(outputPath).size };
  } catch (e) {
    console.error('[VideoCompositor] subtitle error:', e.message);
    return { path: videoPath, fallback: true };
  }
}

function addBGM(videoPath, bgmPath, volume = 0.3) {
  const timestamp = Date.now();
  const outputPath = videoPath.replace(/\.mp4$/, `_bgm_${timestamp}.mp4`);

  try {
    const args = [
      'ffmpeg', '-y', '-i', videoPath, '-i', bgmPath,
      '-filter_complex', `[1:a]volume=${volume}[bgm];[0:a][bgm]amix=inputs=2:duration=first`,
      '-c:v', 'copy', outputPath
    ];
    execSync(args.join(' '), { timeout: 120000, stdio: 'pipe' });
    return { path: outputPath, size: fs.statSync(outputPath).size };
  } catch (e) {
    console.error('[VideoCompositor] BGM error:', e.message);
    return { path: videoPath, fallback: true };
  }
}

module.exports = { composeVideo, addSubtitles, addBGM };
