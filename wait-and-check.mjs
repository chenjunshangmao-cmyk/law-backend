import https from 'https';

const check = () => new Promise(r => {
  https.get({hostname:'claw-backend-2026.onrender.com',port:443,path:'/api/health'}, res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => r({s: res.statusCode, b: d}));
  }).on('error', () => r(null));
});

(async () => {
  for (let i = 0; i < 18; i++) {
    await new Promise(s => setTimeout(s, 10000));
    const r = await check();
    if (r && r.b.match('healthy')) {
      console.log('部署完成!');
      process.exit(0);
    }
    console.log('检查' + (i+1) + '...');
  }
  console.log('超时');
})();
