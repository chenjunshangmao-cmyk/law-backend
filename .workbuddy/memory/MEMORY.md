# MEMORY.md - Claw 项目核心记忆

## 项目信息
- **项目名**：Claw 外贸电商管理平台
- **前端**：React+TypeScript (`frontend/src/`)，部署 Cloudflare Pages → https://claw-app-2026.pages.dev
- **后端**：Node.js+Express（生产入口 `src/index.db.js`），部署 Render → https://claw-backend-2026.onrender.com
- **数据库**：PostgreSQL（Render 托管）
- **Git**：Gitee `https://gitee.com/lyshlc/claw.git` + GitHub `git@github.com:chenjunshangmao-cmyk/law-backend.git`

## 🚨 部署铁律（禁止违反）
1. **永远先 `git pull`** — 确保本地最新代码
2. **禁止 `git push --force`** / **禁止 `git reset --hard`** — 会丢代码
3. **只改 `frontend/src/`** — 不碰 `backend/frontend/`
4. **禁止 `git rebase`**
5. 构建输出：只用 `complete-deploy/`，`deploy-package/` 已废弃
6. **每次部署前必须 `npx vite build` 完整重建** — 禁止复用旧 complete-deploy/ 文件（2026-05-13血泪教训：旧构建产物只有20个chunk，缺失30+页面包括USDT支付）
7. **构建后验证**: grep "USDT" complete-deploy/assets/app.js 确认关键模块存在
6. 版本号格式：YYYY.MM.DD.NNN，deploy.bat 一键部署

## 🛡️ 三层部署保障
- **Layer 1**：`scripts/pre-deploy-check.js` — 部署前检测 CODELOCK 锁定文件
- **Layer 2**：`scripts/smoke-test.js` — 部署后6项烟雾测试
- **Layer 3**：心跳监控自动化 — 每5分钟检查，异常时才告警

## 认证系统
- JWT_SECRET = `claw-default-secret-key-for-development-only-32chars`
- 密码加密：bcryptjs，认证中间件：`src/middleware/auth.js`
- 数据源：authMiddleware → dbService → PostgreSQL

## 支付系统
- **收钱吧**：终端 claw-pay-prod-0507 (SN 100111220054832254)，金额单位永远是分
- **USDT**：钱包 0xFd90b70AEC057B09b856508142070F96A69BDCD4，ethers.js v6，支持 ETH/BSC/Polygon
- **验签策略**：MD5优先 → RSA备选 → IP信任

## 核心模块
- **AI客服中心**：LINE+WhatsApp+微信三平台，全品类通用，AIChatEngine 引擎
- **AI数字人直播**：TTS+唇形同步+RTMP推流，`src/services/avatar/`
- **外贸干货文章**：`src/routes/articles.js`，6分类+DeepSeek AI生成，前端 ArticlesPage
- **小红书发布**：半自动模式（`semiAuto`参数），54词敏感词拦截
- **浏览器自动化**：`src/services/browserAutomation.js`，支持 TikTok/OZON/YouTube/Facebook

## Facebook 发布（2026-05-10 上线）
- `src/services/facebookAutomation.js` — 自包含 Playwright 管理
- `src/routes/facebook.js` — 14个API端点
- `frontend/src/pages/FacebookPage.tsx` — 前端页面

## DeepSeek API 密钥状态（2026-05-10）
- ✅ **可用**：`sk-4848b41dad43443c85e4cb57d428273d`（src/services/ai/AIGateway.js）
- ❌ **过期**：`sk-8a07c75081df49ac877d6950a95b06ec`（src/.env 旧密钥）
- 批量生成文章脚本：`scripts/batch-generate-articles.js`

## Bug 优先级
- P0：网站打不开/支付出错/数据库挂 → 立即处理
- P1：功能无法使用/数据错误 → 当天处理
- P2：小bug/体验问题 → 本周
- P3：优化/重构 → 排期

## Ollama + Nova
- Ollama: 0.0.0.0:11434 (qwen2.5:7b 主力)
- Gateway: 端口 11435，Nginx 代理 `/ollama/`
- Nova AI: 24工具，钉钉+Web双通道，`~\.nova\nova.py`

## 数据库智能降级机制 (2026-05-13)
- `database.js` v3.0: 智能Pool包装器，PG挂了自动切JSON文件模式
- 所有 `pool.query()` 调用自动感知PG状态，失败时降级到内存查询引擎
- 内存查询引擎支持：users, articles, payment_orders, accounts, products, quotas, whatsapp_links 等表
- JSON文件每60秒自动保存，启动时自动加载
- findUserById 内存模式也带JSON文件兜底（兼容auth.min.js直写JSON）

## AI工具箱 v2 (2026-05-13)
- 参考美图设计室(designkit.cn)设计
- 11个工具、3大分类：电商套图/图片处理/AI内容
- AI文案支持4种模板：标题优化、卖点提炼、详情描述、短视频脚本
- 后端API: /api/ai-tools/generate-copy (DeepSeek Gateway驱动)
- 图片类工具采用AI降级策略（原图返回+AI分析建议）
