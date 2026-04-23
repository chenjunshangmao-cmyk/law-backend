const https = require('https');
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'claw-backend-2026.onrender.com', path, method, headers: {'Content-Type':'application/json'} };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request(opts, res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>resolve({s:res.statusCode,b})); });
    r.on('error', reject);
    if(body) r.write(body);
    r.end();
  });
}
(async()=>{
  // 1. 创建订单（写入文件）
  const csn = 'claw-test-persist-' + Date.now();
  const create = await req('POST', '/api/shouqianba/create-order', JSON.stringify({clientSn:csn,totalAmount:1,subject:'test',deviceId:'claw-web-new3'}));
  console.log('Create:', create.s, create.b.substring(0,80));

  // 2. 查询（应该从文件读，返回PENDING）
  await new Promise(r=>setTimeout(r,500));
  const q = await req('GET', '/api/shouqianba/query?sn=' + csn);
  console.log('Query:', q.s, q.b.substring(0,150));
})().catch(console.error);
