const fs = require('fs');
const path = require('path');

function findDirs(root, name) {
  const results = [];
  function walk(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git') continue;
        const full = path.join(dir, item);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            if (item.toLowerCase().includes('claw') && item.toLowerCase().includes('front')) {
              results.push(full);
            }
            if (dir.length < 300) walk(full);
          }
        } catch(e) {}
      }
    } catch(e) {}
  }
  walk(root);
  return results;
}

const dirs = [
  'C:/Users/Administrator',
  'D:/',
  'C:/projects',
  'C:/workspace'
];

for (const d of dirs) {
  if (fs.existsSync(d)) {
    const found = findDirs(d, 'claw');
    if (found.length > 0) {
      console.log('Found in', d + ':', found);
    }
  }
}
console.log('Done searching');
