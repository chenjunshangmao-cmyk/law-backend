// API测试脚本
const http = require('http');

const BASE_URL = 'http://localhost:8088';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Claw Backend API Test ===\n');

  // 1. 健康检查
  console.log('1. Health Check...');
  const health = await makeRequest('GET', '/health');
  console.log('   Status:', health.status);
  console.log('   Service:', health.service);
  console.log();

  // 2. 用户注册
  console.log('2. User Registration...');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    email: 'demo@example.com',
    password: 'demo123',
    name: 'Demo User'
  });
  console.log('   Success:', registerResult.success);
  if (registerResult.success) {
    console.log('   User:', registerResult.data.user.email);
    console.log('   Token:', registerResult.data.token.substring(0, 20) + '...');
    var token = registerResult.data.token;
  } else {
    console.log('   Error:', registerResult.error);
  }
  console.log();

  // 3. 用户登录
  console.log('3. User Login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'demo@example.com',
    password: 'demo123'
  });
  console.log('   Success:', loginResult.success);
  if (loginResult.success) {
    console.log('   User:', loginResult.data.user.email);
    token = loginResult.data.token;
  } else {
    console.log('   Error:', loginResult.error);
  }
  console.log();

  // 4. 获取用户信息
  console.log('4. Get Profile...');
  const profile = await makeRequest('GET', '/api/auth/profile', null, token);
  console.log('   Success:', profile.success);
  if (profile.success) {
    console.log('   User:', profile.data.user.name);
  }
  console.log();

  // 5. 获取额度
  console.log('5. Get Quota...');
  const quota = await makeRequest('GET', '/api/auth/quota', null, token);
  console.log('   Success:', quota.success);
  if (quota.success) {
    console.log('   Plan:', quota.data.quota.plan);
    console.log('   Text Limit:', quota.data.quota.textLimit);
    console.log('   Products Limit:', quota.data.quota.productsLimit);
  }
  console.log();

  // 6. 创建产品
  console.log('6. Create Product...');
  const product = await makeRequest('POST', '/api/products', {
    name: "Children's Summer Dress",
    description: '100% cotton, breathable, cute cartoon print',
    cost: 25,
    sourceUrl: 'https://1688.com/product/123',
    category: 'children-clothing'
  }, token);
  console.log('   Success:', product.success);
  if (product.success) {
    console.log('   Product:', product.data.product.name);
    var productId = product.data.product.id;
  }
  console.log();

  // 7. 获取产品列表
  console.log('7. Get Products...');
  const products = await makeRequest('GET', '/api/products', null, token);
  console.log('   Success:', products.success);
  console.log('   Total:', products.data.total);
  console.log();

  // 8. AI文案生成
  console.log('8. Generate Text...');
  const generated = await makeRequest('POST', '/api/generate/text', {
    productName: "Children's Summer Dress",
    productDescription: '100% cotton, breathable',
    platform: 'tiktok',
    style: 'professional'
  }, token);
  console.log('   Success:', generated.success);
  if (generated.success) {
    console.log('   Title:', generated.data.text.title);
  }
  console.log();

  // 9. 利润计算
  console.log('9. Calculate Profit...');
  const profit = await makeRequest('POST', '/api/calculate/profit', {
    cost: 25,
    platforms: ['tiktok', 'shopee'],
    targetMargin: 50
  }, token);
  console.log('   Success:', profit.success);
  if (profit.success) {
    console.log('   TikTok Price:', profit.data.platforms.tiktok.priceLocal + profit.data.platforms.tiktok.currency);
    console.log('   TikTok Margin:', profit.data.platforms.tiktok.margin);
  }
  console.log();

  // 10. 获取平台列表
  console.log('10. Get Platforms...');
  const platforms = await makeRequest('GET', '/api/calculate/platforms');
  console.log('   Success:', platforms.success);
  console.log('   Platforms:', platforms.data.platforms.map(p => p.name).join(', '));
  console.log();

  console.log('=== All Tests Completed ===');
}

runTests().catch(console.error);
