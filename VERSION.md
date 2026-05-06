# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.07.001** |
| 构建时间 | 2026-05-07 00:08 CST |
| 构建者 | WorkBuddy AI |
| Git 提交 | e607322 (前端) / 5ea1471 (后端) |
| 后端状态 | ✅ Render 自动部署中 (5ea1471) |
| 前端部署 | https://c91bff4f.claw-app-2026.pages.dev |
| 主域名 | https://claw-app-2026.pages.dev (自动指向最新)

### 本次变更

**🔧 YouTube 授权 + 图文发布 三项修复：**
1. **YouTubePage 上传下拉框修复** — 合并 OAuth 授权账号 + 浏览器账号，上传时自动路由到对应方式
2. **店铺账号页修复** — AccountsPage 加载时同步查询 youtube_authorizations 表，OAuth 账号正常显示
3. **YouTube 图文发布（Community Post）** — 新增浏览器自动化发布社区帖子（标题+正文+图片）

**详细变更：**
- 前端 YouTubePage.tsx：上传下拉框分组显示（OAuth + 浏览器），OAuth 账号走 YouTube Data API 直传
- 前端 AccountsPage.tsx：loadAccounts() 增加 api.browser.youtube.listAccounts()，自动合并 OAuth 账号
- 前端 api.ts：新增 api.youtube.* (Data API) + api.browser.youtube.post (图文)
- 后端 browser.js：新增 POST /api/browser/youtube/post 路由
- 后端 browserAutomation.js：YouTubeAutomation 新增 postToCommunity() 方法

---

## 版本历史

| 版本 | 时间 | 构建者 | 变更摘要 |
|------|------|--------|----------|
| 2026.05.04.005 | 12:50 | WorkBuddy | 收钱吧支付修复（终端切回+operator参数+密钥统一） |
| 2026.05.04.003 | 10:05 | WorkBuddy | 广告采集+AI内容+TikTok/WhatsApp+OZON修复整合+版本管理系统 |
| 2026.05.04.002 | 09:21 | WorkBuddy | OZON type_id类目选择器修复 + 1688反爬抓取 |
| 2026.05.04.001 | ~01:00 | WorkBuddy | 小红书系统完结（V1.4） |
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
