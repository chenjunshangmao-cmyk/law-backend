const { execSync } = require('child_process');
const path = 'C:\\Users\\Administrator\\WorkBuddy\\Claw\\backend';
try {
  execSync('git add src/routes/shouqianba.db.js', { cwd: path, stdio: 'inherit' });
  execSync('git commit -m "fix membership payment flow"', { cwd: path, stdio: 'inherit' });
  execSync('git push origin master', { cwd: path, stdio: 'inherit' });
  console.log('Done!');
} catch(e) {
  console.error('Error:', e.message);
}
