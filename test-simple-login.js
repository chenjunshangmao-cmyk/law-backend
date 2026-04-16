// 简单登录测试 - 模拟前端登录请求
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8089';

async function testSimpleLogin() {
  console.log('=== 会员登录问题排查 ===\n');
  
  // 1. 首先测试健康检查
  console.log('1. 健康检查测试...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (healthRes.ok) {
      const health = await healthRes.json();
      console.log(`✅ 健康检查通过: ${health.status}`);
    } else {
      console.log('❌ 健康检查失败');
    }
  } catch (error) {
    console.log(`❌ 健康检查错误: ${error.message}`);
  }
  
  // 2. 测试注册接口
  console.log('\n2. 测试用户注册...');
  try {
    const registerData = {
      email: 'test@claw.com',
      password: 'test123456',
      name: '测试用户'
    };
    
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = registerRes.ok ? await registerRes.json() : null;
    
    if (registerRes.ok && registerResult.success) {
      console.log(`✅ 注册成功: ${registerResult.data.user.email}`);
      console.log(`   用户ID: ${registerResult.data.user.id}`);
      console.log(`   令牌: ${registerResult.data.token.substring(0, 20)}...`);
      
      // 使用刚刚获取的令牌测试登录
      return testLoginWithToken(registerResult.data.token);
    } else {
      console.log(`❌ 注册失败: ${registerRes.status}`);
      if (registerResult) {
        console.log(`   错误: ${registerResult.error}`);
      }
      
      // 3. 如果注册失败，尝试直接登录（可能用户已存在）
      console.log('\n3. 尝试直接登录...');
      return testDirectLogin();
    }
  } catch (error) {
    console.log(`❌ 注册测试错误: ${error.message}`);
  }
}

async function testDirectLogin() {
  try {
    const loginData = {
      email: 'test@claw.com',
      password: 'test123456'
    };
    
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    const loginResult = loginRes.ok ? await loginRes.json() : null;
    
    if (loginRes.ok && loginResult.success) {
      console.log(`✅ 登录成功: ${loginResult.data.user.email}`);
      console.log(`   用户角色: ${loginResult.data.user.role}`);
      console.log(`   套餐: ${loginResult.data.user.plan}`);
      console.log(`   令牌: ${loginResult.data.token.substring(0, 20)}...`);
      return loginResult.data.token;
    } else {
      console.log(`❌ 登录失败: ${loginRes.status}`);
      if (loginResult) {
        console.log(`   错误: ${loginResult.error}`);
      }
      
      // 4. 数据库可能有问题，建议使用简化认证
      console.log('\n⚠️  问题诊断:');
      console.log('- 可能原因1: PostgreSQL数据库连接失败');
      console.log('- 可能原因2: 数据库表未初始化');
      console.log('- 可能原因3: 认证中间件配置错误');
      console.log('\n💡 建议解决方案:');
      console.log('1. 检查数据库连接配置 (config/database.js)');
      console.log('2. 初始化数据库: npm run init-db');
      console.log('3. 临时使用简化认证模式 (auth.js)');
      
      return null;
    }
  } catch (error) {
    console.log(`❌ 登录测试错误: ${error.message}`);
    return null;
  }
}

async function testLoginWithToken(token) {
  console.log('\n4. 使用令牌测试API访问...');
  try {
    const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileRes.ok) {
      const profile = await profileRes.json();
      console.log(`✅ 个人资料获取成功: ${profile.data.user.email}`);
      return true;
    } else {
      console.log(`❌ 个人资料获取失败: ${profileRes.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 令牌测试错误: ${error.message}`);
    return false;
  }
}

// 运行测试
console.log('=== Claw外贸网站会员登录问题排查 ===');
testSimpleLogin().then(() => {
  console.log('\n=== 测试完成 ===');
  console.log('如果登录失败，可能需要临时启用简化认证模式。');
  console.log('简化认证模式文件: src/routes/auth.js (绕过数据库验证)');
  console.log('完整认证模式文件: src/routes/auth.db.js (需要数据库)');
});