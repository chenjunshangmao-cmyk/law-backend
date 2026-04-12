/**
 * Claw Backend API 扩展测试
 * 测试账号管理、任务管理、会员管理 API
 */

const http = require('http');

const BASE_URL = 'http://localhost:8088';
let token = '';
let userId = '';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function test() {
  console.log('=== Claw Backend API 扩展测试 ===\n');
  
  // 1. 健康检查
  console.log('1. Health Check...');
  let res = await request({
    hostname: 'localhost', port: 8088, path: '/health', method: 'GET'
  });
  console.log(`   ✅ Status: ${res.status}`);
  
  // 2. 用户登录（获取token）
  console.log('\n2. User Login (获取Token)...');
  
  // 先尝试注册，确保有用户
  console.log('   注册测试用户...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'expand-test@example.com', password: 'test123', name: 'Expand Test User' });
  
  // 然后登录
  console.log('   登录...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'expand-test@example.com', password: 'test123' });
  
  if (res.success && res.token) {
    token = res.token;
    userId = res.user?.id || '';
    console.log(`   ✅ 登录成功, Token: ${token.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ 登录失败: ${res.error || 'Unknown error'}`);
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // ===== 账号管理 API =====
  console.log('\n========== 账号管理 API ==========');
  
  // 3. 添加平台账号
  console.log('\n3. Add Platform Account (1688)...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/accounts', method: 'POST',
    headers
  }, { platform: '1688', name: '我的1688账号', apiKey: 'test-key-12345678', apiSecret: 'test-secret-12345678' });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '账号添加成功: ' + res.data?.name : res.error}`);
  
  const accountId = res.data?.id;
  
  // 4. 获取账号列表
  console.log('\n4. Get Account List...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/accounts', method: 'GET',
    headers
  });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '获取成功，共 ' + res.data?.length + ' 个账号' : res.error}`);
  
  // 5. 测试账号连接
  if (accountId) {
    console.log('\n5. Test Account Connection...');
    res = await request({
      hostname: 'localhost', port: 8088, path: `/api/accounts/${accountId}/test`, method: 'POST',
      headers
    });
    console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '连接测试: ' + res.data?.message : res.error}`);
  }
  
  // 6. 更新账号
  if (accountId) {
    console.log('\n6. Update Account...');
    res = await request({
      hostname: 'localhost', port: 8088, path: `/api/accounts/${accountId}`, method: 'PUT',
      headers
    }, { name: '我的1688账号(已更新)', status: 'active' });
    console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '账号已更新' : res.error}`);
  }
  
  // ===== 任务管理 API =====
  console.log('\n========== 任务管理 API ==========');
  
  // 7. 创建选品任务
  console.log('\n7. Create Select Task...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/tasks', method: 'POST',
    headers
  }, { type: 'select', params: { keyword: '儿童连衣裙', maxResults: 10 }, autoStart: true });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '任务已创建: ' + res.data?.id + ' (状态: ' + res.data?.status + ')' : res.error}`);
  const taskId = res.data?.id;
  
  // 等待任务执行
  await new Promise(r => setTimeout(r, 2000));
  
  // 8. 获取任务列表
  console.log('\n8. Get Task List...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/tasks', method: 'GET',
    headers
  });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '获取成功，共 ' + res.data?.length + ' 个任务' : res.error}`);
  
  // 9. 获取任务详情
  if (taskId) {
    console.log('\n9. Get Task Details...');
    res = await request({
      hostname: 'localhost', port: 8088, path: `/api/tasks/${taskId}`, method: 'GET',
      headers
    });
    console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '任务状态: ' + res.data?.status + ', 进度: ' + res.data?.progress + '%' : res.error}`);
    
    // 10. 获取任务日志
    console.log('\n10. Get Task Logs...');
    res = await request({
      hostname: 'localhost', port: 8088, path: `/api/tasks/${taskId}/logs`, method: 'GET',
      headers
    });
    console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '获取日志成功，共 ' + res.data?.logs?.length + ' 条' : res.error}`);
  }
  
  // 11. 创建文案生成任务
  console.log('\n11. Create Generate Task...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/tasks', method: 'POST',
    headers
  }, { type: 'generate', params: { productName: '夏季儿童连衣裙', platform: 'tiktok' } });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '文案生成任务已创建' : res.error}`);
  
  // ===== 会员管理 API =====
  console.log('\n========== 会员管理 API ==========');
  
  // 12. 获取会员信息
  console.log('\n12. Get Membership Info...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/membership', method: 'GET',
    headers
  });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '套餐: ' + res.data?.plan + ' (' + res.data?.planName + ')' : res.error}`);
  
  // 13. 获取套餐列表
  console.log('\n13. Get Plans List...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/membership/plans', method: 'GET'
  });
  if (res.success) {
    console.log(`   ✅ 可用套餐:`);
    res.data.forEach(p => console.log(`      - ${p.plan}: ${p.name} (每日生成: ${p.quotas.dailyGenerate})`));
  } else {
    console.log(`   ❌ ${res.error}`);
  }
  
  // 14. 获取额度详情
  console.log('\n14. Get Quota Details...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/quota', method: 'GET',
    headers
  });
  if (res.success) {
    console.log(`   ✅ 额度信息:`);
    console.log(`      - 每日生成: ${res.data?.used?.dailyGenerate} / ${res.data?.limits?.dailyGenerate}`);
    console.log(`      - AI调用: ${res.data?.used?.aiCallsToday} / ${res.data?.limits?.aiCallsPerDay}`);
    console.log(`      - 活跃任务: ${res.data?.used?.activeTasks} / ${res.data?.limits?.automationTasks}`);
  } else {
    console.log(`   ❌ ${res.error}`);
  }
  
  // 15. 消费额度
  console.log('\n15. Consume Quota...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/quota/consume', method: 'POST',
    headers
  }, { type: 'dailyGenerate', amount: 1 });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.allowed ? '消耗成功，剩余: ' + res.remaining : res.error}`);
  
  // 16. 升级套餐（模拟）
  console.log('\n16. Upgrade Plan (Simulated)...');
  res = await request({
    hostname: 'localhost', port: 8088, path: '/api/membership/upgrade', method: 'POST',
    headers
  }, { plan: 'basic' });
  console.log(`   ${res.success ? '✅' : '❌'} ${res.success ? '升级成功: ' + res.data?.planName : res.error}`);
  
  // 清理测试账号
  if (accountId) {
    console.log('\n17. Cleanup - Delete Test Account...');
    res = await request({
      hostname: 'localhost', port: 8088, path: `/api/accounts/${accountId}`, method: 'DELETE',
      headers
    });
    console.log(`   ${res.success ? '✅' : '❌'} ${res.message}`);
  }
  
  console.log('\n========== 测试完成 ==========');
  console.log('✅ 所有扩展 API 测试完成！');
}

test().catch(console.error);
