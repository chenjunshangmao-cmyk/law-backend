# MEMORY.md - Claw 项目核心记忆

## 当前时间
2026-04-20

## 团队配置（已建立）
Claw 外贸网站维护团队，4AI+总指挥架构：
- 总指挥：WorkBuddy AI（我）
- Backend-AI：后端开发（Node.js、API、数据库）
- Frontend-AI：前端开发（React、TypeScript）
- QA-AI：测试审核（第一道关）
- Final-AI：最终审核（第二道关，双审核降低出错率）

团队目录：C:\Users\Administrator\WorkBuddy\Claw\.team\
协议文件：.team\PROTOCOL.md

## 项目信息
- 项目名：Claw 外贸网站
- 代码：C:\Users\Administrator\WorkBuddy\Claw\
- 前端：src\（React + TypeScript）
- 后端：src\（生产入口：src/index.db.js，**不是** src/index.js）
- 部署：https://claw-app-2026.pages.dev（Cloudflare Pages）
- 后端服务：Render

## 认证系统关键配置（2026-04-20 更新）
- 实际生产认证：src/routes/auth.min.js（JSON+PG双写）
- 认证中间件：src/middleware/auth.js（**已修复**：改用 dbService.js 而非 dataStore.js）
- JWT 密钥一致：JWT_SECRET = process.env.JWT_SECRET || 'claw-default-secret-key-for-development-only-32chars'
- 密码加密：bcryptjs（注册时 hash，登录时 compare）
- 数据源：authMiddleware → dbService → PostgreSQL（统一数据源）

## 验收标准
能用、不报错、不影响现有功能、双审核通过

## Bug优先级规则
- P0紧急：网站打不开/致命报错/支付出错 → 立即处理
- P1重要：功能无法使用/数据错误 → 当天处理
- P2一般：小bug/体验问题 → 本周处理
- P3优化：体验优化/代码重构 → 排期处理

## 浏览器自动化 Phase 1 修复（2026-04-20 完成）
核心文件：
- src/services/browserAutomation.js（API路由调用）
- browserAutomation.js（根目录CLI版，同步更新）
- src/routes/browser.js（API路由）

已修复：
1. headless自动检测（服务器true/本地false，可通过BROWSER_HEADLESS环境变量强制）
2. TikTok URL修复：seller.tiktok.com → seller-accounts.tiktok.com/account/login
3. 防检测增强（locale/timezone/viewport/随机UA/extraHTTPHeaders）
4. Session文件名支持accountId参数（多账号不冲突）
5. Session过期验证（validateSession方法）
6. API新增：/system-status、/session DELETE
7. OZON自动化完整支持
8. CLI命令行工具（node browserAutomation.js）

API端点：
- POST /api/browser/tiktok/login { email, accountId? }
- GET  /api/browser/tiktok/status?email=&accountId=
- POST /api/browser/tiktok/publish { email, title, price, accountId? }
- POST /api/browser/youtube/login { email, accountId? }
- GET  /api/browser/youtube/status?email=&accountId=
- POST /api/browser/youtube/upload { email, videoPath, title, accountId? }
- POST /api/browser/ozon/login { email }
- GET  /api/browser/ozon/status?email=
- GET  /api/browser/system-status
- DELETE /api/browser/session?email=&platform=&accountId=
