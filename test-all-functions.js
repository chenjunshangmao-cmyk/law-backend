/**
 * 测试所有API功能实现情况
 */

import { execSync } from 'child_process';

// 测试函数
function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const curlCommand = data 
      ? `curl -X ${method} -H "Content-Type: application/json" -d '${JSON.stringify(data)}' http://localhost:8089${endpoint} -s`
      : `curl -X ${method} http://localhost:8089${endpoint} -s`;
    
    const result = execSync(curlCommand, { encoding: 'utf8' });
    return { success: true, response: JSON.parse(result) };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.status || 'unknown'
    };
  }
}

// 主要测试逻辑
async function main() {
  console.log('=== Claw外贸网站API功能实现检查 ===\n');
  
  // 1. 健康检查
  console.log('1. 健康检查API:');
  const healthCheck = testAPI('/api/health');
  console.log(`   ✅ /api/health: ${healthCheck.success ? '正常' : '失败'}`);
  
  // 2. 测试无需认证的API
  console.log('\n2. 公开API（无需认证）:');
  const publicAPIs = [
    { name: '注册用户', endpoint: '/api/auth/register', method: 'POST', data: { username: 'test', email: 'test@example.com', password: 'password123' } },
    { name: '用户登录', endpoint: '/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'password123' } },
    { name: '会员套餐列表', endpoint: '/api/membership/plans', method: 'GET' }
  ];
  
  for (const api of publicAPIs) {
    const result = testAPI(api.endpoint, api.method, api.data);
    console.log(`   ${result.success ? '✅' : '❌'} ${api.name} (${api.endpoint}): ${result.success ? '可访问' : '错误'} ${result.error ? `- ${result.error}` : ''}`);
  }
  
  // 3. 需要认证的API（列出但标记为需要认证）
  console.log('\n3. 需要认证的API（列表）：');
  const protectedAPIs = [
    { name: '用户信息', endpoint: '/api/auth/me' },
    { name: '产品列表', endpoint: '/api/products' },
    { name: '创建产品', endpoint: '/api/products', method: 'POST' },
    { name: 'AI生成文案', endpoint: '/api/generate/description', method: 'POST' },
    { name: '利润计算', endpoint: '/api/calculate/profit', method: 'POST' },
    { name: '账号列表', endpoint: '/api/accounts' },
    { name: '任务列表', endpoint: '/api/tasks' },
    { name: '会员信息', endpoint: '/api/membership' },
    { name: '浏览器自动化', endpoint: '/api/browser/tiktok/publish', method: 'POST' },
    { name: '数字人视频生成', endpoint: '/api/avatar/generate', method: 'POST' },
    { name: '发布管理', endpoint: '/api/publish' },
    { name: '客服系统', endpoint: '/api/customer-service' }
  ];
  
  for (const api of protectedAPIs) {
    const result = testAPI(api.endpoint, api.method || 'GET');
    const status = result.success ? '✅ 已实现' : '❌ 需要认证或未实现';
    console.log(`   ${api.name} (${api.endpoint}): ${status}`);
  }
  
  // 4. 检查文件存在情况
  console.log('\n4. API路由文件检查:');
  const routeFiles = [
    'auth.js',
    'auth.db.js',
    'products.js',
    'products.db.js',
    'generate.js',
    'calculate.js',
    'accounts.js',
    'accounts.db.js',
    'tasks.js',
    'tasks.db.js',
    'membership.js',
    'membership.db.js',
    'browser.js',
    'avatar.db.js',
    'publish.js',
    'customerService.js'
  ];
  
  const fs = await import('fs');
  const path = await import('path');
  
  for (const file of routeFiles) {
    const fullPath = path.join(process.cwd(), 'src', 'routes', file);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? '存在' : '缺失'}`);
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('说明:');
  console.log('- ✅ 表示功能正常');
  console.log('- ❌ 表示功能缺失或需要认证');
  console.log('- 需要认证的API在无token时会返回认证错误，这是正常的');
}

// 运行测试
main().catch(console.error);