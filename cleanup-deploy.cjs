const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/WorkBuddy/Claw/complete-deploy';

// Remove unnecessary CSS files (keep only the React CSS and patched JS)
const assets = fs.readdirSync(dir + '/assets');
console.log('Before cleanup:', assets);

// Remove the wrong CSS
const wrongCss = dir + '/assets/index-CP-Zg9Cl.css';
if (fs.existsSync(wrongCss)) {
  fs.unlinkSync(wrongCss);
  console.log('Removed wrong CSS');
}

// Rename React CSS to the correct name
const reactCss = dir + '/assets/main.6c8cfe8a.css';
const reactCssDest = dir + '/assets/index-CP-Zg9Cl.css'; // rename to match HTML ref
if (fs.existsSync(reactCss)) {
  fs.copyFileSync(reactCss, reactCssDest);
  fs.unlinkSync(reactCss);
  console.log('React CSS saved as index-CP-Zg9Cl.css');
}

// Remove all.min.css (not needed by our HTML)
const faCss = dir + '/assets/all.min.css';
if (fs.existsSync(faCss)) {
  fs.unlinkSync(faCss);
  console.log('Removed FontAwesome CSS');
}

// Verify
const finalAssets = fs.readdirSync(dir + '/assets');
console.log('After cleanup:', finalAssets);

// Verify JS size
const jsSize = fs.statSync(dir + '/assets/index-DmCeXBoo.js').size;
const cssSize = fs.statSync(dir + '/assets/index-CP-Zg9Cl.css').size;
console.log('JS:', jsSize, 'bytes');
console.log('CSS:', cssSize, 'bytes');
