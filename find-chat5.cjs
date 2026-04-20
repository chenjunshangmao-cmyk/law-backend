var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Find emotion/styled pattern for chat
var patterns = [
  'customerChatContainer',
  'CustomerChatContainer',
  'chatWindow',
  'ChatWindow',
  'chatToggle',
  'ChatToggle',
  'StyledChat',
  'chatContainer',
  'ChatContainer'
];
patterns.forEach(function(p) {
  var idx = js.indexOf(p);
  if (idx > -1) {
    console.log(p + ' at ' + idx + ':', js.substring(idx - 50, idx + 200));
    console.log('---');
  }
});

// Look for all occurrences of "chat" in CSS-like contexts
var chatParts = js.split('.chat-');
console.log('\nchat CSS parts count:', chatParts.length - 1);
for (var i = 1; i < Math.min(chatParts.length, 5); i++) {
  console.log('\n.chat-' + chatParts[i].substring(0, 100));
}
