import express from 'express';
import { generateLiveScript, generateShortVideoScript } from '../services/writer/ScriptGenerator.js';
import { generateMarketingCopy } from '../services/writer/CopyGenerator.js';

const router = express.Router();

router.post('/text-to-video', async (req, res) => {
  try {
    const { topic, style = 'product', duration = 60 } = req.body;
    if (!topic) return res.json({ success: false, error: '请输入视频主题' });

    const script = await generateShortVideoScript({ topic, style, duration });
    res.json({
      success: true,
      data: {
        script,
        message: '脚本已生成。视频渲染需Kling/Seedance API + FFmpeg合成，后端部署环境就绪后即可输出MP4。'
      }
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/product-video', async (req, res) => {
  try {
    const { productName, productDesc } = req.body;
    if (!productName) return res.json({ success: false, error: '请输入产品名称' });

    const [copy, script] = await Promise.all([
      generateMarketingCopy({ productName, productDesc }),
      generateLiveScript({ productName, productDesc })
    ]);

    res.json({
      success: true,
      data: { copy, script, message: '文案和脚本已生成。上传产品图后可用Kling API生成视频。' }
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
