var fs = require('fs');

// Check HTML for inline styles
var html = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/index.html', 'utf8');
console.log('HTML:', html);

// Check all CSS files in complete-deploy
var path = require('path');
var dir = 'C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/assets';
var files = fs.readdirSync(dir);
console.log('\nCSS files in assets:', files);

files.forEach(function(f) {
  if (f.endsWith('.css')) {
    var content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (content.includes('chat-window') || content.includes('customer-chat')) {
      console.log('\nFound in', f, ':');
      var idx = content.indexOf('chat-window');
      console.log(content.substring(idx - 20, idx + 500));
    }
  }
});

// Also check JS
var jsFile = 'C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js';
var js = fs.readFileSync(jsFile, 'utf8');

// Find the CSS definition - look for something like styled component
// Search for all "chat" in a CSS context (after = or :)
var chatIdx = 0;
while ((chatIdx = js.indexOf('.chat-', chatIdx + 1)) > -1) {
  console.log('\n.chat- found at', chatIdx, ':', js.substring(chatIdx - 30, chatIdx + 200));
  if (chatIdx > 1165000) break; // Only look around chat component
}
