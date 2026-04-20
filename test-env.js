// 测试环境变量
import 'dotenv/config';

console.log('测试环境变量加载...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET 存在:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET 长度:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);

// 测试JWT
import jwt from 'jsonwebtoken';

const payload = { userId: 'test-user-001', email: 'test@example.com' };
const token = jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', { expiresIn: '1h' });
console.log('\n生成的JWT Token:', token);

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  console.log('JWT验证成功:', decoded);
} catch (err) {
  console.error('JWT验证失败:', err.message);
}