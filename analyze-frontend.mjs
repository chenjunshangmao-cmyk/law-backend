import https from 'https';
https.get('https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Find all API endpoints
    const apiPattern = /[\"'](https?:\/\/claw-backend[^\"'\s]+|\/api\/payment[^\"'\s]+|\/api\/membership[^\"'\s]+)[\"']/g;
    const apis = [];
    let m;
    while ((m = apiPattern.exec(d)) !== null) apis.push(m[1]);
    console.log('=== API端点 ===');
    [...new Set(apis)].forEach(a => console.log(a));
    
    // Find payment-related code context
    const paymentIdx = d.indexOf('/api/payment');
    if (paymentIdx > -1) {
      console.log('\n=== payment调用上下文 ===');
      console.log(d.substring(Math.max(0, paymentIdx-200), paymentIdx+200));
    }
    
    // Find membership-related code context  
    const membIdx = d.indexOf('/api/membership');
    if (membIdx > -1) {
      console.log('\n=== membership调用上下文 ===');
      console.log(d.substring(Math.max(0, membIdx-100), membIdx+200));
    }
  });
}).on('error', e => console.error(e));
