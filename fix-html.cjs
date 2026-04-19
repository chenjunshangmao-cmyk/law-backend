const fs = require('fs');

let html = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/index.html', 'utf8');

// Fix CSS reference
html = html.replace('/assets/index-CP-Zg9Cl.css', '/assets/main.6c8cfe8a.css');

// Remove diagnostic script (causes confusion)
html = html.replace(/<script>[\s\S]*?setTimeout[\s\S]*?<\/script>/, '');

// Remove debug div
html = html.replace(/<div id="debug-info"[^>]*>[\s\S]*?<\/div>/, '');

fs.writeFileSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/index.html', html);
console.log('HTML fixed');

const files = fs.readdirSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/assets');
console.log('Assets:', files);

// Verify
html = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/index.html', 'utf8');
const jsRef = html.match(/src="([^"]+\.js)"/);
const cssRef = html.match(/href="([^"]+\.css)"/);
console.log('JS:', jsRef ? jsRef[1]+'.js' : 'none');
console.log('CSS:', cssRef ? cssRef[1]+'.css' : 'none');
console.log('HTML length:', html.length);
