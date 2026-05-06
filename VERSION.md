# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.06.002** |
| 构建时间 | 2026-05-06 22:50 CST |
| 构建者 | WorkBuddy AI |
| Git 提交 | 6026108 (前端) / 1e9b056 (后端) |
| 后端状态 | ✅ Render 自动部署中 (1e9b056) |

### 本次变更

**🐛 WhatsApp 创建链接500错误修复：**
- 根因：`POST /api/whatsapp/links` 中 `links` 变量在第127行 `.filter()` 前未赋值，导致 ReferenceError → 500
- 修复：将 `const links = readLinks()` 移到 filter 之前
- 前端：`getLinkUrl` 中的 `VITE_API_BASE` 也改为 `VITE_API_URL`

**✅ YouTube OAuth 按钮确认：**
- 前端 OAuth 授权按钮已在页面上，点击正常弹出 Google 授权窗口
- 后端 `/api/auth/youtube` 正常返回授权 URL

### v2026.05.06.002 变更

**🐛 CSP 拦截修复（WhatsApp 落地页 + YouTube OAuth 回调）：**
- 根因：全局 `securityHeaders` 中间件设置 `Content-Security-Policy: default-src 'self'`
- 影响1：WhatsApp `/go` 落地页内联 `<style>` 和 `<script>`（自动跳转）被拦截 → 页面裸奔、不跳转
- 影响2：YouTube OAuth 回调 `window.opener.postMessage()` 内联脚本被拦截 → 授权超时
- 修复：在 whatsapp.js 和 auth.youtube.js 的路由处理中覆盖 CSP，允许 `'unsafe-inline'`

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
