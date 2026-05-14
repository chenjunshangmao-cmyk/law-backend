import https from 'https';
https.get('https://claw-app-2026.pages.dev/assets/app.js', {timeout: 10000}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Size:', body.length);
    console.log('Has login:', body.includes('login'));
    console.log('Has FormData:', body.includes('FormData'));
    console.log('Has authFetch:', body.includes('async function S('));
    const i = body.indexOf('async function S(');
    if (i >= 0) console.log('authFetch:', body.substring(i, i + 200));
  });
}).on('error', e => console.log('Fail:', e.message));
