# MEMORY.md - Claw 项目核心记忆

## 当前时间
2026-04-20

## 团队配置（v2.1 实际运转版，真正在线运行）
Claw 外贸网站维护团队，4AI+总指挥架构：
- 总指挥：WorkBuddy AI（我）- 接收任务、拆解、分配、部署、交付
- Backend-AI：后端开发（Node.js、API、数据库）
- Frontend-AI：前端开发（React、TypeScript）
- QA-AI：测试审核（第一道关，5项检查清单）
- Final-AI：最终审核（第二道关，安全+影响评估）

**团队已实际建立！**
- Team平台名：claw-team（异步运行）
- 成员：backend、frontend、qa、final-review（已启动待命）
- 协议文件：.team/PROTOCOL.md（v2.1）
- 团队目录：C:\Users\Administrator\WorkBuddy\Claw\.team\

**运转流程**：
用户→总指挥拆解→Backend/Frontend写代码+Handoff→QA第一审→Final第二审→总指挥部署→交付用户

**文件规范**：
- Handoff：.team/shared/handoffs/TASK-YYYY-MM-DD-NNN-*-HANDOFF.md
- QA报告：.team/shared/reviews/TASK-...-QA-REPORT.md
- Final报告：.team/shared/reviews/TASK-...-FINAL-REPORT.md
- 任务清单：.team/shared/tasks/TASK-LIST.md

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

## Git 仓库配置（2026-04-20 更新）
- Gitee（主仓）: https://gitee.com/lyshlc/claw.git（HTTPS，SSH key需添加到Gitee账户才能推送）
- GitHub（law-backend，触发Render部署）: git@github.com:chenjunshangmao-cmyk/law-backend.git
- SSH key: id_ed25519（公钥 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOh4gc6ogBRCl4Q0DZXiyyGavaf3MvbvEwsvHl5RlELT）

## 部署状态（2026-04-20 20:30 修复）
- **前端**: Cloudflare Pages ✅ 修复后重新部署：https://df98523c.claw-app-2026.pages.dev
  - 问题：complete-deploy缺少deploy-package的4个关键文件（chat-widget/platform-nav/app-styles/index-DmCeXBoo）
  - 教训：构建后必须对比新旧deploy-package的所有文件
- **后端**: GitHub已推送 ✅ → Render自动重新部署中（commit caed4a1）
- **Gitee**: 需将SSH公钥添加到Gitee账户（备份仓，非关键）

## 部署前必做检查
1. 构建后对比 complete-deploy/ 和 deploy-package/ 的文件列表，确保无遗漏
2. 关键文件清单（必须包含）：app.js, app.css, app-styles.css, chat-widget.js, platform-nav.js, index-DmCeXBoo.js
3. wrangler 部署命令：npx wrangler pages deploy complete-deploy --project-name=claw-app-2026

## 关键教训
- Git commit 后必须 push 才能触发自动部署
- Render 监控 GitHub law-backend 仓库，不是 Gitee
- Cloudflare Pages 可用 `npx wrangler pages deploy complete-deploy` 直接部署，无需 git push
