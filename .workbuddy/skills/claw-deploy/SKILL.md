---
name: claw-deploy
description: |
  Claw 项目部署铁律。每次部署前必须遵守。触发词：部署、deploy、构建、build、发布、push。
  **仅改 frontend/src/，禁止碰 backend/frontend/。**
  **禁止 git push --force。**
---

# Claw 部署铁律

> 2026-05-06 血的教训固化。违反任何一条 == 支付崩、功能丢、用户崩溃。

## 铁律（每次部署前口念三遍）

1. **永远先 `git pull`** — 确保本地是最新代码，不会覆盖别人的提交
2. **禁止 `git push --force`** — 除非天塌了，否则永远不用
3. **禁止 `git reset --hard <旧commit>`** — 会丢掉今天的新代码
4. **只改 `frontend/src/`** — 不碰 `backend/frontend/`（旧副本）
5. **禁止 `git rebase`** — 冲突宁愿手工解决
6. **构建前确认 `complete-deploy/` 是干净的** — 清空或用 `npx vite build` 覆盖

## 正确流程

```bash
# 1. 拉最新代码
cd C:\Users\Administrator\WorkBuddy\Claw
git pull

# 2. 只改需要的文件（仅 frontend/src/）
# 编辑器改代码...

# 3. 构建
cd frontend
npx vite build

# 4. 部署
cd ..
NO_PROXY="*" npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master

# 5. 提交推送（绝不 force）
git add -A
git commit -m "描述改动"
git push origin master
```

## 前端源码目录

- ✅ **工作目录**: `frontend/src/` — 这是真的
- ❌ **禁止碰**: `backend/frontend/src/` — 旧副本，碰了会部署旧代码

## 部署地址

- Cloudflare Pages 项目: `claw-app-2026`
- 分支: `master`
- 主域名: https://claw-app-2026.pages.dev
- 部署后自动获得预览 URL

## 后端部署

- GitHub: `origin` → `git@github.com:chenjunshangmao-cmyk/law-backend.git`
- Render 自动部署，每次 push 触发
- 后端入口: `src/index.db.js`
- 后端 API: https://claw-backend-2026.onrender.com

## 回滚

如果必须回滚，告诉用户去 Render/Cloudflare 后台手动回滚，不要在 Git 上操作。
