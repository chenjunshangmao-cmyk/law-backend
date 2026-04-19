const http = require('http');
// Follow redirect manually
function get(url, depth = 0) {
  return new Promise((resolve) => {
    if (depth > 5) { resolve({ status: -1, final: 'too many redirects' }); return; }
    http.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location;
        console.log(`Redirect ${res.statusCode}: ${url} -> ${loc}`);
        if (loc) get(loc.startsWith('http') ? loc : `http://localhost:3002${loc}`, depth + 1).then(resolve);
        else resolve({ status: res.statusCode, final: 'no location' });
      } else {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          const title = d.match(/<title>(.*?)<\/title>/);
          console.log(`Final: ${res.statusCode} | Title: ${title ? title[1] : 'none'}`);
          resolve({ status: res.statusCode, title: title ? title[1] : null });
        });
      }
    }).on('error', (e) => resolve({ status: -1, error: e.message }));
  });
}
get('http://localhost:3002/browser');
