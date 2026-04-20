# Claw 网站部署包 - 2026-04-19

## 包含内容

### 1. YouTube & TikTok 登录功能
- **文件**: `src/routes/browser.js`
- **文件**: `src/services/browserAutomation.js`
- **功能**:
  - TikTok Shop 手动登录 + Cookies 导入 + Token 登录
  - YouTube Studio 手动登录 + Cookies 导入 + Token 登录
  - 发布产品/上传视频功能
  - 登录状态检查

### 2. AI 客服窗口
- **文件**: `complete-deploy/chat-widget.js` (新增)
- **文件**: `complete-deploy/index.html` (已更新)
- **功能**:
  - 悬浮在页面右下角的客服按钮
  - AI 对话支持
  - 知识库自动回复
  - 响应式设计

## 部署步骤

### 前端部署 (Cloudflare Pages)

1. 上传 `complete-deploy/` 目录下的所有文件到 Cloudflare Pages
2. 确保 `chat-widget.js` 和 `index.html` 都在根目录
3. 部署后会自动生效

### 后端部署 (Render)

1. 确保 `src/routes/browser.js` 和 `src/services/browserAutomation.js` 已更新
2. 检查 `package.json` 是否包含 `playwright` 依赖
3. 重新部署后端服务

## API 接口列表

### TikTok Shop
- `POST /api/browser/tiktok/login` - 手动登录
- `POST /api/browser/tiktok/login-cookies` - Cookies 导入
- `POST /api/browser/tiktok/login-token` - Token 登录
- `GET /api/browser/tiktok/status` - 检查登录状态
- `POST /api/browser/tiktok/publish` - 发布产品

### YouTube
- `POST /api/browser/youtube/login` - 手动登录
- `POST /api/browser/youtube/login-cookies` - Cookies 导入
- `POST /api/browser/youtube/login-token` - Token 登录
- `GET /api/browser/youtube/status` - 检查登录状态
- `POST /api/browser/youtube/upload` - 上传视频

### 客服
- `POST /api/customer-service/chat` - AI 客服对话

## 测试方法

1. 打开网站，检查右下角是否有客服按钮
2. 点击客服按钮，测试对话功能
3. 调用 API 测试登录功能：
   ```bash
   curl -X POST https://your-api.com/api/browser/tiktok/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

## 注意事项

- 后端需要安装 Playwright: `npm install playwright`
- 首次运行需要下载浏览器: `npx playwright install chromium`
- 客服窗口需要后端 API 支持

---
生成时间: 2026-04-19
