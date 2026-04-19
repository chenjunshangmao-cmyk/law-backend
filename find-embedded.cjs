const fs = require('fs');
const content = fs.readFileSync('c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js', 'utf8');

// Find embedded-browser related code
const idx = content.indexOf('embedded-browser');
if (idx !== -1) {
  console.log('Found at index:', idx);
  console.log('Context:', content.slice(Math.max(0, idx - 200), idx + 300));
}
