/**
 * 数字人视频 API 路由 v2.0 (数据库版)
 * 
 * 功能：
 * 1. 生成数字人视频
 * 2. AI 生成视频脚本
 * 3. 管理已生成的视频
 * 4. 上传到各平台
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  getVideosByUser, 
  getVideoById, 
  createVideo, 
  updateVideo, 
  deleteVideo,
  getScriptsByUser,
  getScriptById,
  createScript,
  updateScript,
  deleteScript,
  incrementScriptUsage
} from '../services/dbService.js';

const router = express.Router();

// 视频存储目录
const VIDEO_DIR = path.join(process.cwd(), 'generated-videos');
const SCRIPT_DIR = path.join(process.cwd(), 'generated-scripts');

// 确保目录存在
[VIDEO_DIR, SCRIPT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * ============================================
 * 视频生成接口
 * ============================================
 */

/**
 * POST /api/avatar/generate
 * 生成数字人视频
 */
router.post('/generate', async (req, res) => {
  try {
    const { userId } = req;
    const {
      script,
      productName,
      productDesc,
      templateId,
      avatarStyle,
      voiceId,
      background,
      music
    } = req.body;

    if (!script && !productName) {
      return res.json({
        success: false,
        error: '请提供脚本内容或产品名称'
      });
    }

    console.log('🎬 开始生成数字人视频...');
    console.log('- 模板:', templateId);
    console.log('- 形象:', avatarStyle);
    console.log('- 声音:', voiceId);

    // 生成视频ID
    const videoId = uuidv4();
    const timestamp = Date.now();
    const videoName = `avatar_video_${timestamp}.mp4`;
    const videoPath = path.join(VIDEO_DIR, videoName);

    // 模拟视频生成过程（实际应该调用数字人API）
    // 这里可以集成第三方数字人服务，如：
    // - D-ID
    // - HeyGen
    // - 万兴播爆
    // - 腾讯智影
    
    // 暂时创建占位文件（测试用）
    if (!fs.existsSync(videoPath)) {
      fs.writeFileSync(videoPath, Buffer.alloc(1024)); // 1KB 占位
    }

    // 保存到数据库
    const video = await createVideo({
      id: videoId,
      userId,
      name: videoName,
      path: videoPath,
      duration: 60,
      size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0,
      script,
      productName,
      productDesc,
      templateId,
      avatarStyle,
      voiceId,
      background,
      music,
      status: 'completed'
    });

    console.log('✅ 视频生成成功:', videoId);

    res.json({
      success: true,
      data: {
        id: video.id,
        name: video.name,
        path: video.path,
        duration: video.duration,
        size: video.size,
        createdAt: video.createdAt
      }
    });

  } catch (error) {
    console.error('生成视频失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/avatar/generate-script
 * AI 生成视频脚本
 */
router.post('/generate-script', async (req, res) => {
  try {
    const { userId } = req;
    const { productName, productDesc, scene } = req.body;

    if (!productName) {
      return res.json({
        success: false,
        error: '请提供产品名称'
      });
    }

    console.log('✍️ 正在生成视频脚本...');
    console.log('- 产品:', productName);
    console.log('- 场景:', scene);

    // 模拟AI生成脚本（实际应该调用AI服务）
    const scriptTemplates = {
      product: `欢迎来到今天的节目！今天我要为大家介绍一款非常实用的产品 - ${productName}。

${productDesc || '这款产品采用优质材料精心制作，设计精美，品质卓越，深受用户喜爱。'}

让我们一起来看看它的特点：
第一，精选优质材料，环保安全；
第二，人性化设计，使用方便；
第三，品质可靠，经久耐用；
第四，性价比超高，值得拥有！

如果你对${productName}感兴趣，请点击下方链接查看详情。
感谢观看，我们下期再见！`,

      lifestyle: `大家好，欢迎回来！今天我要和大家分享一款让我爱不释手的产品 - ${productName}。

${productDesc || '这款产品不仅外观精美，而且非常实用，完美融入我的日常生活。'}

使用了一段时间后，我真的越来越喜欢它了。无论是做工还是品质，都超出我的预期。

特别是它的设计，非常人性化，用起来特别顺手。
而且性价比超高，真的是物超所值！

感兴趣的朋友们，可以点击视频下方的链接了解更多信息。
喜欢我的分享，记得点赞订阅哦！我们下期再见！`,

      educational: `大家好，欢迎来到今天的知识分享！

今天我要和大家聊聊${productName}这个话题。
${productDesc || '这不仅仅是一款普通的产品，它蕴含着许多值得我们深入了解的知识点。'}

让我们一起来探索：

首先，让我们了解一下它的基本概念和原理。
其次，我会详细介绍它的主要功能和应用场景。
最后，我会分享一些实用的使用技巧和建议。

希望通过今天的分享，能让大家对${productName}有更深入的了解。
如果有任何问题，欢迎在评论区留言，我会一一回复。
感谢观看，我们下期再见！`,

      promotional: `🔥 限时优惠！${productName} 🔥

${productDesc || '你绝对不能错过的爆款产品！'}

⏰ 活动时间有限，错过不再有！

✨ 产品亮点：
• 品质卓越
• 价格实惠
• 好评如潮

📦 立即下单，享受专属优惠！
点击下方链接，go go go！

数量有限，先到先得！
不要犹豫，立刻行动吧！`
    };

    const template = scriptTemplates[scene || 'product'];
    const script = template.replace(/\n{3,}/g, '\n\n');

    // 生成相关标签
    const keywords = [
      productName,
      '好物推荐',
      '种草',
      scene === 'promotional' ? '限时优惠' : '产品测评',
      '值得拥有'
    ];

    const hashtags = [
      `#${productName.replace(/\s/g, '')}`,
      '#好物推荐',
      '#种草',
      '#购物分享',
      '#值得拥有'
    ];

    // 保存到数据库
    const scriptId = uuidv4();
    const savedScript = await createScript({
      id: scriptId,
      userId,
      productName,
      productDesc,
      scene: scene || 'product',
      content: script,
      keywords,
      hashtags,
      duration: 60
    });

    // 保存脚本文件
    const scriptPath = path.join(SCRIPT_DIR, `${scriptId}.txt`);
    fs.writeFileSync(scriptPath, script);

    console.log('✅ 脚本生成成功');

    res.json({
      success: true,
      data: {
        id: savedScript.id,
        script,
        keywords,
        hashtags
      }
    });

  } catch (error) {
    console.error('脚本生成失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * 视频管理接口
 * ============================================
 */

/**
 * GET /api/avatar/list
 * 获取已生成的视频列表
 */
router.get('/list', async (req, res) => {
  try {
    const { userId } = req;
    const { status, limit = 50, offset = 0 } = req.query;
    
    const videos = await getVideosByUser(userId, { 
      status, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    // 只返回需要的字段
    const videoList = videos.map(v => ({
      id: v.id,
      name: v.name,
      path: v.path,
      duration: v.duration,
      size: v.size,
      status: v.status,
      createdAt: v.createdAt
    }));

    res.json({
      success: true,
      data: videoList
    });

  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/avatar/:id
 * 获取单个视频详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoById(id);

    if (!video) {
      return res.json({
        success: false,
        error: '视频不存在'
      });
    }

    res.json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('获取视频详情失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/avatar/:id
 * 删除视频
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoById(id);

    if (!video) {
      return res.json({
        success: false,
        error: '视频不存在'
      });
    }

    // 删除视频文件
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    // 删除数据库记录
    await deleteVideo(id);

    console.log('✅ 视频已删除:', id);

    res.json({
      success: true
    });

  } catch (error) {
    console.error('删除视频失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/avatar/:id/download
 * 下载视频
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: '视频不存在'
      });
    }

    if (!fs.existsSync(video.path)) {
      return res.status(404).json({
        success: false,
        error: '视频文件不存在'
      });
    }

    res.download(video.path, video.name);

  } catch (error) {
    console.error('下载视频失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * 脚本管理接口
 * ============================================
 */

/**
 * GET /api/avatar/scripts
 * 获取脚本列表
 */
router.get('/scripts/list', async (req, res) => {
  try {
    const { userId } = req;
    const { scene, limit = 50, offset = 0 } = req.query;
    
    const scripts = await getScriptsByUser(userId, {
      scene,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: scripts
    });

  } catch (error) {
    console.error('获取脚本列表失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/avatar/scripts/:id
 * 删除脚本
 */
router.delete('/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const script = await getScriptById(id);

    if (!script) {
      return res.json({
        success: false,
        error: '脚本不存在'
      });
    }

    // 删除脚本文件
    const scriptPath = path.join(SCRIPT_DIR, `${id}.txt`);
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }

    // 删除数据库记录
    await deleteScript(id);

    res.json({
      success: true
    });

  } catch (error) {
    console.error('删除脚本失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * 平台上传接口
 * ============================================
 */

/**
 * POST /api/avatar/upload
 * 上传视频到平台
 */
router.post('/upload', async (req, res) => {
  try {
    const { id, title, description, platform } = req.body;

    if (!id || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：id, title'
      });
    }

    const video = await getVideoById(id);
    if (!video) {
      return res.json({
        success: false,
        error: '视频不存在'
      });
    }

    if (!fs.existsSync(video.path)) {
      return res.json({
        success: false,
        error: '视频文件不存在'
      });
    }

    console.log(`📤 开始上传视频到 ${platform}...`);
    console.log('- 标题:', title);
    console.log('- 文件:', video.path);

    // 根据平台调用不同的上传服务
    let result;
    
    switch (platform) {
      case 'youtube':
        result = await uploadToYouTube(video.path, title, description);
        break;
      case 'tiktok':
        result = await uploadToTikTok(video.path, title, description);
        break;
      case 'shipinhao':
        result = await uploadToShipinhao(video.path, title, description);
        break;
      default:
        return res.json({
          success: false,
          error: '不支持的平台: ' + platform
        });
    }

    // 更新视频上传状态
    const uploadStatus = video.uploadStatus || {};
    uploadStatus[platform] = result;
    await updateVideo(id, { 
      uploadStatus,
      status: 'uploaded'
    });

    console.log('✅ 上传成功:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('上传失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// YouTube 上传函数
async function uploadToYouTube(videoPath, title, description) {
  // 实际实现应该调用 browser.js 中的 YouTubeAutomation
  const videoId = 'yt_' + Date.now();
  return {
    platform: 'youtube',
    videoId,
    url: `https://youtu.be/${videoId}`,
    title,
    uploadedAt: new Date().toISOString()
  };
}

// TikTok 上传函数
async function uploadToTikTok(videoPath, title, description) {
  const videoId = 'tt_' + Date.now();
  return {
    platform: 'tiktok',
    videoId,
    url: `https://www.tiktok.com/@user/video/${videoId}`,
    title,
    uploadedAt: new Date().toISOString()
  };
}

// 视频号上传函数
async function uploadToShipinhao(videoPath, title, description) {
  const videoId = 'sh_' + Date.now();
  return {
    platform: 'shipinhao',
    videoId,
    url: `https://channels.weixin.qq.com/post/${videoId}`,
    title,
    uploadedAt: new Date().toISOString()
  };
}

export default router;
