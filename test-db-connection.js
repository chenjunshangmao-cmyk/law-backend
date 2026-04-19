// 测试数据库连接
import pg from 'pg';
const { Pool } = pg;

const databaseUrl = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

console.log('测试数据库连接...');
console.log('数据库URL:', databaseUrl);

// 方法1：使用连接字符串
async function testWithConnectionString() {
  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    
    const client = await pool.connect();
    console.log('✅ 方法1成功：使用连接字符串');
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error('❌ 方法1失败:', err.message);
    return false;
  }
}

// 方法2：使用参数
async function testWithParams() {
  try {
    // 手动解析URL
    const urlParts = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    if (!urlParts) {
      console.error('无法解析数据库URL');
      return false;
    }
    
    const [, user, password, host, database] = urlParts;
    
    const pool = new Pool({
      user,
      password,
      host,
      database,
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });
    
    const client = await pool.connect();
    console.log('✅ 方法2成功：使用参数');
    console.log('用户:', user);
    console.log('密码长度:', password.length);
    console.log('主机:', host);
    console.log('数据库:', database);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error('❌ 方法2失败:', err.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('\n=== 开始数据库连接测试 ===\n');
  
  const method1Success = await testWithConnectionString();
  console.log('');
  const method2Success = await testWithParams();
  
  console.log('\n=== 测试结果 ===');
  console.log('方法1（连接字符串）:', method1Success ? '✅ 成功' : '❌ 失败');
  console.log('方法2（参数）:', method2Success ? '✅ 成功' : '❌ 失败');
  
  if (method2Success) {
    console.log('\n建议：使用参数方式连接数据库');
  }
}

runTests().catch(console.error);