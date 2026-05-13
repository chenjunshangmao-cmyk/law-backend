import fs from 'fs';
const c = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/src/routes/auth.min.js', 'utf-8');
const tables = c.match(/["'](?:users|user|members|accounts)["']|sequelize\.define|\.sync\(|\.findAll\(|\.findOne\(|\.create\(/g);
if (tables) console.log('DB refs:', [...new Set(tables)].join(', '));
const regIdx = c.indexOf('/register');
if (regIdx > 0) console.log('Register start:', c.substring(regIdx, regIdx + 1500));
