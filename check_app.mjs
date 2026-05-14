import https from 'https';
https.get('https://claw-app-2026.pages.dev/assets/app.js', {timeout: 15000}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const checks = [
      ['async function S(', 'authFetch'],
      ['async function Ei(', 'publicFetch'],
      ['/api/auth/login', 'login API'],
      ['localStorage.getItem(', 'token read'],
      ['claw_current_user', 'user key'],
      ['async function login', 'login function'],
    ];
    for (const [pattern, label] of checks) {
      console.log(label + ':', body.includes(pattern) ? 'YES' : 'MISSING');
    }
    console.log('First 100 chars:', body.replace(/\n.*/s, '').substring(0, 100));
    const opens = (body.match(/\{/g) || []).length;
    const closes = (body.match(/\}/g) || []).length;
    console.log('Brackets: open=' + opens + ' close=' + closes + ' diff=' + (opens - closes));
  });
}).on('error', e => console.log('Fail:', e.message));
