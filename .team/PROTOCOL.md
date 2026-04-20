# Claw 团队运转协议 v2.1

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

## 文件命名规范
- Handoff：`.team/shared/handoffs/TASK-YYYY-MM-DD-NNN-[BACKEND|FRONTEND]-HANDOFF.md`
- QA报告：`.team/shared/reviews/TASK-YYYY-MM-DD-NNN-QA-REPORT.md`
- Final报告：`.team/shared/reviews/TASK-YYYY-MM-DD-NNN-FINAL-REPORT.md`
- 任务清单：`.team/shared/tasks/TASK-LIST.md`

---

## 团队状态
- 创建时间：2026-04-20 20:40
- Team平台：claw-team（异步运行中）
- 成员：backend、frontend、qa、final-review（全部在线待命）
