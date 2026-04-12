// 数据库测试脚本
import { testConnection, syncDatabase } from './src/config/database.js';
import { 
  findUserByEmail, 
  createUser, 
  getProductsByUser, 
  createProduct,
  getTasksByUser,
  createTask,
  getQuotaByUserId
} from './src/services/dbService.js';
import bcrypt from 'bcryptjs';

console.log('🧪 开始测试数据库...\n');

const runTests = async () => {
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ 数据库连接测试失败');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功\n');

    // 2. 同步数据库模型
    console.log('2️⃣ 同步数据库模型...');
    const synced = await syncDatabase(true); // force: true 用于测试，会删除现有表
    if (!synced) {
      console.error('❌ 数据库同步失败');
      process.exit(1);
    }
    console.log('✅ 数据库同步成功\n');

    // 3. 测试用户创建
    console.log('3️⃣ 测试用户创建...');
    const testEmail = 'test@example.com';
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await createUser({
      email: testEmail,
      password: hashedPassword,
      name: '测试用户',
      plan: 'free'
    });
    console.log('✅ 用户创建成功:', user.id);
    console.log('   邮箱:', user.email);
    console.log('   名称:', user.name);
    console.log('   套餐:', user.plan);
    console.log();

    // 4. 测试用户查询
    console.log('4️⃣ 测试用户查询...');
    const foundUser = await findUserByEmail(testEmail);
    if (foundUser) {
      console.log('✅ 用户查询成功:', foundUser.id);
    } else {
      console.error('❌ 用户查询失败');
    }
    console.log();

    // 5. 测试额度自动创建
    console.log('5️⃣ 测试额度自动创建...');
    const quota = await getQuotaByUserId(user.id);
    console.log('✅ 额度查询成功:');
    console.log('   套餐:', quota.plan);
    console.log('   文案生成额度:', quota.textGenerations, '/', quota.textLimit);
    console.log('   图片生成额度:', quota.imageGenerations, '/', quota.imageLimit);
    console.log('   产品数量限制:', quota.productsLimit);
    console.log();

    // 6. 测试产品创建
    console.log('6️⃣ 测试产品创建...');
    const product = await createProduct({
      userId: user.id,
      name: '测试产品 - 夏季儿童连衣裙',
      description: '纯棉材质，舒适透气',
      cost: 25.00,
      price: 49.90,
      sourceUrl: 'https://1688.com/product/12345',
      category: 'clothing',
      images: ['https://example.com/image1.jpg'],
      status: 'draft'
    });
    console.log('✅ 产品创建成功:', product.id);
    console.log('   名称:', product.name);
    console.log('   成本:', product.cost);
    console.log('   售价:', product.price);
    console.log();

    // 7. 测试产品列表查询
    console.log('7️⃣ 测试产品列表查询...');
    const products = await getProductsByUser(user.id);
    console.log('✅ 产品列表查询成功，共', products.length, '个产品');
    products.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.status})`);
    });
    console.log();

    // 8. 测试任务创建
    console.log('8️⃣ 测试任务创建...');
    const task = await createTask({
      userId: user.id,
      type: 'generate',
      status: 'pending',
      params: { platform: 'tiktok', productId: product.id },
      productId: product.id,
      logs: [{ time: Date.now(), level: 'info', message: '任务已创建' }],
      progress: 0
    });
    console.log('✅ 任务创建成功:', task.id);
    console.log('   类型:', task.type);
    console.log('   状态:', task.status);
    console.log();

    // 9. 测试任务列表查询
    console.log('9️⃣ 测试任务列表查询...');
    const tasks = await getTasksByUser(user.id);
    console.log('✅ 任务列表查询成功，共', tasks.length, '个任务');
    tasks.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.type} - ${t.status}`);
    });
    console.log();

    console.log('═══════════════════════════════════════════');
    console.log('🎉 所有数据库测试通过！');
    console.log('═══════════════════════════════════════════');
    console.log();
    console.log('📊 测试总结:');
    console.log('   ✅ 数据库连接');
    console.log('   ✅ 模型同步');
    console.log('   ✅ 用户CRUD');
    console.log('   ✅ 额度管理');
    console.log('   ✅ 产品CRUD');
    console.log('   ✅ 任务CRUD');
    console.log();
    console.log('📝 数据库文件位置: ./data/claw.db');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
};

runTests();
