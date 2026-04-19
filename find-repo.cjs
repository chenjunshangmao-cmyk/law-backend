const fs = require('fs');
// Find the actual frontend source repo
const content = fs.readFileSync('c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js', 'utf8');
// Find github references
const ghRe = /github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/g;
const matches = [...new Set(content.match(ghRe) || [])];
console.log('GitHub repos found:', matches.slice(0, 10));
