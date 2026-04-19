const https = require('https');
https.get('https://claw-backend-2026.onrender.com/api/health', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log('uptime:', Math.round(j.uptime), 's');
    } catch(e) {
      console.log('HTML:', d.slice(0, 100));
    }
  });
}).on('error', e => console.error(e.message));
