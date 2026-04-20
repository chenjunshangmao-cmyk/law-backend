var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Find cs-service route
var idx = js.indexOf('/cs-service');
if (idx > -1) {
  console.log('cs-service area:', js.substring(idx - 20, idx + 300));
}

// Find width settings related to chat/modal
var patterns = ['width:600', 'width:"600', 'width:\'600', 'maxWidth', 'minWidth', 'chat-window', 'chat-container', 'modal-width'];
patterns.forEach(function(p) {
  var i = js.indexOf(p);
  if (i > -1) {
    console.log(p + ' found at ' + i + ':', js.substring(i - 30, i + 100));
  }
});

// Find 小芸 or avatar
var aiIdx = js.indexOf('小芸');
if (aiIdx > -1) {
  console.log('小芸 at', aiIdx, ':', js.substring(aiIdx - 50, aiIdx + 200));
}

// Find any inline style with width > 400
var wideStyles = js.match(/style:"[^"]*width[^"]*4[0-9]{2}/g) || [];
console.log('Wide styles:', wideStyles.slice(0, 10));

// Find the actual cs-service page component
var cssIdx = js.indexOf('CsService');
if (cssIdx > -1) {
  console.log('CsService found at', cssIdx, ':', js.substring(cssIdx - 20, cssIdx + 300));
}

console.log('JS size:', js.length);
