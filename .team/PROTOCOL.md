# Claw 团队运转协议 v3.0

## 团队成员（实时运行中）

| 角色 | Agent ID | 职责 |
|------|----------|------|
| 总指挥 | main（WorkBuddy AI） | 接收任务、拆解、分配、部署、交付 |
| Backend-AI | backend | Node.js 后端开发、API、数据 |
| Frontend-AI | frontend | React/TypeScript 前端开发 |
| QA-AI | qa | 第一道审核（功能+报错+链接+样式+数据） |
| Final-AI | final-review | 第二道审核（安全+影响评估+最终签字） |

## 团队平台
- Team Name: `claw-team`
- 通信方式：send_message（异步消息）
- 状态管理：.team/shared/tasks/TASK-LIST.md

---

## 标准工作流程

```
用户发任务
    ↓
总指挥（main）拆解任务
    ↓
分配执行
    ├── 后端改动 → backend（写代码 → 自测 → Handoff → 通知QA）
    └── 前端改动 → frontend（写代码 → 自测 → Handoff → 通知QA）
          ↓
    QA-AI 第一道审核（5项检查清单）
    ├── 通过 → 发报告给 final-review
    └── 打回 → 发消息给 main → 打回给开发者
          ↓
    Final-AI 第二道复审（安全+影响）
    ├── 通过 → 通知 main 可以部署
    └── 打回 → 发消息给 main → 打回给开发者
          ↓
    总指挥部署 → 通知用户交付
```

---

## 各角色具体流程

### Backend-AI
1. 接收任务（main 发消息）
2. 阅读 .team/shared/tasks/TASK-LIST.md 了解任务阶段
3. 编写/修改代码
4. 本地验证（node 启动测试）
5. 写 Handoff 文件：`.team/shared/handoffs/TASK-YYYY-MM-DD-NNN-BACKEND-HANDOFF.md`
6. 发消息给 qa 通知审核
7. 发消息给 main 报告完成

### Frontend-AI
1. 接收任务（main 发消息）
2. 阅读 TASK-LIST.md
3. 编写/修改前端代码
4. 构建验证：`npm run build`，确认 complete-deploy/ 包含所有文件
5. 写 Handoff 文件：`.team/shared/handoffs/TASK-YYYY-MM-DD-NNN-FRONTEND-HANDOFF.md`
6. 发消息给 qa 通知审核
7. 发消息给 main 报告完成

### QA-AI
1. 接收 Handoff 通知（来自 backend/frontend）
2. 阅读 Handoff 了解变更内容
3. 针对变更进行审核（5项清单）
4. 写 QA 报告：`.team/shared/reviews/TASK-...-QA-REPORT.md`
5. 审核结果通知 main（抄送 final-review）

### Final-AI
1. 接收 QA 报告（来自 qa）
2. 独立复审（安全+影响+回归）
3. 写 Final 报告：`.team/shared/reviews/TASK-...-FINAL-REPORT.md`
4. 通过 → 发消息给 main 批准部署
5. 打回 → 发消息给 main 说明原因

---

## 审核清单

### QA 第一道（5项）
1. ✅ 功能验证：核心功能是否正常
2. ✅ 报错检查：控制台/网络无报错
3. ✅ 链接验证：按钮和链接可点击
4. ✅ 样式检查：布局无错位
5. ✅ 数据验证：数据流正常

### Final 第二道（安全+影响）
1. ✅ 安全：API 不暴露敏感信息、无注入风险
2. ✅ 权限：用户权限边界正确
3. ✅ 影响：不影响现有功能
4. ✅ 回归：变更不会引发其他故障

---

## 验收标准
- 所有审核通过（QA + Final）
- 无 P0/P1 级问题
- 部署后功能正常

## 禁止事项
- ❌ 不经 QA/Final 审核直接部署
- ❌ 跳过审核环节
- ❌ 瞒报问题
- ❌ 绕过流程直接修改生产代码

---

## 部署规范 v3.0（2026-05-04 生效）

> **重要：之前因部署流程不规范，已造成代码被覆盖、旧版本覆盖新版本、反复折腾一个多月。以下规则必须100%遵守。**

### 版本管理体系

项目根目录有 **VERSION.md**，记录每次部署的版本号、构建者、变更内容。

| 文件 | 作用 |
|------|------|
| `VERSION.md` | 版本记录本，查当前版本和历史 |
| `deploy.bat` | 一键部署脚本（pull → build → 验证 → 部署） |
| `complete-deploy/` | **唯一**构建输出目录（Vite 直接输出） |

**版本号格式**：`YYYY.MM.DD.NNN`（如 `2026.05.04.003`）

**查版本**：打开网站看左侧栏底部，或 `cat VERSION.md`

### 部署铁律（5 条，缺一不可）

1. **必须先 `git pull`** — 确保本地代码是最新的，否则会覆盖别人的更新
2. **必须重新 `vite build`** — 从源码构建，绝不能用旧的 `complete-deploy/` 文件
3. **必须验证 chunk hash** — `app.js` 引用的所有文件名必须存在于 `complete-deploy/assets/`
4. **必须更新 VERSION.md** — 版本号 +1，填写「构建者」和「变更内容」
5. **部署后必须 `git push`** — 让其他 AI 能拉到最新版本

### 一键部署（推荐）

```cmd
deploy.bat [构建者名称]
```

脚本自动完成全部 5 步，不需要手动操作。

### 手动部署步骤

```cmd
# 1. 拉最新代码
git pull gitee master

# 2. 清理 + 重新构建
cd frontend
npx vite build
cd ..

# 3. 验证 chunk hash
grep -oP "assets/[A-Za-z]+-[A-Za-z0-9_\-]+\.js" complete-deploy/assets/app.js | while read f; do
  if [ ! -f "complete-deploy/$f" ]; then echo "MISSING: $f"; fi
done

# 4. 更新版本号（编辑 VERSION.md，版本号 +1）

# 5. 部署
npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master

# 6. 提交
git add -A
git commit -m "deploy: [版本号] - [构建者] - [变更摘要]"
git push gitee master
```

### 严禁行为（发生过，绝对不要再犯）

| # | 禁止行为 | 后果 | 真实案例 |
|---|---------|------|---------|
| 1 | **用旧 `deploy-package/` 直接部署** | 旧代码覆盖新代码 | 4/25 旧版覆盖了 OZON 修复 |
| 2 | **不 pull 直接 push** | 覆盖别人的提交 | 多次发生 |
| 3 | **不重新构建就部署** | chunk hash 不匹配，全站白屏 | 五一期间白屏事故 |
| 4 | **修改源码后不构建不部署** | 线上代码和源码不一致 | — |
| 5 | **不更新 VERSION.md** | 无法追踪是谁部署的什么版本 | — |

### `deploy-package/` 已废弃

`deploy-package/` 是旧的构建脚本输出目录，**不要再使用**。唯一合法的构建输出是 `complete-deploy/`（Vite 直接输出）。

如果看到 `deploy-package/` 目录存在，说明有人用了旧流程，请删除并提醒。

### 构建输出目录说明

- `frontend/dist/` — Vite 中间输出（不要用）
- **`complete-deploy/`** — 最终部署目录（只用这个）✅
- ~~`deploy-package/`~~ — 已废弃，不要用 ❌

### AI 之间通信规范

当任何 AI 完成部署后，必须在团队消息中报告：
```
[部署通知] 版本 2026.05.04.005 已上线
构建者: [AI名称]
变更: [简要说明]
URL: https://xxx.claw-app-2026.pages.dev
```

其他 AI 收到通知后，下次操作前先 `git pull` 获取最新版本。

---

## 文件命名规范
- Handoff：`.team/shared/handoffs/TASK-YYYY-MM-DD-NNN-[BACKEND|FRONTEND]-HANDOFF.md`
- QA报告：`.team/shared/reviews/TASK-YYYY-MM-DD-NNN-QA-REPORT.md`
- Final报告：`.team/shared/reviews/TASK-YYYY-MM-DD-NNN-FINAL-REPORT.md`
- 任务清单：`.team/shared/tasks/TASK-LIST.md`

---

## 团队状态
- 创建时间：2026-04-20 20:40
- 协议版本：v3.0（2026-05-04 更新）
- 新增：部署规范 + 版本管理系统
- Team平台：claw-team（异步运行中）
- 成员：backend、frontend、qa、final-review（全部在线待命）

## 外部AI协作方
- 欧可乐（独立AI）— 广告采集模块、WhatsApp中继等
- 其他AI — 需遵守本协议部署规范
