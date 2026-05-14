import fs from 'fs';
const c = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/src/routes/auth.min.js', 'utf-8');
const loginIdx = c.indexOf('/login');
if (loginIdx > 0) {
  const loginCode = c.substring(loginIdx, loginIdx + 2000);
  console.log('Login code:\n', loginCode);
}
// 也看看 findUserByEmailJSON
const jsonIdx = c.indexOf('findUserByEmailJSON');
if (jsonIdx > 0) console.log('\nJSON lookup:\n', c.substring(jsonIdx, jsonIdx + 500));
