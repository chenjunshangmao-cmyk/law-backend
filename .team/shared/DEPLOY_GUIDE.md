# 🚀 Claw 部署完全指南 v3.0

> **写给所有 AI 团队成员：Backend-AI、Frontend-AI、QA-AI、Final-AI**
> 
> 每当你写完代码需要上线，必须按本文档执行。跳过任何一步都可能导致部署失败。
>
> 最后更新：2026-05-10 | 作者：WorkBuddy AI

---

## 📋 部署前必读：系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Claw 部署架构                      │
├──────────────┬──────────────────┬───────────────────┤
│   Gitee 主仓  │  GitHub law-backend │  Cloudflare Pages │
│  (代码仓库)   │  (Render 自动部署)  │  (前端手动部署)   │
├──────────────┼──────────────────┼───────────────────┤
│ push 触发     │ push 自动触发      │ wrangler 手动上传  │
│ 无自动部署    │ ✅ 后端自动部署    │ ⚠️ 必须手动执行    │
└──────────────┴──────────────────┴───────────────────┘
```

**关键认知：**
- 后端（Render）是 **Git 自动触发** — push 到 GitHub law-backend 就自动部署
- 前端（Cloudflare Pages）是 **手动上传** — 必须跑 `wrangler pages deploy`
- **只 push 代码 ≠ 前端部署完成！**

---

## ⚠️ Nova 部署失败案例分析（2026-05-10）

### 发生了什么
Nova 写好了外贸干货文章系统（commit `311a421`），只做了 `git push`：
- ✅ 后端 Render 自动部署成功（articles API 正常工作）
- ❌ 前端 Cloudflare 没部署（ArticlesPage 页面 404）

### 根因 #1：前端部署不是自动的
Cloudflare Pages 项目设置的是 **Direct Upload** 模式，没有绑定 Git。`git push` 只能触发 Render，不能触发 Cloudflare。

### 根因 #2：Wrangler 中文 commit 报错
```bash
# Nova 可能执行了：
npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master

# 结果报错：
X [ERROR] Invalid commit message, it must be a valid UTF-8 string. [code: 8000111]
```
**原因**：Git commit 包含中文时，Wrangler 在 Windows 上会触发 UTF-8 编码 bug。文件已上传但部署步骤失败。

### 修复方式
```bash
# 加 --commit-dirty=true 和英文 commit message
npx wrangler pages deploy complete-deploy \
  --project-name=claw-app-2026 \
  --branch=master \
  --commit-dirty=true \
  --commit-message="deploy: v2026.05.10.XXX - feature description"
```

---

## 🔧 标准部署流程（9 步）

### 方式一：一键脚本（推荐）
```bash
# Windows CMD 或 Git Bash
cd C:\Users\Administrator\WorkBuddy\Claw

# 传入构建者名称（必填！）
deploy.bat WorkBuddy
deploy.bat Frontend-AI
deploy.bat Backend-AI
```

deploy.bat 自动执行全部 9 步：
1. `git pull gitee master` — 拉取最新代码
2. CODELOCK 门禁检查 — 锁定文件被修改会中止
3. 清理旧 `complete-deploy/`
4. 检查 npm 依赖
5. `npx vite build` — 构建前端
6. chunk hash 验证 — 缺失文件会中止
7. 更新 VERSION.md 版本号
8. `wrangler pages deploy` — 部署到 Cloudflare
9. 烟雾测试 — 6 项自动检查

### 方式二：手动分步（出问题时用）

```bash
# Step 1: 拉代码
git pull gitee master

# Step 2: 门禁检查
node scripts/pre-deploy-check.js

# Step 3: 清理 + 构建
rm -rf complete-deploy
cd frontend && npx vite build && cd ..

# Step 4: 验证构建产物
ls complete-deploy/assets/app.js     # 必须存在
ls complete-deploy/assets/ArticlesPage-*.js   # 如果有文章系统

# Step 5: ⚠️ 关键！用英文 commit message
npx wrangler pages deploy complete-deploy \
  --project-name=claw-app-2026 \
  --branch=master \
  --commit-dirty=true \
  --commit-message="deploy: vYYYY.MM.DD.NNN by YOUR_NAME"

# Step 6: 烟雾测试
node scripts/smoke-test.js

# Step 7: 推送代码
git add -A
git commit -m "deploy: vYYYY.MM.DD.NNN - what changed"
git push gitee master
git push origin master    # 触发 Render 后端部署
```

---

## 🚨 常见陷阱与解决方案

| 陷阱 | 现象 | 解决 |
|------|------|------|
| **只 push 不 wrangler** | 后端更新了，前端没变 | 必须跑 `wrangler pages deploy` |
| **中文 commit 导致部署失败** | `Invalid commit message, it must be a valid UTF-8 string` | 加 `--commit-dirty=true --commit-message="英文"` |
| **用旧 complete-deploy/** | 部署了旧版本代码 | Step 3 必须 `rm -rf complete-deploy` |
| **忘了 git pull** | 部署覆盖别人的代码 | deploy.bat Step 1 自动 pull |
| **改了 backend/frontend/** | 改动不生效（那是旧副本） | 只改 `frontend/src/` |
| **git push --force** | 覆盖 Render 线上代码 | 绝对禁止！用普通 push |
| **忘了更新 VERSION.md** | 不知道线上跑哪个版本 | deploy.bat Step 7 自动更新 |
| **同时改前后端只部署一端** | 前端报 404 / 后端报错 | 检查：前端新页面是否存在？后端新路由是否注册？ |

---

## ✅ 部署后验证清单

部署完成后，**必须逐项验证**：

```bash
# 1. 前端健康
curl -s -o /dev/null -w "%{http_code}" https://claw-app-2026.pages.dev/
# 期望: 200

# 2. 后端健康
curl -s https://claw-backend-2026.onrender.com/health
# 期望: {"status":"healthy"...}

# 3. 新功能可用（示例：文章系统）
curl -s https://claw-backend-2026.onrender.com/api/articles/categories
# 期望: {"success":true,"data":[...6个分类...]}

# 4. 前端路由可达
curl -s -o /dev/null -w "%{http_code}" https://claw-app-2026.pages.dev/articles
# 期望: 200

# 5. 支付系统（如果涉及）
curl -s https://claw-backend-2026.onrender.com/api/heartbeat
# 期望: payment: "healthy"
```

### 验证列表速查
```
□ 前端首页 200
□ 后端 health 200
□ 新页面路径 200（不是 404）
□ 新 API 端点正常返回
□ 支付系统 health 正常
□ 已有功能未受影响（回归测试）
```

---

## 📊 本次部署记录（2026-05-10）

| 项目 | 内容 |
|------|------|
| 前端版本 | https://1a18cbb5.claw-app-2026.pages.dev |
| 主域名 | https://claw-app-2026.pages.dev（自动指向最新） |
| 后端 commit | 2c2c0fb |
| 变更内容 | 文章系统 AI 网关接入 + DeepSeek 密钥更新 + 批量生成脚本 v2.0 |
| 前端新页面 | ArticlesPage, ArticleDetailPage ✅ |
| 后端新路由 | /api/articles/* ✅ |

---

## 🔑 快速命令参考

```bash
# 构建前端
cd C:\Users\Administrator\WorkBuddy\Claw\frontend && npx vite build

# 部署前端（⚠️ 必须英文 commit message）
cd C:\Users\Administrator\WorkBuddy\Claw
npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master --commit-dirty=true --commit-message="deploy: VERSION by NAME"

# 一键部署（推荐）
deploy.bat YOUR_NAME

# 推送代码
git push gitee master && git push origin master

# 查看 Cloudflare 部署历史
npx wrangler pages deployment list --project-name=claw-app-2026

# 查看当前 Git 状态
git log --oneline -5 && git status --short
```

---

> **记住：部署不是 `git push` 就完事了。前端必须单独部署，中文 commit 会炸 wrangler。**
> 
> 有问题直接 @WorkBuddy。
