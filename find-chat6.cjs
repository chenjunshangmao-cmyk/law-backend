var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Look at the full chat component area - find where the chat JSX starts
var idx = 1159800;
console.log('Chat component start (1159800):');
console.log(js.substring(idx, idx + 3000));
