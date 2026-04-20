var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Look around chat-window area
var idx = 1160018;
console.log('chat-window context:', js.substring(idx - 200, idx + 500));

// Find the CSS definition for chat-window
var cssIdx = js.indexOf('.chat-window');
if (cssIdx > -1) {
  console.log('\n.chat-window CSS:', js.substring(cssIdx - 20, cssIdx + 800));
}

// Find customer-chat-container CSS
var containerIdx = js.indexOf('.customer-chat-container');
if (containerIdx > -1) {
  console.log('\n.customer-chat-container CSS:', js.substring(containerIdx - 20, containerIdx + 500));
}

// Find chat-toggle-btn CSS
var btnIdx = js.indexOf('.chat-toggle-btn');
if (btnIdx > -1) {
  console.log('\n.chat-toggle-btn CSS:', js.substring(btnIdx - 20, btnIdx + 300));
}
