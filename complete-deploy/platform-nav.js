/**
 * Claw 平台发布导航组件
 * 在 TikTok 发布下方添加 YouTube 上传入口
 */
(function() {
  'use strict';

  // 初始化
  function init() {
    console.log('🚀 平台导航组件初始化...');
    setTimeout(addPlatformButtons, 2000);
  }

  // 添加平台按钮
  function addPlatformButtons() {
    // 检查是否已添加
    if (document.querySelector('.claw-platform-btn')) {
      console.log('平台按钮已存在');
      return;
    }

    // 查找所有菜单项
    const menuItems = document.querySelectorAll('li, a, div[class*="menu"] > div, div[class*="item"]');
    let targetItem = null;

    for (const item of menuItems) {
      const text = item.textContent?.trim() || '';
      // 查找 TikTok 发布相关菜单
      if ((text.includes('TikTok') || text.includes('TK')) && (text.includes('发布') || text.includes('上架'))) {
        targetItem = item.closest('li') || item;
        console.log('✅ 找到目标菜单:', text);
        break;
      }
    }

    if (!targetItem) {
      console.log('❌ 未找到 TikTok 菜单');
      return;
    }

    // 获取父容器
    const parent = targetItem.parentElement;
    if (!parent) {
      console.log('❌ 未找到父容器');
      return;
    }

    // 创建 TikTok 按钮（如果原菜单不是 TikTok，则添加）
    const hasTiktok = targetItem.textContent?.includes('TikTok') || targetItem.textContent?.includes('TK');
    
    if (!hasTiktok) {
      // 添加 TikTok 按钮
      const tiktokBtn = createMenuButton('🎵 TikTok 发布', 'tiktok');
      targetItem.insertAdjacentElement('afterend', tiktokBtn);
      console.log('✅ TikTok 按钮已添加');
    }

    // 添加 YouTube 按钮
    const youtubeBtn = createMenuButton('📺 YouTube 上传', 'youtube');
    targetItem.insertAdjacentElement('afterend', youtubeBtn);
    console.log('✅ YouTube 按钮已添加');
  }

  // 创建菜单按钮
  function createMenuButton(text, platform) {
    const btn = document.createElement('li');
    btn.className = 'claw-platform-btn';
    btn.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    `;
    btn.innerHTML = `<span>${text}</span>`;
    
    // 添加悬停效果
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(124, 58, 237, 0.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
    
    // 点击事件
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`点击: ${text}`);
      openModal(platform);
    });

    return btn;
  }

  // 打开弹窗
  function openModal(platform) {
    // 移除已有弹窗
    const existing = document.getElementById('claw-modal');
    if (existing) existing.remove();

    const isTikTok = platform === 'tiktok';
    const title = isTikTok ? '🎵 TikTok Shop 发布' : '📺 YouTube 视频上传';

    const modal = document.createElement('div');
    modal.id = 'claw-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        ">
          <h3 style="margin:0;font-size:18px;">${title}</h3>
          <button onclick="document.getElementById('claw-modal').remove()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          ">&times;</button>
        </div>
        <div style="padding: 20px;">
          ${isTikTok ? tiktokForm() : youtubeForm()}
        </div>
      </div>
    `;

    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  // TikTok 表单
  function tiktokForm() {
    return `
      <form id="tiktokForm" onsubmit="handleTiktokSubmit(event)">
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">邮箱 *</label>
          <input type="email" name="email" required placeholder="your@email.com" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">商品标题 *</label>
          <input type="text" name="title" required placeholder="输入商品标题" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">商品描述</label>
          <textarea name="description" rows="3" placeholder="输入商品描述" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            resize: vertical;
          "></textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">价格</label>
            <input type="number" name="price" step="0.01" placeholder="29.99" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              box-sizing: border-box;
            ">
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">库存</label>
            <input type="number" name="stock" placeholder="100" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              box-sizing: border-box;
            ">
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">图片路径</label>
          <input type="text" name="images" placeholder="/path/to/image1.jpg,/path/to/image2.jpg" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <button type="button" onclick="document.getElementById('claw-modal').remove()" style="
            padding: 10px 20px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">取消</button>
          <button type="submit" style="
            padding: 10px 20px;
            border: none;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">发布到 TikTok</button>
        </div>
      </form>
    `;
  }

  // YouTube 表单
  function youtubeForm() {
    return `
      <form id="youtubeForm" onsubmit="handleYoutubeSubmit(event)">
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">邮箱 *</label>
          <input type="email" name="email" required placeholder="your@gmail.com" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">视频路径 *</label>
          <input type="text" name="videoPath" required placeholder="/path/to/video.mp4" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">视频标题 *</label>
          <input type="text" name="title" required placeholder="输入视频标题" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">视频描述</label>
          <textarea name="description" rows="3" placeholder="输入视频描述" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            resize: vertical;
          "></textarea>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block;margin-bottom:6px;font-size:14px;font-weight:500;">缩略图路径</label>
          <input type="text" name="thumbnail" placeholder="/path/to/thumbnail.jpg" style="
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          ">
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <button type="button" onclick="document.getElementById('claw-modal').remove()" style="
            padding: 10px 20px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">取消</button>
          <button type="submit" style="
            padding: 10px 20px;
            border: none;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">上传到 YouTube</button>
        </div>
      </form>
    `;
  }

  // API 基础 URL - 使用 Render 后端
  const API_BASE_URL = 'https://claw-api-2026.onrender.com';

  // 处理 TikTok 表单提交
  window.handleTiktokSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    console.log('TikTok 发布数据:', data);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/browser/tiktok/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          title: data.title,
          description: data.description,
          price: parseFloat(data.price) || 0,
          stock: parseInt(data.stock) || 0,
          images: data.images ? data.images.split(',') : []
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ TikTok 发布成功！');
        document.getElementById('claw-modal').remove();
      } else {
        alert('❌ 发布失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      console.error('TikTok 发布错误:', err);
      alert('❌ 请求失败: ' + err.message);
    }
  };

  // 处理 YouTube 表单提交
  window.handleYoutubeSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    console.log('YouTube 上传数据:', data);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/browser/youtube/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          videoPath: data.videoPath,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ YouTube 上传成功！');
        document.getElementById('claw-modal').remove();
      } else {
        alert('❌ 上传失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      console.error('YouTube 上传错误:', err);
      alert('❌ 请求失败: ' + err.message);
    }
  };

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
