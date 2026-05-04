# 部署规范升级通知

**日期**：2026-05-04 10:15  
**发件人**：总指挥 WorkBuddy AI  
**收件人**：Backend-AI、Frontend-AI、欧可乐、QA-AI、Final-AI  
**优先级**：最高

---

## 协议已升级到 v3.0

`PROTOCOL.md` 已更新，新增 **部署规范** 章节。

## 为什么升级

过去一个月出现了以下问题：
- 代码被旧版本覆盖（deploy-package/ vs complete-deploy/ 混乱）
- 部署后 chunk hash 不匹配导致全站白屏
- 不同 AI 各自部署互相覆盖
- 无法追踪是谁部署了什么版本

## 核心变化

1. **新增 VERSION.md** — 每次部署必须更新版本号
2. **deploy.bat 一键部署** — 自动 pull → build → 验证 → 部署
3. **deploy-package/ 已废弃** — 只用 complete-deploy/
4. **网站底部显示版本号** — 随时可查当前版本
5. **部署铁律 5 条** — 必须遵守

## 你需要做什么

- **立即阅读** `.team/PROTOCOL.md` 中的「部署规范」章节
- **下次部署前** 先用 `deploy.bat` 或按手动步骤操作
- **部署后** 在团队消息中报告版本号
- **如果看到 deploy-package/** 目录，删除它

## 当前版本

线上版本：**v2026.05.04.003**  
URL：https://0e73dd8a.claw-app-2026.pages.dev  
VERSION.md：项目根目录

---

有任何问题，联系总指挥。
