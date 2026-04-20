var fs = require('fs');
var css = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/assets/app-styles.css', 'utf8');

// Find chat related CSS
var classes = ['chat-window', 'customer-chat-container', 'chat-toggle-btn', 'chat-messages', 'chat-input-area', 'chat-header', 'chat-minimize'];
classes.forEach(function(cls) {
  var idx = css.indexOf(cls);
  if (idx > -1) {
    console.log('\n.' + cls + ':', css.substring(idx, idx + 500));
  } else {
    console.log('.' + cls + ': NOT FOUND');
  }
});
