const https = require('https');
function fetch(url) {
  return new Promise(resolve => {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>resolve({status:res.statusCode,body:d.substring(0,500)}));
    }).on('error',e=>resolve({error:e.message}));
  });
}
async function main() {
  const urls = [
    'https://claw-app-2026.pages.dev/',
    'https://claw-backend-2026.onrender.com/api/health',
    'https://claw-frontend.onrender.com/',
    'https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js',
    'https://claw-app-2026.pages.dev/assets/index-CP-Zg9Cl.css',
  ];
  for (const u of urls) {
    const r = await fetch(u);
    console.log(u.replace('https://',''), '-> status:', r.status || r.error, 'body len:', r.body.length);
  }
}
main().catch(console.error);
