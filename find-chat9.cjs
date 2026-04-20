var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Check the beginning of the JS for imports
console.log('JS start:', js.substring(0, 500));

// Check for CSS imports
var cssImports = js.match(/import.*\.css['"]/g) || [];
console.log('\nCSS imports:', cssImports);

// Look for emotion css or styled
var emotionIdx = js.indexOf('@emotion');
var styledIdx = js.indexOf('styled.');
console.log('\n@emotion at:', emotionIdx, js.substring(emotionIdx, emotionIdx + 100));
console.log('\nstyled. at:', styledIdx, js.substring(styledIdx, styledIdx + 100));

// Check what CSS files the bundler would have processed
// Look for a CSS string that contains chat styles
// Find all occurrences of "width:100%" or similar in the context of chat
var wideStyles = js.match(/"chat[^"]*":\s*\{[^}]*\}/g) || [];
console.log('\nChat style objects:', wideStyles.slice(0, 5));

// Search for chat style definitions
var i = 0;
var pos = 0;
while ((pos = js.indexOf('chat-window', pos + 1)) > -1 && i < 5) {
  console.log('\nchat-window at', pos, ':', js.substring(Math.max(0, pos - 200), pos + 100));
  i++;
}
