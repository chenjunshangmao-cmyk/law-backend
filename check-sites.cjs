const https = require('https');
const urls = [
  'https://chenjuntrading.cn/',
  'https://claw-app-2026.pages.dev/',
];
urls.forEach(url => {
  https.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
    let d=''; res.on('data',c=>d+=c);
    res.on('end',()=>{
      console.log('\n=== ' + url + ' ===');
      console.log('Status:', res.statusCode, 'Size:', d.length);
      const scripts = d.match(/<script[^>]*>/gi) || [];
      const iframes = d.match(/<iframe[^>]*>/gi) || [];
      const chat = d.match(/chat|客服|tidio|crisp|drift|chatbot|woot/gi) || [];
      console.log('Scripts:', scripts.join('\n').substring(0,800));
      console.log('Iframes:', iframes.join('\n').substring(0,500));
      console.log('Chat refs:', chat.slice(0,10));
      const mainjs = d.match(/index-[a-zA-Z0-9]+\.js/);
      console.log('Main JS:', mainjs);
      console.log('HTML tail:', d.substring(d.length-300));
    });
  }).on('error',e=>console.log(url, e));
});
