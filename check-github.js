import https from 'https';
https.get('https://raw.githubusercontent.com/chenjunshangmao-cmyk/law-backend/master/src/index.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = d.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('membership') || l.includes('import') || l.includes('index.')) {
        console.log((i+1) + ': ' + l);
      }
    });
  });
}).on('error', e => console.error(e));
