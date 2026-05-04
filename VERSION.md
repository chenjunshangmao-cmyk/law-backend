# Claw 项目版本记录

> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署
> 禁止直接用 deploy-package/ 旧文件部署！

---

## 当前版本

| 字段 | 值 |
|------|-----|
| 版本号 | **2026.05.04.004** |
| 构建时间 | 2026-05-04 11:42 CST |
| 构建者 | WorkBuddy AI |
| Git 提交 | 971f62c (后端) / 本地 (前端) |
| 前端地址 | https://70af2ec0.claw-app-2026.pages.dev |
| 后端状态 | ✅ Render 已部署 (971f62c) |

### 本次变更

**前端修复：**
- 清除 `api.ts` 中硬编码的 `deviceId: 'claw-web-new3'`（已切换到 claw-web-new1）
- 前端不再指定 deviceId，由后端根据 config 决定

**后端增强：**
- 自动签到机制：服务启动时自动签到获取最新密钥
- getActiveTerminal 优先级调整：config > HARDCODE
- 收钱吧支付恢复正常 ✅

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
