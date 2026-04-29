// 添加小红书和 YouTube 账号脚本
import pkg from 'pg';
const { Pool } = pkg;

// 直接使用数据库 URL
const databaseUrl = "postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db";

async function addSocialAccounts() {
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未设置');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 用户 ID（与 OZON 账号相同的用户）
    const userId = 'dd0a80ed-5721-44ff-bea1-3d3520c2968d';

    // 插入小红书账号
    await pool.query(`
      INSERT INTO accounts (id, user_id, platform, name, account_data, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        account_data = EXCLUDED.account_data,
        updated_at = NOW()
    `, [
      'xiaohongshu-main',
      userId,
      'xiaohongshu',
      '小红书主账号',
      JSON.stringify({ phone: '15119885271' }),
      'active'
    ]);
    console.log('✅ 小红书账号已添加：15119885271');

    // 插入 YouTube 账号
    await pool.query(`
      INSERT INTO accounts (id, user_id, platform, name, account_data, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        account_data = EXCLUDED.account_data,
        updated_at = NOW()
    `, [
      'youtube-chenjun',
      userId,
      'youtube',
      'Chenjun 商贸',
      JSON.stringify({ email: 'chenjunshangmao@gmail.com' }),
      'active'
    ]);
    console.log('✅ YouTube 账号已添加：chenjunshangmao@gmail.com');

    console.log('\n📋 当前账号列表：');
    const result = await pool.query('SELECT id, platform, name, account_data FROM accounts WHERE user_id = $1', [userId]);
    result.rows.forEach(row => {
      console.log(`  - ${row.platform}: ${row.name} (${JSON.parse(row.account_data).phone || JSON.parse(row.account_data).email || '无'})`);
    });

  } catch (error) {
    console.error('❌ 添加账号失败:', error.message);
  } finally {
    await pool.end();
  }
}

addSocialAccounts();
