# MEMORY.md - Claw 项目核心记忆

## 当前时间
2026-05-08

## 🚨 部署铁律（2026-05-06 血的教训）
**每次部署前必须遵守，违反一条就出事故：**
1. **永远先 `git pull`** — 确保本地是最新代码
2. **禁止 `git push --force`** — 会覆盖 Render 后端代码，导致支付崩
3. **禁止 `git reset --hard <旧commit>`** — 会丢掉当天新代码（收钱吧终端等）
4. **只改 `frontend/src/`** — 不碰 `backend/frontend/`（旧副本）
5. **禁止 `git rebase`** — 冲突时无法恢复
6. 详细流程见 skill: `claw-deploy`

## 🛡️ 三层部署保障体系（2026-05-08 上线）
**每次部署自动执行，防止锁定功能被意外破坏：**

### Layer 1: CODELOCK 部署前门禁 (`scripts/pre-deploy-check.js`)
- 解析 CODELOCK.md → 提取锁定文件列表 → `git diff HEAD -- <file>` 检测变更
- 锁定文件被修改 → **中止部署** + 打印红色警告（白名单：FORCE_DEPLOY 环境变量）
- AI 更新 AI工具箱/利润计算器等非锁定功能 → 无影响，正常部署
- 接入: deploy.bat Step 2/9

### Layer 2: 部署后烟雾测试 (`scripts/smoke-test.js`)
- 6项自动检查: 后端健康 / 数据库连通 / 登录认证 / 支付系统 / WhatsApp落地页 / 前端可达
- 接入: deploy.bat Step 9/9
- 失败不会中止部署，但打印警告

### Layer 3: 持续心跳监控 (automation)
- `src/routes/heartbeat.js`: GET /api/heartbeat — 数据库+WhatsApp+支付+内存+运行时间
- 自动化: 每5分钟检查，异常时告警（P0: 数据库/WhatsApp/支付挂）
- 正常时静默，只在异常时汇报

## 版本管理系统（2026-05-04 建立）
- VERSION.md：版本记录本，记录当前版本号、构建者、Git提交、变更历史
- deploy.bat：一键部署脚本（pull → build → 版本+1 → 验证chunk → wrangler部署）
- 网站底部显示版本号（侧边栏，从 vite.config.ts 注入 `__CLAW_VERSION__`）
- **构建输出目录**：只用 `complete-deploy/`（Vite 直接输出），`deploy-package/` 已废弃
- **部署铁律**：pull → 重新构建 → 更新 VERSION.md → 部署，禁止直接用旧文件
- 版本号格式：YYYY.MM.DD.NNN（如 2026.05.04.003）

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

## 收钱吧核心配置（2026-05-07 正式激活 ✅）
- **当前终端**: claw-pay-prod-0507（正式激活码 64307934）
- 终端 SN：100111220054832254
- terminalKey：b68483ae92623c03d5c41d5b40931209
- vendorSn：91803325
- vendorKey：677da351628d3fe7664321669c3439b2
- appId：2026041600011122
- storeSn：1580000011101653
- 金额单位：永远是分（199元=19900）
- 完整文档：C:\Users\Administrator\WorkBuddy\Claw\收钱吧完整技术文档.md
- **验收报告**：C:\Users\Administrator\WorkBuddy\Claw\收钱吧支付系统验收报告.md
- **验签策略**：MD5优先(body.sign) → RSA备选(Authorization) → IP信任(47.96.x.x)

## 收钱吧故障记录（2026-05-04 v005 更新）
- **claw-web-new3** (SN 100111220054389553) — ✅ 正确的工作终端（v005已切回）
  - terminalKey: `96bfaf401367d934cb10a1cbe9773647`
  - ⚠️ 密钥可能已被轮换，当前 WAP 网关返回 ILLEGAL_SIGN — 需要联系方健平
  - 之前3笔¥1.99测试订单用的就是这个终端（4月下旬）
- **claw-web-new1** (SN 100111220054361978) — ❌ 永久废弃
  - 3份文档标记为"废弃/废了"，WAP网关返回错误页
  - v004错误地切换到此终端 — v005已修正
- **两个激活码均失效**: 66172491(EJ05已使用), 81119079(EJ06已过期)
- **operator参数**: 官方文档要求必填，之前代码遗漏 — v005已修复

## 部署状态（2026-05-07 最新）
- **前端最新**: Cloudflare Pages ✅ https://df35750b.claw-app-2026.pages.dev（v2026.05.07.009）
- **主域名**: https://claw-app-2026.pages.dev（自动指向最新生产版）
- **后端**: claw-backend-2026.onrender.com ✅（Render自动部署，commit 9ace012）
- **后端源码路径**: **根目录 `src/`**（不是 `backend/src/`！Render 用 `src/`）
- **Gitee**: https://gitee.com/lyshlc/claw.git
- **GitHub**: git@github.com:chenjunshangmao-cmyk/law-backend.git
- **构建输出**: 只用 complete-deploy/，deploy-package/ 已废弃
- **前端源码**: frontend/（不是 backend/frontend/）

## USDT 加密支付（2026-05-05 上线）
- **钱包地址**: 0xFd90b70AEC057B09b856508142070F96A69BDCD4
- **私钥/助记词**: 保存在项目根目录 USDT钱包信息.md（机密，勿泄露）
- **技术支持**: ethers.js v6.16，USDT ERC-20 合约
- **支持链**: Ethereum(ERC-20) / BSC(BEP-20) / Polygon
- **API路由**: /api/crypto/create, /api/crypto/status/:no, /api/crypto/wallet
- **前端**: MembershipPage.tsx 套餐+业务卡片均有 USDT 支付按钮
- **自动确认**: 前端 8 秒轮询 → 后端查 Transfer 事件 → 金额匹配 → paid
- **必需环境变量**: PRIVATE_KEY、INFURA_PROJECT_ID（Render）
- **数据库字段**: payment_orders 表新增 payment_method, crypto_chain, crypto_address, crypto_tx_hash
- **汇率**: CoinGecko/ExchangeRate-API 实时 USD/CNY 汇率，缓存10分钟，失败兜底7.2
- **价格换算**: CNY ÷ 汇率 = USDT（基础版 ¥199 ÷ 7.2 ≈ $27.6）

## 部署前必做检查（v2 版本管理系统）
1. **git pull** — 确保本地是最新代码
2. **重新构建** — `cd frontend && npx vite build`，输出到 `complete-deploy/`
3. **验证 chunk hash** — app.js 引用的文件名必须全部存在于 complete-deploy/assets/
4. **更新 VERSION.md** — 版本号+1，填写变更内容
5. **部署** — `npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master`
6. **也可以直接用 deploy.bat** — 一键完成以上所有步骤

## 废弃目录
- `deploy-package/` — 已废弃，不要再使用。只用 `complete-deploy/`

## 小红书合规系统（2026-05-06 建立）
- **AI文案**: 去营销化（开箱/心得/日常/对比），禁推销话术/价格/链接
- **反检测**: 人类行为模拟（逐字输入/随机延迟/鼠标轨迹）、随机UA/视口/地理位置、webdriver隐藏、3分钟频率限制
- **敏感词**: 4类54词自动拦截，POST /api/xiaohongshu/check-compliance
- **标签**: 限制5个以内
- **半自动模式**（2026-05-06 新增）:
  - 前端开关：「半自动模式」（橙色），默认关闭
  - 后端参数：`publishNote()`/`publishVideo()` 新增 `semiAuto` 参数（默认 false）
  - 行为：`semiAuto=true` → 填完标题/正文/标签/图片后**立即 return**，`不点发布按钮`；浏览器 `headless:false`（有头），且不调用 `xhs.close()`
  - 全自动保留：`semiAuto=false`（默认）→ 原有逻辑完全不变
  - 前端适配：`handlePublishNote`/`handlePublishVideo`/`handlePublishProduct` 均传 `semiAuto`；响应 `result.data?.semiAuto===true` 时不清表单，提示用户去浏览器窗口手动点发布
  - 使用场景：降低平台检测风险，最后一步由用户手动完成
- Git commit 后必须 push 才能触发自动部署
- Render 监控 GitHub law-backend 仓库，不是 Gitee
- Cloudflare Pages 可用 `npx wrangler pages deploy complete-deploy` 直接部署，无需 git push

## AI工具成本核算（2026-05-08）
- **均衡方案月成本**: ¥1,988（AI抠图¥50 + 去水印¥0 + 图片¥108 + 短视频¥288 + 数字人¥497 + 服务器¥500 + WhatsApp¥150 + 预留¥395）
- **自建AI数字人**: ¥1,300-2,850/月（GPU¥800-1,500 + LLM API¥200-500 + RTMP¥300-800），比第三方省60-70%
- **自建技术栈**: OpenClaw Agent总控 + VRM/Three.js渲染 + Edge TTS + Whisper STT + Rhubarb口型同步 + FFmpeg/RTMP推流 + OBS分发
- **旗舰版¥5,888覆盖**: 1个客户净利润¥1,888-4,588；2个¥8,000+；5个¥25,000+/月
- **成本模型**: AI工具是固定开支（共享基础设施），会员收入是线性叠加 → 客户越多利润率越高
