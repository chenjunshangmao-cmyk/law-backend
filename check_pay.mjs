import fs from 'fs';
const c = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/src/routes/payment.db.js', 'utf-8');
const routes = c.match(/router\.(get|post|put|delete)\(['\"][^'\"]+['\"]/g);
console.log('Routes:', routes ? '\n' + routes.join('\n') : 'none');
const payIdx = c.indexOf('/payment');
if (payIdx > 0) console.log('\n---\n', c.substring(payIdx, Math.min(payIdx + 2000, c.length)));
