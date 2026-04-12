/**
 * 数字人视频数据库功能测试
 */

import { sequelize, testConnection, syncDatabase } from './src/config/database.js';
import { 
  createVideo, 
  getVideosByUser, 
  getVideoById,
  deleteVideo,
  createScript,
  getScriptsByUser,
  getScriptById,
  deleteScript,
  createUser,
  findUserByEmail
} from './src/services/dbService.js';

const TEST_USER_EMAIL = 'test-avatar@claw.com';

async function testVideoDatabase() {
  console.log('🧪 开始测试数字人视频数据库功能...\n');

  let TEST_USER_ID;

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    console.log('✅ 数据库连接成功\n');

    // 2. 同步数据库模型
    console.log('2️⃣ 同步数据库模型...');
    const synced = await syncDatabase();
    if (!synced) {
      throw new Error('数据库同步失败');
    }
    console.log('✅ 数据库同步成功\n');

    // 2.5 创建测试用户
    console.log('2.5️⃣ 创建测试用户...');
    let testUser = await findUserByEmail(TEST_USER_EMAIL);
    if (!testUser) {
      testUser = await createUser({
        email: TEST_USER_EMAIL,
        password: 'test-password',
        name: '测试用户',
        plan: 'free'
      });
      console.log('✅ 测试用户创建成功:', testUser.id);
    } else {
      console.log('✅ 测试用户已存在:', testUser.id);
    }
    const TEST_USER_ID = testUser.id;
    console.log();

    // 3. 测试创建视频
    console.log('3️⃣ 测试创建视频...');
    const video = await createVideo({
      userId: TEST_USER_ID,
      name: 'test_video_123.mp4',
      path: '/videos/test_video_123.mp4',
      duration: 60,
      size: 1024000,
      script: '测试脚本内容',
      productName: '测试产品',
      templateId: 'template-1',
      avatarStyle: 'business',
      voiceId: 'voice-1',
      status: 'completed'
    });
    console.log('✅ 视频创建成功:', video.id);
    console.log('   - 名称:', video.name);
    console.log('   - 时长:', video.duration, '秒');
    console.log('   - 状态:', video.status);
    console.log();

    // 4. 测试查询视频列表
    console.log('4️⃣ 测试查询视频列表...');
    const videos = await getVideosByUser(TEST_USER_ID);
    console.log('✅ 查询成功, 找到', videos.length, '个视频');
    console.log();

    // 5. 测试查询单个视频
    console.log('5️⃣ 测试查询单个视频...');
    const foundVideo = await getVideoById(video.id);
    console.log('✅ 查询成功:', foundVideo ? '找到视频' : '未找到');
    console.log('   - 产品名:', foundVideo?.productName);
    console.log();

    // 6. 测试创建脚本
    console.log('6️⃣ 测试创建脚本...');
    const script = await createScript({
      userId: TEST_USER_ID,
      productName: '测试产品',
      productDesc: '这是一个测试产品描述',
      scene: 'product',
      content: '欢迎来到今天的节目！今天我要为大家介绍...',
      keywords: ['测试', '产品', '推荐'],
      hashtags: ['#测试', '#产品'],
      duration: 60
    });
    console.log('✅ 脚本创建成功:', script.id);
    console.log('   - 产品名:', script.productName);
    console.log('   - 场景:', script.scene);
    console.log();

    // 7. 测试查询脚本列表
    console.log('7️⃣ 测试查询脚本列表...');
    const scripts = await getScriptsByUser(TEST_USER_ID);
    console.log('✅ 查询成功, 找到', scripts.length, '个脚本');
    console.log();

    // 8. 测试查询单个脚本
    console.log('8️⃣ 测试查询单个脚本...');
    const foundScript = await getScriptById(script.id);
    console.log('✅ 查询成功:', foundScript ? '找到脚本' : '未找到');
    console.log('   - 内容长度:', foundScript?.content?.length, '字符');
    console.log();

    // 9. 测试删除脚本
    console.log('9️⃣ 测试删除脚本...');
    await deleteScript(script.id);
    const deletedScript = await getScriptById(script.id);
    console.log('✅ 删除成功:', deletedScript ? '失败' : '成功');
    console.log();

    // 10. 测试删除视频
    console.log('🔟 测试删除视频...');
    await deleteVideo(video.id);
    const deletedVideo = await getVideoById(video.id);
    console.log('✅ 删除成功:', deletedVideo ? '失败' : '成功');
    console.log();

    console.log('🎉 所有测试通过！数字人视频数据库功能正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行测试
testVideoDatabase();
