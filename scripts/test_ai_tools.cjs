// 测试 AI 工具箱的去除水印 API
const http = require('http');
const fs = require('fs');
const path = require('path');

const testImage = process.argv[2] || 'C:\\Users\\Administrator\\test_watermark.png';
const endpoint = process.argv[3] || 'remove-watermark'; // 'remove-watermark' or 'smart-erase'

if (!fs.existsSync(testImage)) {
  console.error('测试图片不存在:', testImage);
  process.exit(1);
}

const buf = fs.readFileSync(testImage);
const boundary = '----TestBoundary' + Date.now();

// 构建 multipart 请求体
const head = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="image"; filename="test.png"\r\n' +
  'Content-Type: image/png\r\n\r\n'
);
const tail = Buffer.from('\r\n--' + boundary + '--\r\n');
const body = Buffer.concat([head, buf, tail]);

const req = http.request({
  hostname: 'localhost',
  port: 8089,
  path: '/api/ai-tools/' + endpoint,
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length,
    'Cookie': 'token=test'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.data && parsed.data.result) {
        // 保存结果图片
        const outPath = path.join(path.dirname(testImage), 'ai_tools_output.png');
        const imgBuf = Buffer.from(parsed.data.result, 'base64');
        fs.writeFileSync(outPath, imgBuf);
        console.log('✅ 结果图片已保存到:', outPath, '(' + (imgBuf.length / 1024).toFixed(1) + 'KB)');
      }
    } catch (e) {
      console.log('响应解析失败:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.write(body);
req.end();
