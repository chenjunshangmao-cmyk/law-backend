var fs = require('fs');
var js = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/index-DmCeXBoo.js', 'utf8');

// Look for style tag creation (for injecting CSS)
var stylePatterns = ['<style>', '<style', 'createElement("style"', "createElement('style'", 'insertRule', '.sheet'];
stylePatterns.forEach(function(p) {
  var idx = js.indexOf(p);
  if (idx > -1) {
    console.log(p + ' found at', idx, ':', js.substring(idx, idx + 200));
  }
});

// Search for chat CSS in the broader JS
// Find where chat-window className is used, and look for the styles before it
var idx = js.indexOf('"chat-window"');
if (idx > -1) {
  console.log('"chat-window" found at', idx);
  // Look backwards for style definition
  console.log('Before:', js.substring(Math.max(0, idx - 500), idx + 100));
}

// Look for the variable that defines chat styles - search for object with chat styles
// e.g. { chatWindow: { width: ... } }
var objIdx = js.indexOf('chatWindow:');
if (objIdx > -1) {
  console.log('\nchatWindow: found at', objIdx, ':', js.substring(objIdx - 20, objIdx + 300));
}

// Search for all `.chat` in JS near chat component
var searchAround = js.substring(1159000, 1161000);
var dotMatches = searchAround.match(/\.\w+/g) || [];
console.log('\nClass names in chat area:', [...new Set(dotMatches)].slice(0, 30));
