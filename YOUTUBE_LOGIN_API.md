# YouTube 登录 API 文档

## 概述

Claw 支持 **3 种 YouTube 登录方式**：

| 方式 | 接口 | 适用场景 |
|------|------|----------|
| A. 真实浏览器登录 | `POST /api/browser/youtube/login` | 需要真实操作 YouTube |
| B. Cookies 导入 | `POST /api/browser/youtube/login-cookies` | 已有浏览器 Cookies |
| C. Token 登录 | `POST /api/browser/youtube/login-token` | 有 YouTube Data API Token |

---

## A. 真实浏览器登录

打开 Chromium 浏览器，用户手动登录。

```bash
POST /api/browser/youtube/login
Content-Type: application/json

{
  "email": "your-email@gmail.com"
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功，Session已保存",
  "sessionPath": "./browser-states/youtube-your-email@gmail.com.json"
}
```

---

## B. Cookies 导入登录（虚拟登录）

直接导入浏览器 Cookies，无需打开真实浏览器。

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
      "path": "/",
      "expires": 1769999999,
      "httpOnly": true,
      "secure": true
    },
    {
      "name": "SSID",
      "value": "your-ssid-value",
      "domain": ".youtube.com",
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
  "email": "your-email@gmail.com",
  "sessionPath": "./browser-states/youtube-your-email@gmail.com.json",
  "cookieCount": 2
}
```

### 如何获取 Cookies

1. 在浏览器中登录 YouTube
2. 按 F12 打开开发者工具
3. 切换到 Application/应用 → Cookies
4. 复制 youtube.com 下的关键 cookies：
   - `SID`
   - `SSID`
   - `APISID`
   - `SAPISID`
   - `LOGIN_INFO`
   - `__Secure-1PSID`

---

## C. Token 登录（虚拟登录）

使用 YouTube Data API 的 Access Token 登录。

```bash
POST /api/browser/youtube/login-token
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0dx...",  // 可选
  "expiresIn": 3600  // 可选，秒
}
```

**响应：**
```json
{
  "success": true,
  "message": "Token 登录成功，虚拟登录完成",
  "loginType": "token",
  "email": "your-email@gmail.com",
  "tokenPath": "./browser-states/youtube-tokens/your-email_gmail_com.json",
  "sessionPath": "./browser-states/youtube-your-email@gmail.com.json",
  "expiresAt": 1713520800000
}
```

### 如何获取 Access Token

**方式 1：Google OAuth Playground**
1. 访问 https://developers.google.com/oauthplayground
2. 选择 scope: `https://www.googleapis.com/auth/youtube.upload`
3. 点击授权并获取 access token

**方式 2：Google Cloud Console**
1. 创建 OAuth 2.0 客户端 ID
2. 使用授权流程获取 token

---

## 检查登录状态

```bash
GET /api/browser/youtube/status?email=your-email@gmail.com
```

**响应：**
```json
{
  "success": true,
  "data": {
    "platform": "youtube",
    "email": "your-email@gmail.com",
    "loggedIn": true,
    "loginType": "token",
    "hasSession": true,
    "hasToken": true,
    "isTokenExpired": false,
    "sessionPath": "./browser-states/youtube-your-email@gmail.com.json",
    "tokenPath": "./browser-states/youtube-tokens/your-email_gmail_com.json",
    "tokenInfo": {
      "createdAt": 1713517200000,
      "expiresAt": 1713520800000
    },
    "message": "已登录 (Token)"
  }
}
```

---

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
  "useApi": false  // true = 使用 YouTube Data API, false = 使用浏览器自动化
}
```

---

## 三种方式对比

| 特性 | 真实浏览器 | Cookies 导入 | Token 登录 |
|------|------------|--------------|------------|
| 需要打开浏览器 | ✅ 是 | ❌ 否 | ❌ 否 |
| 需要手动操作 | ✅ 是 | ❌ 否 | ❌ 否 |
| 适合自动化 | ⚠️ 有限 | ✅ 是 | ✅ 是 |
| 稳定性 | 高 | 中（Cookies 会过期） | 中（Token 会过期） |
| 适用场景 | 首次登录/复杂操作 | 已有登录态迁移 | API 调用/程序集成 |

---

## 注意事项

1. **Cookies 有效期**：通常 2-4 周，过期后需要重新导入
2. **Token 有效期**：Access Token 通常 1 小时，需要 refresh token 续期
3. **安全性**：Cookies 和 Token 都保存在服务器本地，请妥善保管
4. **多账号**：支持多个 YouTube 账号，用 email 区分
