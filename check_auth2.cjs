const fs = require('fs');
// 看看 auth.min.js 里有没有直接查 PG 的 API
const c = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/src/routes/auth.min.js', 'utf-8');
// 找 findUserByEmailPG 函数
const idx = c.indexOf('findUserByEmailPG');
if (idx >= 0) console.log('findUserByEmailPG:\n', c.substring(idx, idx + 1000));

// 找 register 中写入 PG 的部分
const regIdx = c.indexOf('INSERT INTO users');
if (regIdx >= 0) console.log('\nINSERT INTO users:\n', c.substring(regIdx, regIdx + 500));

// 找 register 后调用 createUser 保存到 JSON 的部分
const createIdx = c.indexOf('createUser(');
if (createIdx >= 0) console.log('\ncreateUser call:\n', c.substring(createIdx, createIdx + 300));

// 看 getUsers 函数
const getIdx = c.indexOf('function getUsers()');
if (getIdx >= 0) console.log('\ngetUsers:\n', c.substring(getIdx, getIdx + 400));
