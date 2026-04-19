const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function main() {
  const url = 'https://claw-frontend.onrender.com/static/js/main.0126e647.js';
  const r = await fetchUrl(url);
  if (r.error) { console.log('Error:', r.error); return; }
  const t = r.body;
  console.log('JS size:', t.length);
  console.log('quick-login:', t.includes('quick-login'));
  console.log('claw://:', t.includes('claw://'));
  console.log('TikTok:', t.includes('TikTok'));

  const matches = t.match(/https?:\/\/[^\s"']+/g) || [];
  const unique = [...new Set(matches)].filter(u => u.includes('onrender') || u.includes('pages.dev'));
  console.log('URLs:', unique.slice(0, 10));
}

main();
