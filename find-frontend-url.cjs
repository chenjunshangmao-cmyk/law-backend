const fs = require('fs');
const content = fs.readFileSync('c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js', 'utf8');
const re = /https?:\/\/[a-z0-9-]+\.pages\.dev[a-z0-9A-Z/?=&._-]*/g;
const matches = [...new Set(content.match(re) || [])];
console.log('pages.dev URLs found:', matches.slice(0, 10));

// Also find api base URLs
const apiRe = /https?:\/\/[a-z0-9-]+\.onrender\.com/g;
const apiMatches = [...new Set(content.match(apiRe) || [])];
console.log('render.com URLs:', apiMatches.slice(0, 5));
