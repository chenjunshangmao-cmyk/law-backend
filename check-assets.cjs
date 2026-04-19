const https = require('https');
const url = require('url');

function fetchUrl(targetUrl) {
  return new Promise((resolve) => {
    const req = https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

async function main() {
  const css = await fetchUrl('https://claw-app-2026.pages.dev/assets/index-CP-Zg9Cl.css');
  const js = await fetchUrl('https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js');
  const html = await fetchUrl('https://claw-app-2026.pages.dev/');

  console.log('CSS 状态:', css.status || css.error, '长度:', css.body ? css.body.length : 0);
  console.log('JS 状态:', js.status || js.error, '长度:', js.body ? js.body.length : 0);
  console.log('HTML 状态:', html.status || html.error, '长度:', html.body ? html.body.length : 0);

  if (js.body) {
    console.log('JS包含quick-login:', js.body.includes('quick-login'));
    console.log('JS包含claw://:', js.body.includes('claw://'));
  }

  if (html.body) {
    const scripts = html.body.match(/<script[^>]*>/g);
    const links = html.body.match(/<link[^>]*>/g);
    console.log('HTML scripts:', scripts);
    console.log('HTML links:', links);
  }
}

main();
