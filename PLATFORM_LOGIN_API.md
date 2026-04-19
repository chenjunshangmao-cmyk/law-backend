# Claw 平台登录 API 文档

## 概述

Claw 支持 **YouTube** 和 **TikTok Shop** 两大平台，每个平台都有 **3 种登录方式**：

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| A. 真实浏览器登录 | 打开 Chromium 浏览器，用户手动登录 | 需要真实操作平台 |
| B. Cookies 导入 | 直接导入浏览器 Cookies | 已有浏览器 Cookies |
| C. Token 登录 | 使用平台 API Token | 有 API 权限/程序集成 |

---

# YouTube 登录 API

## A. 真实浏览器登录

```bash
POST /api/browser/youtube/login
Content-Type: application/json

{
  "email": "your-email@gmail.com"
}
```

## B. Cookies 导入登录

```bash
POST /api/browser/youtube/login-cookies
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "cookies": [
    {
      "name": "SID",
      "value": "your-sid-value",
      "domain": ".youtube.com",
      "path": "/"
    }
  ]
}
```

## C. Token 登录

```bash
POST /api/browser/youtube/login-token
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0dx...",
  "expiresIn": 3600
}
```

## 检查登录状态

```bash
GET /api/browser/youtube/status?email=your-email@gmail.com
```

## 上传视频

```bash
POST /api/browser/youtube/upload
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "videoPath": "/path/to/video.mp4",
  "title": "视频标题",
  "description": "视频描述",
  "thumbnail": "/path/to/thumbnail.jpg",
  "useApi": false,
  "autoLogin": true
}
```

**参数说明：**
- `email`: Google 邮箱（必需）
- `videoPath`: 视频文件路径（必需）
- `title`: 视频标题
- `description`: 视频描述
- `thumbnail`: 缩略图路径
- `useApi`: 是否使用 YouTube Data API（需要 token 登录）
- `autoLogin`: 未登录时是否自动打开浏览器登录（默认 true）

**🚀 自动登录流程：**
1. 调用上传接口时如果未登录，自动打开浏览器
2. 用户在浏览器中手动登录 YouTube/Google
3. 关闭浏览器后自动保存登录状态
4. 继续执行视频上传流程

**响应示例（自动登录）：**
```json
{
  "success": true,
  "message": "视频上传成功",
  "loginType": "session",
  "platform": "youtube",
  "videoTitle": "视频标题",
  "videoUrl": "https://studio.youtube.com/video/..."
}
```

---

# TikTok Shop 登录 API

## A. 真实浏览器登录

打开 Chromium 浏览器，用户手动登录 TikTok Seller Center。

```bash
POST /api/browser/tiktok/login
Content-Type: application/json

{
  "email": "your-email@example.com"
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功，Session已保存",
  "sessionPath": "./browser-states/tiktok-your-email@example.com.json"
}
```

---

## B. Cookies 导入登录（虚拟登录）

直接导入浏览器 Cookies，无需打开真实浏览器。

```bash
POST /api/browser/tiktok/login-cookies
Content-Type: application/json

{
  "email": "your-email@example.com",
  "cookies": [
    {
      "name": "sessionid",
      "value": "your-session-id",
      "domain": ".tiktok.com",
      "path": "/",
      "expires": 1769999999,
      "httpOnly": true,
      "secure": true
    },
    {
      "name": "tt_webid",
      "value": "your-web-id",
      "domain": ".tiktok.com",
      "path": "/"
    }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "message": "Cookies 导入成功，虚拟登录完成",
  "loginType": "cookies",
  "email": "your-email@example.com",
  "sessionPath": "./browser-states/tiktok-your-email@example.com.json",
  "cookieCount": 2
}
```

### 如何获取 TikTok Cookies

1. 在浏览器中登录 TikTok Seller Center (https://seller.tiktok.com)
2. 按 F12 打开开发者工具
3. 切换到 Application/应用 → Cookies
4. 复制 tiktok.com 或 seller.tiktok.com 下的关键 cookies：
   - `sessionid`
   - `tt_webid`
   - `tt_webid_v2`
   - `msToken`
   - `odin_tt`

---

## C. Token 登录（虚拟登录）

使用 TikTok Shop API 的 Access Token 登录。

```bash
POST /api/browser/tiktok/login-token
Content-Type: application/json

{
  "email": "your-email@example.com",
  "accessToken": "your-tiktok-access-token",
  "refreshToken": "your-refresh-token",
  "expiresIn": 86400
}
```

**响应：**
```json
{
  "success": true,
  "message": "Token 登录成功，虚拟登录完成",
  "loginType": "token",
  "email": "your-email@example.com",
  "tokenPath": "./browser-states/tiktok-tokens/your-email_example_com.json",
  "sessionPath": "./browser-states/tiktok-your-email@example.com.json",
  "expiresAt": 1713520800000
}
```

### 如何获取 TikTok Shop Access Token

**需要 TikTok Shop Partner 权限**

1. 注册成为 TikTok Shop Partner
2. 在 Partner Center 创建应用
3. 通过 OAuth 流程获取 access token
4. 或使用 Service Account 方式获取长期 token

参考文档：https://partner.tiktokshop.com/docv2/page/650fdd6cf5247702bed9d8d1

---

## 检查登录状态

```bash
GET /api/browser/tiktok/status?email=your-email@example.com
```

**响应：**
```json
{
  "success": true,
  "data": {
    "platform": "tiktok",
    "email": "your-email@example.com",
    "loggedIn": true,
    "loginType": "cookies",
    "hasSession": true,
    "hasToken": false,
    "isTokenExpired": false,
    "sessionPath": "./browser-states/tiktok-your-email@example.com.json",
    "tokenPath": null,
    "tokenInfo": null,
    "message": "已登录 (Cookies)"
  }
}
```

---

## 发布产品

```bash
POST /api/browser/tiktok/publish
Content-Type: application/json

{
  "email": "your-email@example.com",
  "title": "产品标题",
  "description": "产品描述",
  "price": 29.99,
  "stock": 100,
  "images": ["/path/to/image1.jpg", "/path/to/image2.jpg"],
  "useApi": false,
  "autoLogin": true
}
```

**参数说明：**
- `email`: 登录邮箱（必需）
- `title`: 产品标题（必需）
- `description`: 产品描述
- `price`: 价格
- `stock`: 库存数量
- `images`: 图片路径数组
- `useApi`: 是否使用 API 模式（需要 token 登录）
- `autoLogin`: 未登录时是否自动打开浏览器登录（默认 true）

**🚀 自动登录流程：**
1. 调用发布接口时如果未登录，自动打开浏览器
2. 用户在浏览器中手动登录 TikTok
3. 关闭浏览器后自动保存登录状态
4. 继续执行产品发布流程

**响应示例（自动登录）：**
```json
{
  "success": true,
  "message": "产品发布成功",
  "loginType": "session",
  "platform": "tiktok",
  "productTitle": "产品标题"
}
```

---

# 三种登录方式对比

| 特性 | 真实浏览器 | Cookies 导入 | Token 登录 |
|------|------------|--------------|------------|
| 需要打开浏览器 | ✅ 是 | ❌ 否 | ❌ 否 |
| 需要手动操作 | ✅ 是 | ❌ 否 | ❌ 否 |
| 适合自动化 | ⚠️ 有限 | ✅ 是 | ✅ 是 |
| 稳定性 | 高 | 中（Cookies 会过期） | 中（Token 会过期） |
| 适用场景 | 首次登录/复杂操作 | 已有登录态迁移 | API 调用/程序集成 |
| 获取难度 | 简单 | 中等 | 较难（需 API 权限） |

---

# 注意事项

1. **Cookies 有效期**：通常 1-2 周，过期后需要重新导入
2. **Token 有效期**：Access Token 通常 24 小时，需要 refresh token 续期
3. **安全性**：Cookies 和 Token 都保存在服务器本地，请妥善保管
4. **多账号**：支持多个账号，用 email 区分
5. **TikTok Shop API**：需要 Partner 权限，普通卖家无法直接获取

---

# 文件存储位置

```
browser-states/
├── youtube-email@example.com.json          # YouTube Session
├── youtube-tokens/
│   └── email_example_com.json              # YouTube Token
├── tiktok-email@example.com.json           # TikTok Session
└── tiktok-tokens/
    └── email_example_com.json              # TikTok Token
```
