const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db'
});

(async () => {
  try {
    // 查询 OZON 店铺
    const shopResult = await pool.query(`
      SELECT id, platform, shop_name, shop_id, status, created_at, updated_at 
      FROM shops 
      WHERE platform = 'ozon' 
      ORDER BY created_at DESC
    `);
    
    console.log('=== OZON 店铺信息 ===');
    console.log(JSON.stringify(shopResult.rows, null, 2));
    
    // 查询店铺关联的账号
    if (shopResult.rows.length > 0) {
      const shopIds = shopResult.rows.map(s => s.id);
      const accountResult = await pool.query(`
        SELECT sa.id, sa.shop_id, sa.account_name, sa.api_key, sa.status, sa.created_at
        FROM shop_accounts sa
        WHERE sa.shop_id IN (${shopIds.map((_, i) => `$${i + 1}`).join(', ')})
        ORDER BY sa.created_at DESC
      `, shopIds);
      
      console.log('\n=== 关联账号信息 ===');
      console.log(JSON.stringify(accountResult.rows, null, 2));
    }
    
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
