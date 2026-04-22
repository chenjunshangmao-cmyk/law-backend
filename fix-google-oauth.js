/**
 * Google OAuth配置修复脚本
 * 1. 检查当前OAuth配置
 * 2. 提供配置指南
 * 3. 测试OAuth端点
 */

const axios = require('axios');

async function testGoogleOAuth() {
  console.log('🔧 测试Google OAuth配置...\n');
  
  // 检查环境变量
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '已设置（隐藏）' : '未设置',
    FRONTEND_URL: process.env.FRONTEND_URL || '未设置',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  console.log('📋 环境变量检查:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n🔗 OAuth端点测试:');
  
  // 测试Google登录端点
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.chenjuntrading.cn'
      : 'http://localhost:8089';
    
    console.log(`\n1. 测试Google登录端点: ${baseUrl}/api/auth/google`);
    
    // 注意：这个端点会重定向，我们只检查是否返回重定向
    const response = await axios.get(`${baseUrl}/api/auth/google`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 300 && status < 400 // 只接受重定向状态
    }).catch(err => {
      if (err.response && err.response.status === 503) {
        console.log('   ❌ Google OAuth未配置（GOOGLE_CLIENT_ID缺失）');
        return null;
      }
      throw err;
    });
    
    if (response && response.status === 302) {
      console.log('   ✅ Google登录端点正常（返回重定向）');
      console.log(`   重定向到: ${response.headers.location?.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`   ❌ Google登录端点测试失败: ${error.message}`);
  }
  
  // 测试YouTube OAuth端点
  try {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.chenjuntrading.cn'
      : 'http://localhost:8089';
    
    console.log(`\n2. 测试YouTube授权端点: ${baseUrl}/api/auth/youtube`);
    
    const response = await axios.get(`${baseUrl}/api/auth/youtube`, {
      params: { mode: 'popup' }
    });
    
    if (response.data && response.data.authUrl) {
      console.log('   ✅ YouTube授权端点正常');
      console.log(`   授权URL: ${response.data.authUrl.substring(0, 100)}...`);
    } else {
      console.log('   ⚠️  YouTube授权端点返回异常格式');
    }
    
  } catch (error) {
    console.log(`   ❌ YouTube授权端点测试失败: ${error.message}`);
    if (error.response && error.response.data) {
      console.log(`   错误详情: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  console.log('\n📝 Google OAuth配置指南:');
  console.log(`
1. 访问 Google Cloud Console: https://console.cloud.google.com/
2. 创建或选择项目
3. 启用以下API:
   - Google OAuth 2.0
   - YouTube Data API v3
4. 配置OAuth同意屏幕:
   - 应用类型: 外部
   - 应用名称: Claw跨境智造
   - 用户支持邮箱: 您的邮箱
   - 开发者联系信息: 您的邮箱
   - 添加测试用户（可选）
5. 创建OAuth 2.0客户端ID:
   - 应用类型: Web应用
   - 名称: Claw Web Client
   - 授权重定向URI:
     * https://api.chenjuntrading.cn/api/auth/google/callback
     * https://api.chenjuntrading.cn/api/auth/youtube/callback
     * http://localhost:8089/api/auth/google/callback (开发环境)
     * http://localhost:8089/api/auth/youtube/callback (开发环境)
6. 获取客户端ID和密钥，更新环境变量:
   GOOGLE_CLIENT_ID=您的客户端ID
   GOOGLE_CLIENT_SECRET=您的客户端密钥
  `);
  
  console.log('\n🔧 修复建议:');
  console.log('1. 检查环境变量是否正确设置');
  console.log('2. 验证Google Cloud控制台中的重定向URI配置');
  console.log('3. 确保YouTube Data API已启用');
  console.log('4. 测试OAuth流程: 登录 → 授权 → 回调 → token生成');
}

// 执行测试
testGoogleOAuth().catch(console.error);