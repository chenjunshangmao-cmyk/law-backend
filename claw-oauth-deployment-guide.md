# Claw Google OAuth 部署指南

## 🚀 部署步骤

### 步骤 1: 确认 Render 环境变量

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 找到后端服务 `claw-backend-2026`
3. 点击 **Environment** 标签
4. 确认以下环境变量已设置：

```
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### 步骤 2: 重新部署后端

1. 在 Render Dashboard 中点击 **Manual Deploy** → **Deploy latest commit**
2. 或者点击 **Save, rebuild, and deploy**（如果修改了环境变量）
3. 等待部署完成（约 1-2 分钟）

### 步骤 3: 验证部署

部署完成后，测试以下端点：

```bash
# 测试 Google 登录端点
curl -I https://claw-backend-2026.onrender.com/api/auth/google

# 测试 YouTube 授权端点
curl "https://claw-backend-2026.onrender.com/api/auth/youtube?mode=popup"
```

### 步骤 4: 前端测试

1. 访问网站 https://claw-app-2026.pages.dev
2. 进入 **智能发布** 页面
3. 选择 **YouTube** 平台
4. 点击 **授权 YouTube 账号**
5. 应该能正常弹出 Google 授权窗口

## 🔧 本地开发环境配置

### 使用修复的环境配置

```bash
cd backend
copy .env.fixed .env /Y
node src/index.db.js
```

或使用脚本：
```bash
restart-with-fixed-env.bat
```

### 本地测试

```bash
# 测试 OAuth 端点
node test-oauth-fix.js

# 测试 Google OAuth 配置
node fix-google-oauth.js
```

## 📋 故障排查

### 问题 1: "invalid_client" 错误

**原因**: Google OAuth 客户端 ID 未设置或无效

**解决**:
1. 检查 Render 环境变量 `GOOGLE_CLIENT_ID` 是否正确
2. 确认 Google Cloud Console 中的客户端 ID 有效
3. 重新部署后端服务

### 问题 2: "redirect_uri_mismatch" 错误

**原因**: 回调 URL 与 Google Cloud Console 中配置的不一致

**解决**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services > Credentials**
3. 找到 OAuth 2.0 Client ID
4. 添加以下授权重定向 URI：
   - `https://claw-backend-2026.onrender.com/api/auth/google/callback`
   - `https://claw-backend-2026.onrender.com/api/auth/youtube/callback`
   - `http://localhost:8089/api/auth/google/callback` (开发环境)
   - `http://localhost:8089/api/auth/youtube/callback` (开发环境)

### 问题 3: TikTok 登录保存失败

**原因**: 后端验证中间件不支持 `tiktok_shop` 平台

**解决**: 已修复，确认后端已部署最新代码

## 🔒 安全注意事项

1. **不要**将 `GOOGLE_CLIENT_SECRET` 提交到 Git 仓库
2. **不要**在前端代码中暴露客户端密钥
3. 定期轮换 OAuth 凭据
4. 使用环境变量管理敏感信息

## 📞 联系支持

如果遇到问题：
1. 检查 Render 后端日志
2. 查看浏览器控制台错误
3. 确认 Google Cloud Console 配置
