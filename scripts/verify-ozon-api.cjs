#!/usr/bin/env node
/**
 * OZON API 账号验证脚本
 * 使用 Client-Id 和 Api-Key 直接测试 OZON API 连接
 *
 * 用法:
 *   node scripts/verify-ozon-api.cjs <clientId> <apiKey>
 *
 * 示例:
 *   node scripts/verify-ozon-api.cjs 12345 abcdef123456
 */

const axios = require('axios');

const OZON_API_BASE = 'https://api-seller.ozon.ru';

async function verifyOzonApi(clientId, apiKey) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 OZON API 账号验证');
  console.log('='.repeat(60));
  console.log(`Client-ID: ${clientId}`);
  console.log(`API-Key:   ${apiKey.substring(0, 8)}...`);
  console.log('');

  const client = axios.create({
    baseURL: OZON_API_BASE,
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  try {
    // 1. 测试卖家信息 API
    console.log('📡 测试 /v1/seller/info ...');
    const sellerRes = await client.get('/v1/seller/info');
    const seller = sellerRes.data;
    console.log('✅ 连接成功！');
    console.log('');
    console.log('📊 卖家信息:');
    console.log(`   名称: ${seller.name || seller.company_name || 'N/A'}`);
    console.log(`   邮箱: ${seller.email || 'N/A'}`);
    console.log(`   城市: ${seller.city || 'N/A'}`);
    console.log('');

    // 2. 测试产品列表 API
    console.log('📡 测试 /v3/product/list ...');
    const productsRes = await client.post('/v3/product/list', {
      page: 1,
      page_size: 10,
    });
    const productsCount = productsRes.data.items?.length || 0;
    const totalProducts = productsRes.data.total || 0;
    console.log(`✅ 产品列表获取成功！`);
    console.log(`   当前页产品数: ${productsCount}`);
    console.log(`   总产品数: ${totalProducts}`);
    console.log('');

    // 3. 测试订单列表 API
    console.log('📡 测试 /v3/order/list ...');
    const ordersRes = await client.post('/v3/order/list', {
      page: 1,
      page_size: 10,
    });
    const ordersCount = ordersRes.data.orders?.length || 0;
    console.log(`✅ 订单列表获取成功！`);
    console.log(`   当前页订单数: ${ordersCount}`);
    console.log('');

    console.log('🎉 OZON API 账号验证全部通过！');
    console.log('');
    console.log('💡 账号凭证可用于:');
    console.log('   - 产品自动发布');
    console.log('   - 订单自动同步');
    console.log('   - 库存自动更新');
    console.log('   - 销售数据分析');
    console.log('');

    return {
      success: true,
      seller,
      productsCount: totalProducts,
      ordersCount,
    };

  } catch (error) {
    const errorData = error.response?.data;
    const errorMsg = errorData?.message || error.message;

    console.log('❌ OZON API 连接失败！');
    console.log(`   错误: ${errorMsg}`);
    console.log('');

    if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
      console.log('💡 可能原因: Client-Id 或 Api-Key 错误');
      console.log('   获取方式: OZON Seller Center > Settings > API keys');
    } else if (errorMsg.includes('not found') || errorMsg.includes('NotFound')) {
      console.log('💡 可能原因: Client-Id 不存在');
    } else if (error.response?.status === 401) {
      console.log('💡 可能原因: API Key 无效或已过期');
    } else if (error.response?.status === 429) {
      console.log('💡 可能原因: 请求过于频繁（限流）');
    }

    return {
      success: false,
      error: errorMsg,
      status: error.response?.status,
    };
  }
}

// 主入口
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   OZON API 账号验证工具                            ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('用法: node scripts/verify-ozon-api.cjs <clientId> <apiKey>');
    console.log('');
    console.log('示例: node scripts/verify-ozon-api.cjs 12345 abcdef123456');
    console.log('');
    console.log('获取凭证: OZON Seller Center > Settings > API');
    console.log('');
    console.log('如果直接传递困难，可以设置环境变量:');
    console.log('  $env:OZON_CLIENT_ID="12345"');
    console.log('  $env:OZON_API_KEY="abcdef123456"');
    console.log('  node scripts/verify-ozon-api.cjs');
    console.log('');

    // 尝试从环境变量读取
    const envClientId = process.env.OZON_CLIENT_ID;
    const envApiKey = process.env.OZON_API_KEY;

    if (envClientId && envApiKey) {
      console.log('✅ 检测到环境变量，正在验证...');
      const result = await verifyOzonApi(envClientId, envApiKey);
      process.exit(result.success ? 0 : 1);
    } else {
      process.exit(1);
    }
  }

  const clientId = args[0];
  const apiKey = args[1];
  const result = await verifyOzonApi(clientId, apiKey);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('❌ 脚本异常:', err.message);
  process.exit(1);
});
