const https = require('https');
https.get('https://claw-app-2026.pages.dev/assets/app.js', {timeout: 10000}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode, 'Size:', body.length);
    // check authFetch
    const hasS = body.includes('async function S(');
    const hasS2 = body.includes('function S(');
    console.log('Has async function S:', hasS);
    console.log('Has function S:', hasS2);
    console.log('Has login:', body.includes('/api/auth/login'));
    console.log('Has FormData:', body.includes('instanceof FormData'));
    // find authFetch
    const idx = hasS ? body.indexOf('async function S(') : body.indexOf('function S(');
    if (idx >= 0) {
      console.log('authFetch:', body.substring(idx, idx + 250));
    }
    // check auth context
    const authIdx = body.indexOf('AuthContext');
    if (authIdx >= 0) {
      console.log('AuthContext found at:', authIdx);
    }
    // check login redirect
    if (body.includes('login') || body.includes('Login')) {
      console.log('Login page present');
    }
  });
}).on('error', e => console.log('Fail:', e.message));
