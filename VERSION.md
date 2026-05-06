# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.07.006** |
| 构建时间 | 2026-05-07 01:58 CST |
| 前端部署 | https://7b21936d.claw-app-2026.pages.dev |
| 主域名 | https://claw-app-2026.pages.dev (自动指向最新)

### 本次变更

**📦 订单管理优化 — 重新扫码 + 删除订单：**
1. **重新扫码** — 未支付订单可复用原支付二维码，无需重新下单
2. **删除订单** — 支持删除无用/扫错的待支付订单，清理堆积
3. **后端 API** — `GET /api/shouqianba/reopen/:sn` 和 `DELETE /api/shouqianba/order/:sn`

**详细变更：**
- 后端 shouqianba.db.js：新增 reopen + delete 路由（107行）
- 前端 OrdersPage.tsx：重新扫码按钮（QR弹窗）+ 删除按钮
- 前端 api.ts：新增 api.shouqianba.reopen() / deleteOrder()

---

## 版本历史

| 版本 | 时间 | 构建者 | 变更摘要 |
|------|------|--------|----------|
| 2026.05.07.006 | 01:58 | WorkBuddy | 订单管理优化：重新扫码+删除订单 |
| 2026.05.07.005 | 01:44 | WorkBuddy | YouTube授权+图文发布三项修复 |
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
