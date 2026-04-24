const https = require('https');

const BASE = 'claw-backend-2026.onrender.com';
const ts = Date.now();
const email = `claw_paytest_${ts}@test.com`;

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const opts = { hostname: BASE, path, method, headers };
        const req = https.request(opts, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

async function main() {
    // Step 1: Register
    console.log('=== 1. 注册 ===');
    const reg = await request('POST', '/api/auth/register', {
        email, password: 'Test123456', name: `PayTest${ts}`
    });
    console.log('status:', reg.status);
    console.log('success:', reg.data.success);

    // Token 在 reg.data.data.token（两层包装）
    const token = reg.data.data && reg.data.data.token ? reg.data.data.token : (reg.data.token || null);
    if (!token) {
        console.error('❌ 无Token:', JSON.stringify(reg.data).substring(0, 200));
        return;
    }
    console.log('✅ Token:', token.substring(0, 50) + '...\n');

    // Step 2: 创建基础版支付（¥1.9）
    console.log('=== 2. 基础版支付订单 ===');
    const pay1 = await request('POST', '/api/payment/create', { plan: 'basic' }, token);
    console.log('status:', pay1.status);
    console.log(JSON.stringify(pay1.data, null, 2));

    // Step 3: 业务服务支付（5000积分=¥50）
    console.log('\n=== 3. 业务服务支付订单 ===');
    const pay2 = await request('POST', '/api/payment/create', {
        serviceId: 'domestic-op', serviceName: '国内代运营'
    }, token);
    console.log('status:', pay2.status);
    console.log(JSON.stringify(pay2.data, null, 2));
}

main().catch(console.error);
