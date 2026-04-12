// 增强的API测试脚本 - 测试所有改进的功能
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8088/api';
let authToken = null;
let userId = null;

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 辅助函数：打印测试结果
function printTestResult(testName, success, details = null) {
  const emoji = success ? '✅' : '❌';
  console.log(`${emoji} ${testName}`);
  
  if (!success && details) {
    console.log(`   ${details}`);
  }
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// 辅助函数：发送API请求
async function apiRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

// 测试1: 健康检查
async function testHealthCheck() {
  console.log('\n=== 1. 健康检查测试 ===');
  
  const result = await apiRequest('/health');
  const success = result.success && result.data?.status === 'healthy';
  
  printTestResult('健康检查', success, success ? null : JSON.stringify(result.data));
  
  if (success) {
    console.log(`   服务: ${result.data.service}`);
    console.log(`   环境: ${result.data.environment}`);
    console.log(`   运行时间: ${result.data.uptime.toFixed(2)}秒`);
  }
  
  return success;
}

// 测试2: 用户注册
async function testUserRegistration() {
  console.log('\n=== 2. 用户注册测试 ===');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  // 测试注册
  const registerResult = await apiRequest('/auth/register', 'POST', {
    email: testEmail,
    password: testPassword,
    name: '测试用户'
  });
  
  const registerSuccess = registerResult.success && registerResult.data?.user?.email === testEmail;
  printTestResult('用户注册', registerSuccess, registerSuccess ? null : JSON.stringify(registerResult.data));
  
  if (registerSuccess) {
    userId = registerResult.data.user.id;
    authToken = registerResult.data.token;
    console.log(`   用户ID: ${userId}`);
    console.log(`   令牌有效期: ${registerResult.data.tokenExpiresIn}`);
  }
  
  // 测试重复注册
  const duplicateResult = await apiRequest('/auth/register', 'POST', {
    email: testEmail,
    password: 'anotherpassword'
  });
  
  const duplicateSuccess = !duplicateResult.success && duplicateResult.data?.code === 'EMAIL_EXISTS';
  printTestResult('重复注册检查', duplicateSuccess, duplicateSuccess ? null : '应返回EMAIL_EXISTS错误');
  
  // 测试无效邮箱格式
  const invalidEmailResult = await apiRequest('/auth/register', 'POST', {
    email: 'invalid-email',
    password: 'password'
  });
  
  const invalidEmailSuccess = !invalidEmailResult.success && duplicateResult.status === 400;
  printTestResult('邮箱格式验证', invalidEmailSuccess, invalidEmailSuccess ? null : '应返回400错误');
  
  return registerSuccess;
}

// 测试3: 用户登录
async function testUserLogin() {
  console.log('\n=== 3. 用户登录测试 ===');
  
  // 使用之前注册的用户测试登录
  const loginResult = await apiRequest('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  const loginSuccess = loginResult.success && loginResult.data?.token;
  printTestResult('用户登录', loginSuccess, loginSuccess ? null : JSON.stringify(loginResult.data));
  
  if (loginSuccess) {
    authToken = loginResult.data.token;
    console.log(`   登录成功，获取新令牌`);
  }
  
  // 测试错误密码
  const wrongPasswordResult = await apiRequest('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'wrongpassword'
  });
  
  const wrongPasswordSuccess = !wrongPasswordResult.success && wrongPasswordResult.status === 401;
  printTestResult('错误密码检查', wrongPasswordSuccess, wrongPasswordSuccess ? null : '应返回401错误');
  
  // 测试记住我功能
  const rememberMeResult = await apiRequest('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123',
    rememberMe: true
  });
  
  const rememberMeSuccess = rememberMeResult.success && rememberMeResult.data?.tokenExpiresIn === '30d';
  printTestResult('记住我功能', rememberMeSuccess, rememberMeSuccess ? null : '令牌有效期应为30天');
  
  return loginSuccess;
}

// 测试4: 用户信息管理
async function testUserProfile() {
  console.log('\n=== 4. 用户信息管理测试 ===');
  
  // 测试获取用户信息
  const profileResult = await apiRequest('/auth/profile', 'GET');
  const profileSuccess = profileResult.success && profileResult.data?.user?.id;
  printTestResult('获取用户信息', profileSuccess, profileSuccess ? null : JSON.stringify(profileResult.data));
  
  if (profileSuccess) {
    console.log(`   用户名: ${profileResult.data.user.name}`);
    console.log(`   邮箱: ${profileResult.data.user.email}`);
    console.log(`   套餐: ${profileResult.data.user.plan}`);
  }
  
  // 测试获取用户额度
  const quotaResult = await apiRequest('/auth/quota', 'GET');
  const quotaSuccess = quotaResult.success && quotaResult.data?.quota?.plan;
  printTestResult('获取用户额度', quotaSuccess, quotaSuccess ? null : JSON.stringify(quotaResult.data));
  
  if (quotaSuccess) {
    console.log(`   套餐: ${quotaResult.data.quota.plan}`);
    console.log(`   文本生成剩余: ${quotaResult.data.quota.remaining.text}`);
    console.log(`   图片生成剩余: ${quotaResult.data.quota.remaining.image}`);
  }
  
  return profileSuccess && quotaSuccess;
}

// 测试5: 产品管理
async function testProductManagement() {
  console.log('\n=== 5. 产品管理测试 ===');
  
  // 测试创建产品
  const createProductData = {
    name: '测试产品' + Date.now(),
    description: '这是一个测试产品描述',
    cost: 15.5,
    sourceUrl: 'https://1688.com/item/123',
    category: 'clothing',
    images: ['image1.jpg', 'image2.jpg']
  };
  
  const createResult = await apiRequest('/products', 'POST', createProductData);
  const createSuccess = createResult.success && createResult.data?.product?.id;
  printTestResult('创建产品', createSuccess, createSuccess ? null : JSON.stringify(createResult.data));
  
  let productId = null;
  if (createSuccess) {
    productId = createResult.data.product.id;
    console.log(`   产品ID: ${productId}`);
    console.log(`   产品名称: ${createResult.data.product.name}`);
    console.log(`   产品状态: ${createResult.data.product.status}`);
  }
  
  // 测试获取产品列表
  const listResult = await apiRequest('/products', 'GET');
  const listSuccess = listResult.success && Array.isArray(listResult.data?.products);
  printTestResult('获取产品列表', listSuccess, listSuccess ? null : JSON.stringify(listResult.data));
  
  if (listSuccess && listResult.data.products.length > 0) {
    console.log(`   产品总数: ${listResult.data.products.length}`);
  }
  
  // 测试获取单个产品（如果创建成功）
  if (productId) {
    const getResult = await apiRequest(`/products/${productId}`, 'GET');
    const getSuccess = getResult.success && getResult.data?.product?.id === productId;
    printTestResult('获取单个产品', getSuccess, getSuccess ? null : JSON.stringify(getResult.data));
  }
  
  // 测试更新产品（如果创建成功）
  if (productId) {
    const updateResult = await apiRequest(`/products/${productId}`, 'PUT', {
      name: '更新后的产品名称',
      description: '更新后的描述',
      status: 'published'
    });
    
    const updateSuccess = updateResult.success && updateResult.data?.product?.status === 'published';
    printTestResult('更新产品', updateSuccess, updateSuccess ? null : JSON.stringify(updateResult.data));
  }
  
  return createSuccess;
}

// 测试6: 速率限制和安全功能
async function testRateLimitAndSecurity() {
  console.log('\n=== 6. 速率限制和安全测试 ===');
  
  // 测试无令牌访问保护接口
  const noTokenResult = await fetch(`${API_BASE}/auth/profile`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
    // 不设置Authorization头
  }).then(res => res.json());
  
  const noTokenSuccess = !noTokenResult.success && noTokenResult.code === 'AUTH_MISSING_TOKEN';
  printTestResult('无令牌访问保护', noTokenSuccess, noTokenSuccess ? null : '应要求认证令牌');
  
  // 测试无效令牌
  const invalidTokenResult = await fetch(`${API_BASE}/auth/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token-123'
    }
  }).then(res => res.json());
  
  const invalidTokenSuccess = !invalidTokenResult.success && invalidTokenResult.code === 'AUTH_INVALID_TOKEN';
  printTestResult('无效令牌检查', invalidTokenSuccess, invalidTokenSuccess ? null : '应拒绝无效令牌');
  
  return noTokenSuccess && invalidTokenSuccess;
}

// 测试7: 浏览器自动化状态检查
async function testBrowserAutomation() {
  console.log('\n=== 7. 浏览器自动化状态检查 ===');
  
  // 测试列出保存的session（不需要认证）
  const listSessionsResult = await apiRequest('/browser/list-sessions', 'GET');
  const listSessionsSuccess = listSessionsResult.success;
  printTestResult('列出保存的session', listSessionsSuccess, 
    listSessionsSuccess ? null : JSON.stringify(listSessionsResult.data));
  
  if (listSessionsSuccess && listSessionsResult.data?.sessions) {
    console.log(`   已保存的session数量: ${listSessionsResult.data.count}`);
  }
  
  // 测试验证中间件（无邮箱参数）
  const noEmailResult = await apiRequest('/browser/tiktok/status', 'GET');
  const noEmailSuccess = !noEmailResult.success;
  printTestResult('浏览器API参数验证', noEmailSuccess, 
    noEmailSuccess ? '缺少email参数应返回错误' : '应验证必要参数');
  
  return listSessionsSuccess;
}

// 测试8: 错误处理
async function testErrorHandling() {
  console.log('\n=== 8. 错误处理测试 ===');
  
  // 测试不存在的API端点
  const notFoundResult = await apiRequest('/nonexistent', 'GET');
  const notFoundSuccess = !notFoundResult.success && notFoundResult.status === 404;
  printTestResult('404错误处理', notFoundSuccess, 
    notFoundSuccess ? null : '不存在的端点应返回404');
  
  // 测试无效的产品ID
  const invalidProductResult = await apiRequest('/products/invalid-id-123', 'GET');
  const invalidProductSuccess = !invalidProductResult.success && invalidProductResult.status === 404;
  printTestResult('无效资源ID处理', invalidProductSuccess, 
    invalidProductSuccess ? null : '无效ID应返回404');
  
  // 测试服务器健康（通过健康检查）
  const healthResult = await apiRequest('/health', 'GET');
  const healthSuccess = healthResult.success && healthResult.data?.status === 'healthy';
  printTestResult('服务器健康状态', healthSuccess, 
    healthSuccess ? `状态: ${healthResult.data.status}` : '服务器可能有问题');
  
  return notFoundSuccess && invalidProductSuccess && healthSuccess;
}

// 主测试函数
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║           Claw后端API增强测试开始                      ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  目标: 测试所有改进的安全和错误处理功能                ║');
  console.log('║  时间: ' + new Date().toLocaleString() + '              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  try {
    // 运行所有测试
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();
    await testUserProfile();
    await testProductManagement();
    await testRateLimitAndSecurity();
    await testBrowserAutomation();
    await testErrorHandling();
    
    // 汇总结果
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                   测试结果汇总                          ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  总测试数: ${testResults.passed + testResults.failed}                    ║`);
    console.log(`║  通过: ${testResults.passed}                            ║`);
    console.log(`║  失败: ${testResults.failed}                            ║`);
    console.log(`║  成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%                      ║`);
    
    if (testResults.failed === 0) {
      console.log('║  🎉 所有测试通过！                                ║');
    } else {
      console.log('║  ⚠️  有测试失败，请查看上面的详细信息             ║');
    }
    
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    // 提供建议
    console.log('\n📋 改进建议:');
    if (testResults.failed > 0) {
      console.log('  1. 检查服务器是否正常运行');
      console.log('  2. 验证数据库连接和文件权限');
      console.log('  3. 查看服务器日志获取详细错误信息');
    } else {
      console.log('  1. ✅ 所有基础功能正常');
      console.log('  2. ✅ 安全功能正常工作');
      console.log('  3. ✅ 错误处理完善');
      console.log('  4. 建议进行压力测试和集成测试');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    testResults.errors.push(error.message);
  }
}

// 如果服务器未运行，提示用户
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE}/health`, { timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 运行测试
async function main() {
  console.log('正在检查服务器状态...');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ 服务器未运行或无法访问');
    console.log('请先启动服务器:');
    console.log('  1. 进入目录: cd C:\\Users\\Administrator\\WorkBuddy\\Claw\\backend');
    console.log('  2. 启动服务器: npm run dev 或 node src/index.js');
    console.log('  3. 确认端口 8088 已监听');
    return;
  }
  
  console.log('✅ 服务器正在运行，开始测试...');
  await runAllTests();
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};