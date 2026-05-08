# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.08.008** |
| 构建时间 | 2026-05-08 10:30 CST |
| 前端部署 | (待部署) |
| 主域名 | https://claw-app-2026.pages.dev (自动指向最新)

### 本次变更

**🔒 海外推流代理服务上线**
- 新增 ProxyPool.js — 代理池管理（节点池/订阅/智能路由）
- 新增 proxy-stream.js — 10+ API端点（套餐/区域/订单/订阅/配置）
- RTMPPusher.js — 支持SOCKS5代理推流（环境变量注入）
- LiveStreamEngine.js — 集成代理配置，开播时自动激活
- live-stream.js — start端点新增代理参数
- ProxyPanel.tsx — 前端代理面板（开关/自带代理/Claw代理购买）
- LiveStreamPage.tsx — 集成代理面板到直播控制台
- 数据库表: proxy_nodes / proxy_orders / proxy_usage_logs
- 4档套餐: 入门¥299 / 标准¥599 / 专业¥1,199 / 企业¥2,499
- 7个区域: 香港/台湾/新加坡/日本/美国/英国/德国

### 本次变更

**👤 AI主播形象选择系统**
- 4套形象: 小瑞(温柔女)/小青(活泼女)/小云(磁性男)/小王(专业男)
- 不同外观/配色/发型/配饰, VRMRenderer实时渲染切换
- 前端: 4宫格卡片选择器, 直播中可切换
- 之前路由和页面都建好了但忘了加导航入口
- 新增6个核心服务模块：
  - `LipSyncEngine.js` — 中文拼音→Viseme映射，唇形同步关键帧生成
  - `VRMRenderer.js` — 2D SVG数字人渲染器（降级模式，无需GPU）
  - `RTMPPusher.js` — FFmpeg RTMP推流引擎（支持8大平台）
  - `RealtimeChat.js` — WebSocket实时弹幕+AI自��回复
  - `LiveStreamEngine.js` — 直播总控（整合TTS/LipSync/VRM/RTMP/Chat）
- 新增API路由：`src/routes/live-stream.js`（10个端点）
- 新增前端页面：`LiveStreamPage.tsx` 直播控制面板
- 注册到 `index.db.js` 和 `App.tsx`
- 全部5个服务模块 + 路由 import 链验证通过（5/5）
- 前端构建通过，LiveStreamPage 10.42 kB



---

## 版本历史

| 版本 | 时间 | 构建者 | 变更摘要 |
|------|------|--------|----------|
| 2026.05.07.009 | 03:45 | WorkBuddy | 正式价格恢复¥199+回调验签验收通过 |
| 2026.05.07.008 | 03:35 | WorkBuddy | 收钱吧回调验签三阶段修复：MD5优先→RSA→IP信任 |
| 2026.05.07.007 | 02:14 | WorkBuddy | 我已支付按钮+WhatsApp数据持久化+订单过滤 |
| 2026.05.07.006 | 01:58 | WorkBuddy | 订单管理优化：重新扫码+删除订单 |
| 2026.05.07.005 | 01:44 | WorkBuddy | YouTube授权+图文发布三项修复 |
| 2026.05.04.005 | 12:50 | WorkBuddy | 收钱吧支付修复（终端切回+operator参数+密钥统一） |
| 2026.05.04.003 | 10:05 | WorkBuddy | 广告采集+AI内容+TikTok/WhatsApp+OZON修复整合+版本管理系统 |
| 2026.05.04.002 | 09:21 | WorkBuddy | OZON type_id类目选择器修复 + 1688反爬抓取 |
| 2026.05.04.001 | ~01:00 | WorkBuddy | 小红书系统完结（V1.4） |
| 2026.05.08.001 | 凌晨 | WorkBuddy | **三大核心系统上线**：AI文案工厂(小说/脚本/营销文案)、AI短视频工厂(文案生视频/图片生视频/短剧)、会员套餐v3重构(含短视频工厂) |
| 2026.04.27 | 下午 | WorkBuddy | 支付系统统一收钱吧 |
| 2026.04.25 | — | 欧可乐 | 广告采集模块初版 |
| 2026.04.20 | — | WorkBuddy | 浏览器自动化 Phase1 + 认证系统修复 |

---

## 部署规则（必须遵守）

1. **部署前 `git pull`** — 确保本地是最新代码
2. **必须重新构建** — `npm run build` 或 `npx vite build`，不能用旧的 complete-deploy/
3. **更新本文件** — 版本号 +1，填写变更内容
4. **检查构建产物** — app.js 引用的 chunk 文件名必须和目录中实际文件一致
5. **只用 complete-deploy/** — deploy-package/ 已废弃

## 查询版本

- 打开网站，看页面底部
- 或：`cat VERSION.md`
