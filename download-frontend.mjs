import https from 'https';
import fs from 'fs';

const file = fs.createWriteStream('frontend-bundle.js');
https.get('https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js', res => {
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('下载完成，大小:', fs.statSync('frontend-bundle.js').size, '字节');
    
    // Search for payment API calls
    const content = fs.readFileSync('frontend-bundle.js', 'utf8');
    const idx = content.indexOf('payment/create');
    if (idx > 0) {
      console.log('=== payment/create 上下文 ===');
      console.log(content.substring(Math.max(0, idx-300), idx+300));
    }
    const idx2 = content.indexOf('membership/create');
    if (idx2 > 0) {
      console.log('\n=== membership/create 上下文 ===');
      console.log(content.substring(Math.max(0, idx2-200), idx2+300));
    }
    
    // Find all API base URLs
    const baseUrls = content.match(/claw-backend[^\\"')\s]*/g);
    console.log('\n后端地址出现次数:', baseUrls ? baseUrls.length : 0);
    if (baseUrls) console.log([...new Set(baseUrls)]);
  });
}).on('error', e => console.error(e));
