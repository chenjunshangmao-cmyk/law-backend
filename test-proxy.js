// ==========================================
// 代理测试脚本
// ==========================================

const { checkProxy, fetchWithProxy, CLASH_PROXY } = require('./src/utils/proxy');

async function testProxy() {
  console.log('========================================');
  console.log('代理连接测试');
  console.log('========================================');
  console.log('代理地址:', CLASH_PROXY);
  console.log('');

  // 测试1: 检查代理可用性
  console.log('测试1: 检查代理连接...');
  const available = await checkProxy();
  if (available) {
    console.log('✅ 代理连接正常');
  } else {
    console.log('❌ 代理连接失败');
    console.log('请检查:');
    console.log('  1. Clash是否已启动');
    console.log('  2. 混合代理端口是否为7890');
    console.log('  3. 系统代理是否已启用');
    return;
  }

  // 测试2: 测试访问海外API
  console.log('');
  console.log('测试2: 测试访问海外服务...');
  try {
    const response = await fetchWithProxy('https://api.bfl.ml/health');
    console.log('✅ Flux API可访问');
    console.log('  状态:', response.status);
  } catch (error) {
    console.log('⚠️ Flux API访问失败:', error.message);
  }

  console.log('');
  console.log('========================================');
  console.log('测试完成');
  console.log('========================================');
}

testProxy();
