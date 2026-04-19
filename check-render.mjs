import https from 'https';

// 用环境变量里的 Render API Key 查询部署状态
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_xK7YkQr5Z3mN8vT2pL9wHcJdF6e';
const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-xxx'; // 需要从环境变量获取

// 查询 Render 部署
const req = https.request({
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services',
  headers: {
    'Authorization': 'Bearer ' + RENDER_API_KEY,
    'Content-Type': 'application/json'
  }
}, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Render API 状态:', res.statusCode);
    try {
      const services = JSON.parse(d);
      console.log(JSON.stringify(services, null, 2).slice(0, 2000));
    } catch (e) {
      console.log('响应:', d.slice(0, 500));
    }
  });
});
req.on('error', e => console.log('错误:', e.message));
req.end();
