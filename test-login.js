// 登录系统测试脚本
import { findUserByEmail, createUser, getUsers } from './src/services/dataStore.js';
import bcrypt from 'bcryptjs';

console.log('=== Claw登录系统诊断测试 ===\n');

// 测试1: 检查数据存储
console.log('1. 检查数据存储...');
try {
  const users = getUsers();
  console.log(`   ✓ 用户数据文件可读取，当前用户数: ${users.length}`);
} catch (error) {
  console.error(`   ✗ 读取用户数据失败: ${error.message}`);
}

// 测试2: 检查JWT配置
console.log('\n2. 检查JWT配置...');
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.log('   ⚠️ JWT_SECRET 未设置，将使用默认密钥');
  console.log('   建议: 设置环境变量 JWT_SECRET 以增强安全性');
} else if (jwtSecret.length < 32) {
  console.log(`   ⚠️ JWT_SECRET 太短 (${jwtSecret.length}字符)，建议至少32字符`);
} else {
  console.log(`   ✓ JWT_SECRET 已设置 (${jwtSecret.length}字符)`);
}

// 测试3: 创建测试用户
console.log('\n3. 创建测试用户...');
const testEmail = 'test@claw.com';
const testPassword = 'Test123!';

let existingUser = findUserByEmail(testEmail);
if (!existingUser) {
  console.log('   测试用户不存在，正在创建...');
  try {
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const newUser = {
      id: 'test-user-001',
      email: testEmail,
      password: hashedPassword,
      name: 'Test User',
      role: 'user',
      plan: 'free',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    createUser(newUser);
    console.log('   ✓ 测试用户创建成功');
    console.log(`   邮箱: ${testEmail}`);
    console.log(`   密码: ${testPassword}`);
  } catch (error) {
    console.error(`   ✗ 创建测试用户失败: ${error.message}`);
  }
} else {
  console.log('   ✓ 测试用户已存在');
  console.log(`   邮箱: ${testEmail}`);
  console.log(`   密码: ${testPassword}`);
}

// 测试4: 验证密码
console.log('\n4. 测试密码验证...');
existingUser = findUserByEmail(testEmail);
if (existingUser) {
  try {
    const isValid = await bcrypt.compare(testPassword, existingUser.password);
    if (isValid) {
      console.log('   ✓ 密码验证成功');
    } else {
      console.log('   ✗ 密码验证失败');
    }
  } catch (error) {
    console.error(`   ✗ 密码验证出错: ${error.message}`);
  }
}

// 测试5: 检查bcrypt
console.log('\n5. 检查bcrypt模块...');
try {
  const testHash = await bcrypt.hash('test', 10);
  const testValid = await bcrypt.compare('test', testHash);
  if (testValid) {
    console.log('   ✓ bcrypt模块工作正常');
  }
} catch (error) {
  console.error(`   ✗ bcrypt模块出错: ${error.message}`);
}

console.log('\n=== 测试完成 ===');
console.log('\n如果以上测试都通过，登录系统应该可以正常工作。');
console.log('如果仍有问题，请检查:');
console.log('1. 后端服务是否已启动 (npm start)');
console.log('2. 前端API地址配置是否正确');
console.log('3. 浏览器控制台是否有CORS错误');
