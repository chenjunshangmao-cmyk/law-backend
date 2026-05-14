import https from 'https';
https.get('https://claw-app-2026.pages.dev', {timeout: 10000}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('HTML size:', body.length);
    console.log('Has app.js:', body.includes('app.js'));
    console.log('Has root:', body.includes('id="root"'));
    // Get script tags
    const scriptRe = /<script[^>]*src="([^"]+)"[^>]*>/g;
    let m;
    while ((m = scriptRe.exec(body)) !== null) {
      console.log('Script:', m[1]);
    }
  });
}).on('error', e => console.log('Fail:', e.message));
