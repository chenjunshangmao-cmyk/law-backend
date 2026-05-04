# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.04.003** |
| 构建时间 | 2026-05-04 10:05 CST |
| 构建者 | WorkBuddy AI |
| Git 提交 | da30677 |
| 前端地址 | https://34f2d961.claw-app-2026.pages.dev |
| 后端状态 | Render 自动部署中 |

### 本次变更

- OZON 发布：type_id 类目选择器 + 1688 反爬修复（Cookie jar + 浏览器头）
- 广告采集模块：AdCollectionPage
- AI 内容模块：AiContentPage
- TikTok 发布模块：TikTokPublishPage
- WhatsApp 中继模块：WhatsAppPage
- 客服引擎：更新联系信息 + 关键词匹配优化
- 修复：deploy-package/ 旧版本覆盖问题
- 新增：版本管理系统（本文件 + deploy.bat + 网站版本号）

---

## 版本历史

| 版本 | 时间 | 构建者 | 变更摘要 |
|------|------|--------|----------|
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
