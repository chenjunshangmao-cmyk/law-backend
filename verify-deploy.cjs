const https = require('https');
async function check(url) {
  return new Promise(resolve => {
    https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>resolve({status:res.statusCode,body:d}));
    }).on('error',e=>resolve({error:e.message}));
  });
}
async function main() {
  const base = 'https://7c2cd30c.claw-app-2026.pages.dev';
  console.log('检查新部署:', base);
  const r = await check(base+'/');
  console.log('HTML status:', r.status, 'len:', r.body.length);
  const jsMatch = r.body.match(/src="([^"]+\.js)"/);
  const cssMatch = r.body.match(/href="([^"]+\.css)"/);
  console.log('JS ref:', jsMatch ? jsMatch[1] : 'none');
  console.log('CSS ref:', cssMatch ? cssMatch[1] : 'none');
  if (jsMatch) {
    const j = await check(base+jsMatch[1]);
    console.log('JS status:', j.status, 'len:', j.body.length, 'quick-login:', j.body.includes('quick-login'), 'claw://:', j.body.includes('claw://'));
  }
  if (cssMatch) {
    const c = await check(base+cssMatch[1]);
    console.log('CSS status:', c.status, 'len:', c.body.length, 'isHTMLnotCSS:', c.body.startsWith('<!'));
  }
  // Also check production URL
  console.log('\n检查生产URL: claw-app-2026.pages.dev');
  const prod = await check('https://claw-app-2026.pages.dev/');
  const prodCss = prod.body.match(/href="([^"]+\.css)"/);
  if (prodCss) {
    const c = await check('https://claw-app-2026.pages.dev'+prodCss[1]);
    console.log('生产CSS:', c.status, 'len:', c.body.length, 'isHTMLnotCSS:', c.body.startsWith('<!'));
  }
}
main().catch(console.error);
