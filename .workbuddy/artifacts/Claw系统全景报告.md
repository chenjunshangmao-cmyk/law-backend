# Claw 外贸智能工具 — 系统全景报告

**生成时间**: 2026-05-13 10:00 CST  
**版本**: v2026.05.13.009  
**报告人**: AI WorkBuddy（软件工程主管）

---

## 目录

1. [系统架构概览](#1-系统架构概览)
2. [前端部署（Cloudflare Pages）](#2-前端部署cloudflare-pages)
3. [后端部署（Render）](#3-后端部署render)
4. [数据库（PostgreSQL）](#4-数据库postgresql)
5. [会员系统](#5-会员系统)
6. [支付系统](#6-支付系统)
7. [认证与用户管理](#7-认证与用户管理)
8. [AI客服系统](#8-ai客服系统)
9. [功能模块清单](#9-功能模块清单)
10. [Git代码管理](#10-git代码管理)
11. [当前运行状态](#11-当前运行状态)
12. [注意事项与风险](#12-注意事项与风险)
13. [运维清单](#13-运维清单)

---

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────┐
│  用户浏览器                                          │
│  https://claw-app-2026.pages.dev                    │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────┐
│  Cloudflare Pages (前端)                            │
│  - React+TypeScript SPA                             │
│  - 37个页面                                         │
│  - CDN全球加速                                       │
└──────────────┬──────────────────────────────────────┘
               │ API 请求
┌──────────────▼──────────────────────────────────────┐
│  Render (后端)                                      │
│  https://claw-backend-2026.onrender.com             │
│  - Node.js + Express                                │
│  - 30+ API路由                                      │
│  - JWT认证                                          │
└──────┬───────────────────────┬──────────────────────┘
       │ pinggy隧道            │ (已断开)
       ▼                       ▼
┌──────────────┐    ┌────────────────────┐
│ 本地 PostgreSQL│    │ Render PostgreSQL   │
│ (本机5432)    │    │ dpg-d7dlk6h...      │
│ ✅ 运行中     │    │ ❌ 永久不可用        │
└──────────────┘    └────────────────────┘
```

**关键依赖关系**:
- 前端 → Cloudflare Pages（独立部署）
- 后端 → Render（独立部署，通过 GitHub webhook 自动部署）
- 数据库 → 本机 PostgreSQL 18（通过 pinggy.io TCP 隧道暴露）
- 存储 → Render 临时文件系统（JSON 文件在重启后丢失）

---

## 2. 前端部署（Cloudflare Pages）

| 项目 | 详情 |
|------|------|
| **地址** | https://claw-app-2026.pages.dev |
| **最新部署ID** | `1b904d05`（v008 恢复版） |
| **框架** | React 18 + TypeScript |
| **构建** | Vite → `complete-deploy/` → wrangler CLI |
| **页面数** | **37个页面** |
| **部署方式** | `deploy.bat` 一键部署 |

### 前端页面清单

| 分类 | 页面 | 说明 |
|------|------|------|
| **核心** | HomePage, DashboardPage, ModernDashboard | 首页/仪表盘 |
| **认证** | LoginPage, ModernLogin, ModernRegister | 登录/注册 |
| **会员** | MembershipPage | 套餐购买/管理 |
| **电商** | ProductsPage, DigitalShopPage, OzonPublishPage | 商品管理/发布 |
| **内容** | WriterPage, NovelFactoryPage, AiContentPage | AI写作/文案 |
| **视频** | VideoFactoryPage, LiveStreamPage | 短视频/直播 |
| **AI** | AIToolsPage, AIGatewayPage, AvatarPage | AI工具箱/数字人 |
| **发布** | PublishPage, SmartPublishPage, TikTokPublishPage | 多平台发布 |
| **平台** | TikTokPage, FacebookPage | 平台管理 |
| **客服** | CustomerServicePage, WhatsAppPage | 客服系统 |
| **其他** | CalculatorPage, ArticlesPage, OrdersPage, AccountsPage, SettingsPage, ServicesPage, TrendingPage, ArticleDetailPage, PaymentResultPage, AdCollectionPage | 利润计算/文章/订单/设置等 |

### ⚠️ 前端注意事项

1. **SPA应用** — 需要JS运行，搜索引擎无法抓取完整内容
2. **版本号显示** — HTML标题显示 `v2026.05.13.008`
3. **构建产物** — `complete-deploy/` 必须在每次部署前 `vite build` 完全重建
4. **不能直接commit旧构建产物** — v006/v007曾因漏构建丢失30+页面

---

## 3. 后端部署（Render）

| 项目 | 详情 |
|------|------|
| **地址** | https://claw-backend-2026.onrender.com |
| **部署源** | GitHub `chenjunshangmao-cmyk/law-backend` master分支 |
| **入口文件** | `src/index.db.js` |
| **运行时** | Node.js |
| **自动部署** | ✅ GitHub push → Render webhook → 自动构建部署 |
| **健康检查** | `/api/heartbeat` |

### 后端环境特点

- Render 免费层：15分钟无请求自动休眠，有外部请求时自动唤醒（冷启动10-30秒）
- 文件系统：临时存储，每次部署/重启会**清空所有本地文件**（包括 JSON 数据文件）
- 这就是之前会员丢失的根因——JSON文件在Render上不可靠

### API路由清单（30+模块）

| 路由前缀 | 功能 | 备注 |
|----------|------|------|
| `/api/heartbeat` | 健康检查 | mode字段标识pg/json |
| `/api/auth` | 用户认证 | auth.min.js v2（已修复连接池） |
| `/api/auth/youtube` | YouTube OAuth | 视频授权 |
| `/api/youtube` | YouTube Data API | 视频上传/管理 |
| `/api/membership` | 会员管理 | PLANS 5档套餐 |
| `/api/quota` | 额度管理 | 功能用量追踪 |
| `/api/products` | 商品管理 | CRUD |
| `/api/generate` | AI生成 | 商品描述/标题 |
| `/api/calculate` | 利润计算 | 跨境电商利润 |
| `/api/accounts` | 社交账号管理 | 多平台账号绑定 |
| `/api/publish` | 平台发布 | 自动发布到各平台 |
| `/api/payment` | 支付 | 收钱吧/USDT |
| `/api/shouqianba` | 收钱吧 | 扫码支付终端 |
| `/api/customer-service` | AI客服 | LINE/WhatsApp/微信 |
| `/api/whatsapp-cs` | WhatsApp客服 | 独立客服路由 |
| `/api/wechat-cs` | 微信客服 | |
| `/api/line` | LINE客服 | |
| `/api/facebook` | Facebook | 14个端点 |
| `/api/tiktok` | TikTok | 数据抓取 |
| `/api/articles` | 外贸干货文章 | 6分类+AI生成 |
| `/api/writer` | AI写作 | |
| `/api/video-factory` | 短视频工厂 | |
| `/api/live-stream` | 直播 | |
| `/api/avatar` | AI数字人 | TTS+唇形同步 |
| `/api/ai-tools` | AI工具箱 | 11个工具 |
| `/api/gateway` | AI网关 | DeepSeek API |
| `/api/browser` | 浏览器自动化 | Playwright |
| `/api/xiaohongshu` | 小红书 | 内容发布 |
| `/api/tasks` | 任务管理 | |
| `/api/proxies` | 代理管理 | |

---

## 4. 数据库（PostgreSQL）

### 当前架构

```
Render 后端 ←→ pinggy隧道 ←→ 本机 PostgreSQL 18
                                (C:\PostgreSQL\18)
                                DB: claw
                                端口: 5432
```

### 数据库连接

| 项目 | 值 |
|------|-----|
| **PostgreSQL 版本** | 18 |
| **数据库名** | claw |
| **远程用户** | claw_render |
| **认证方式** | scram-sha-256 |
| **当前隧道地址** | dukhv-112-9-120-108.run.pinggy-free.link:43425 |
| **隧道类型** | pinggy.io TCP（免费60分钟） |
| **自动续期** | ✅ 守护进程自动处理 |

### 数据表清单（8张表）

| 表名 | 记录数 | 用途 | 状态 |
|------|--------|------|------|
| `users` | **3** | 用户账号 | 🟢 |
| `quotas` | **1** | 功能额度 | 🟢 |
| `articles` | 0 | 外贸干货文章 | ⚠️ 空（PG之前不可用） |
| `products` | 0 | 商品数据 | ⚠️ 空 |
| `payment_orders` | 0 | 支付订单 | ⚠️ 空 |
| `accounts` | 0 | 社交平台账号 | ⚠️ 空 |
| `whatsapp_links` | 0 | WhatsApp链接 | ⚠️ 空 |
| `shouqianba_terminals` | 0 | 收钱吧终端 | ⚠️ 空 |

### 用户数据（users表）

| ID | 邮箱 | 角色 | 会员 | 到期 | 状态 |
|----|------|------|------|------|------|
| user-admin-001 | admin@claw.com | admin | flagship旗舰版 | 2099-12-31 | active |
| user-demo-001 | user@claw.com | user | premium专业版 | 2027-05-13 | active |
| 1b5bd5d2-... | permanent@claw.com | user | free免费版 | - | active |

### ⚠️ 数据库注意事项

1. **Render PG已永久不可用** — DNS解析失败(ENOTFOUND)，实例`dpg-d7dlk6hkh4rs739s00b0-a`已消失
2. **本地PG是唯一数据源** — 务必保护好
3. **pinggy免费隧道60分钟过期** — 守护进程自动续期
4. **本机关机 = 数据库断了** — Render后端会自动降级到JSON模式，数据有丢失风险
5. **空闲表需要重新填充** — articles/products等表因PG长期不可用而空

---

## 5. 会员系统

### 5档套餐

| 套餐 | 价格(分) | 价格(元) | 店铺 | AI文案 | AI图片 | AI视频 | 数字人 | WhatsApp | 定制 |
|------|----------|----------|------|--------|--------|--------|--------|----------|------|
| **free 免费版** | 0 | ¥0 | 2 | 0/月 | 0/月 | 0/日 | 不可用 | 1条试用 | - |
| **basic 基础版** | 19900 | ¥199 | 5 | 50/月 | 20/月 | 1/日 | 不可用 | 2条 | - |
| **premium 专业版** | 49900 | ¥499 | 10 | 无限 | 100/月 | 2/日 | 1频道 | 10条 | - |
| **enterprise 企业版** | 159900 | ¥1599 | 无限 | 无限 | 500/月 | 10/日 | 3频道 | 50条 | - |
| **flagship 旗舰版** | 588800 | ¥5888 | 无限 | 无限 | 无限 | 无限 | 5频道+定制 | 100条 | ✅ |

### ⚠️ 会员系统注意事项

1. **PG字段名 `membership_type`** — 不是 `plan`，已修复代码兼容两者
2. **auth.js内置用户** — `admin@claw.com` 的硬编码 plan 是 `enterprise`，实际以PG中 `flagship` 为准
3. **支付回调** — 收钱吧支付成功后需更新 `users.membership_type` 和 `membership_expires_at`
4. **额度表 `quotas`** — 记录 `ai_copy_used`、`ai_image_used`、`ai_video_used` 等用量
5. **注册时默认plan** — 新注册用户默认 `free`

---

## 6. 支付系统

### 支付方式

| 方式 | 状态 | 说明 |
|------|------|------|
| **收钱吧扫码** | 🟡 配置中 | 终端SN: 100111220054832254 |
| **USDT** | 🟡 配置中 | 钱包: 0xFd90b70AEC057B09b856508142070F96A69BDCD4 |

### 支付配置

- 收钱吧: `src/routes/shouqianba.db.js`
- USDT: ethers.js v6，支持ETH/BSC/Polygon
- 验签策略: MD5优先 → RSA备选 → IP信任
- 金额单位: 收钱吧永远用**分**

### ⚠️ 支付注意事项

1. **shouqianba_terminals表为空** — 终端配置需重新写入PG
2. **收钱吧回调** — 需配置公网回调地址，否则收不到支付通知
3. **USDT验签** — 区块链确认需要时间，可能需要轮询确认

---

## 7. 认证与用户管理

### 认证流程

```
用户登录 → auth.min.js → findUserByEmailPG → smartPool → 本地PG
                          ↓ (PG不可用时)
                        JSON文件 → 内存 → 内置用户
```

### 关键配置

| 项目 | 值 |
|------|-----|
| JWT密钥 | `claw-default-secret-key-for-development-only-32chars` |
| JWT有效期 | 7天 |
| 密码加密 | bcryptjs |
| 管理员 | admin@claw.com / admin123（临时） |
| 内置用户 | admin@claw, user@claw, test@claw (auth.js) |

### ⚠️ 认证注意事项

1. **admin密码是临时的** `admin123` — 建议尽快修改
2. **JWT密钥未更改** — 生产环境应使用更强的密钥
3. **auth.min.js v2已修复** — 现在使用smartPool而非独立连接池
4. **内置用户降级** — 当PG完全不可达时，内置用户仍可登录（plan=enterprise）

---

## 8. AI客服系统

### 支持的平台

| 平台 | 路由 | 状态 |
|------|------|------|
| **LINE** | `/api/line` | ✅ 已集成 |
| **WhatsApp** | `/api/whatsapp-cs` | ✅ 已集成 |
| **微信** | `/api/wechat-cs` | ✅ 已集成 |

### AI引擎

- `src/services/customer-service/AIChatEngine.js`
- 使用DeepSeek API驱动
- 全品类通用（不限于翡翠）

### ⚠️ 客服注意事项

1. **WhatsApp链接管理** — 当前活跃链接0条，需配置
2. **成员限额** — 曾计划添加链接过期及会员限额机制（待开发）
3. **AI客服需要DeepSeek密钥** — 确保 `sk-4848b41dad43443c85e4cb57d428273d` 有效

---

## 9. 功能模块清单

### 已上线功能（37个前端页面对应）

| 模块 | 前端页面 | 后端路由 | 状态 |
|------|----------|----------|------|
| 用户仪表盘 | DashboardPage | - | ✅ |
| 用户认证 | LoginPage, RegisterPage | /api/auth | ✅ |
| 会员管理 | MembershipPage | /api/membership | ✅ |
| 商品管理 | ProductsPage | /api/products | ✅ |
| AI写作 | WriterPage | /api/writer | ✅ |
| 小说工厂 | NovelFactoryPage | /api/gateway | ✅ |
| 短视频工厂 | VideoFactoryPage | /api/video-factory | ✅ |
| AI直播 | LiveStreamPage | /api/live-stream | ✅ |
| AI数字人 | AvatarPage | /api/avatar | ✅ |
| AI工具箱 | AIToolsPage | /api/ai-tools | ✅ |
| AI网关 | AIGatewayPage | /api/gateway | ✅ |
| 利润计算器 | CalculatorPage | /api/calculate | ✅ |
| 外贸文章 | ArticlesPage | /api/articles | ⚠️ 数据空 |
| 智能发布 | SmartPublishPage | /api/publish | ✅ |
| TikTok管理 | TikTokPage | /api/browser | ✅ |
| Facebook管理 | FacebookPage | /api/facebook | ✅ |
| OZON发布 | OzonPublishPage | /api/browser | ✅ |
| AI客服 | CustomerServicePage | /api/customer-service | ✅ |
| WhatsApp | WhatsAppPage | /api/whatsapp-cs | ⚠️ 链路空 |
| 小红书 | - | /api/xiaohongshu | ✅ |
| 社交账号 | AccountsPage | /api/accounts | ✅ |
| 订单管理 | OrdersPage | /api/payment | ⚠️ 数据空 |
| 设置 | SettingsPage | - | ✅ |
| 服务页 | ServicesPage | - | ✅ |
| 广告采集 | AdCollectionPage | - | ✅ |
| 热门趋势 | TrendingPage | - | ✅ |
| AI内容 | AiContentPage | - | ✅ |
| 数字商城 | DigitalShopPage | - | ✅ |

---

## 10. Git代码管理

### 仓库配置

| 远程 | 地址 | 用途 |
|------|------|------|
| `origin` | github.com:chenjunshangmao-cmyk/law-backend.git | **Render部署源** |
| `render` | github.com:chenjunshangmao-cmyk/law-backend.git | 同上 |
| `gitee` | gitee.com/lyshlc/claw.git | 国内镜像/完整源码 |
| `claw-github` | github.com:lyshlc/claw.git | GitHub镜像 |

### 最新提交

```
a32ac13 fix: auth.min.js改用database.js智能连接池(支持动态隧道切换)
```

### 部署铁律

1. **永远先 `git pull`**
2. **禁止 `git push --force` / `git reset --hard`**
3. **只改 `frontend/src/`** — 不碰 `backend/frontend/`
4. **禁止 `git rebase`**
5. **构建产物只出 `complete-deploy/`**
6. **版本号格式: YYYY.MM.DD.NNN**

---

## 11. 当前运行状态

**检查时间**: 2026-05-13 10:00 CST

| 组件 | 状态 | 详情 |
|------|------|------|
| 🖥️ 前端 | 🟢 正常 | claw-app-2026.pages.dev |
| 🖥️ 后端 | 🟢 运行中 | uptime: 9分钟，mode: pg |
| 🗄️ 本地PG | 🟢 运行中 | 端口5432，3用户 |
| 🔗 pinggy隧道 | 🟢 连接中 | dukhv-...link:43425 |
| 💰 支付 | 🟡 待配置 | terminals=0 |
| 💬 客服 | 🟡 待配置 | activeLinks=0 |
| 📝 文章 | ⚠️ 空 | 0篇（需重新生成） |
| 📦 商品 | ⚠️ 空 | 0件 |
| 📊 整体状态 | 🟡 degraded | 数据库PG正常，功能模块待填充 |

---

## 12. 注意事项与风险

### 🔴 P0 — 致命风险

| 风险 | 触发条件 | 后果 | 防范 |
|------|----------|------|------|
| **本机关机** | 电脑关机/休眠 | Render后端失去PG → 降级JSON → 重启后数据丢失 | 不要关机；或用云PG |
| **pinggy隧道断连** | 网络波动/免费到期 | 同上 | 守护进程自动重连 |
| **本地PG故障** | 磁盘满/进程崩溃 | 全部数据丢失 | 定期备份PG |

### 🟡 P1 — 重要风险

| 风险 | 说明 |
|------|------|
| **Render冷启动** | 15分钟无请求休眠，首次访问10-30秒延迟 |
| **pinggy免费限制** | 60分钟过期，每次重连获得新地址 |
| **JWT密钥弱** | 使用开发默认值，生产环境应更换 |
| **admin密码弱** | admin123，建议尽快修改 |

### 🟢 P2 — 一般注意

| 项目 | 说明 |
|------|------|
| **构建产物缓存** | 部署前必须 `vite build` 完全重建 |
| **articles表空** | 之前20-30篇文章丢失，需重新生成 |
| **products表空** | 商品数据需重新录入 |
| **支付终端** | 收钱吧终端需重新配置 |
| **版本号更新** | 前端HTML仍显示v008 |

---

## 13. 运维清单

### 每日检查

- [ ] 心跳API是否正常 (`/api/heartbeat`)
- [ ] mode是否为 `pg`（而非 `json`）
- [ ] pinggy守护进程是否运行
- [ ] 本地PG是否可连接

### 部署后检查

- [ ] `git pull` 最新代码
- [ ] `vite build` 完整构建前端
- [ ] 6项烟雾测试通过
- [ ] 重新调用 `set-db` 切换数据库（如后端重启）

### 隧道维护

- [ ] 守护进程脚本: `node scripts/pg-tunnel-daemon.cjs`
- [ ] 手动切换数据库: `POST /api/heartbeat/set-db`
- [ ] 当前隧道地址查看: 守护进程日志 `/tmp/pg-tunnel.log`

### 数据库备份

```bash
# 备份本地PG
PGPASSWORD=ClawRemote2026! /c/PostgreSQL/18/bin/pg_dump -h localhost -U claw_render claw > claw_backup_$(date +%Y%m%d).sql
```

### 紧急恢复

如果本机重启后数据库连不上：

```bash
# 1. 启动PG
net start postgresql-18
# 2. 启动隧道守护进程
node scripts/pg-tunnel-daemon.cjs
# 3. 等待隧道建立（约5秒）
# 4. 守护进程会自动更新Render后端
```

---

## 附录：管理员账号

| 项目 | 值 |
|------|-----|
| 邮箱 | admin@claw.com |
| 密码 | admin123（临时，请尽快修改） |
| 角色 | admin |
| 会员 | flagship 旗舰版（¥5888/年） |
| 到期 | 2099-12-31（永久） |
| 网站 | https://claw-app-2026.pages.dev |
| 后端 | https://claw-backend-2026.onrender.com |
