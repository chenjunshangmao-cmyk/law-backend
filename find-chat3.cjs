var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Find all CSS rules for chat classes
var classes = ['chat-window', 'chat-header', 'chat-toggle-btn', 'customer-chat-container', 'chat-messages', 'chat-input'];
classes.forEach(function(cls) {
  // Find inline style object for this class
  var pattern = cls.replace('.', '') + '`:"';
  var idx = js.indexOf(pattern);
  if (idx > -1) {
    console.log('\n' + cls + ' inline style:', js.substring(idx - 30, idx + 300));
  }
});

// Find the complete CSS block - look for the module or styled-component definition
var cssIdx = js.indexOf('customerChatContainer');
if (cssIdx > -1) {
  console.log('\ncustomerChatContainer:', js.substring(cssIdx - 20, cssIdx + 500));
}

// Look for the Sx or styled component that defines chat styles
var sxIdx = js.indexOf('"chat-window"');
if (sxIdx > -1) {
  console.log('\n"chat-window" string:', js.substring(sxIdx - 20, sxIdx + 500));
}

var sxIdx2 = js.indexOf("'chat-window'");
if (sxIdx2 > -1) {
  console.log("\n'chat-window' string:", js.substring(sxIdx2 - 20, sxIdx2 + 500));
}

// Find the S(div) or styled.div for chat
var styledIdx = js.indexOf('S("div")');
if (styledIdx > -1) {
  console.log('\nS("div"):', js.substring(styledIdx, styledIdx + 200));
}
