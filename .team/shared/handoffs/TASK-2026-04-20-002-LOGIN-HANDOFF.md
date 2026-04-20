# Handoff - 登录修复部署（紧急）

## 任务信息
- **Handoff ID**: TASK-2026-04-20-002
- **Backend-AI**: 完成
- **时间**: 2026-04-20 22:05

---

## 修复一：用户 chenjunshangmao@163.com 密码同步到 PostgreSQL ✅

**问题根因**：
- 用户存在于 `data/users.json`（bcrypt hash）
- 但 PG 中该用户密码与 JSON 不一致
- PG 查询仅返回 `admin@claw.com`，chenjunshangmao 用户密码未同步

**修复操作**（已执行，直接写 Render PostgreSQL）：
```
node fix-chen-user.js
```
- 结果：PG 用户密码已更新为与 JSON 一致
- PG 用户 ID：`29710902-ec00-4f6f-be6a-f9e9d6fb1cf7`

---

## 修复二：auth.min.js 登录逻辑修复 ✅

**问题根因**：
- 旧版 auth.min.js 有"自动注册"逻辑（用户不存在时自动创建）
- 改用 PG 优先后，这个自动注册未考虑 bcrypt 密码，导致密码验证永远失败

**修复内容**（commit `170d02c`）：
1. `findUserByEmailPG()` 优先从 PG 读取用户
2. PG 为空时降级到 JSON 文件
3. **移除错误自动注册**：用户不存在时直接返回 `401 { error: '用户不存在' }`
4. 登录响应增加 `role || 'user'` 默认值

**部署状态**：
- ✅ GitHub `170d02c` 已推送
- 🔄 Render 自动部署中（预计 2-3 分钟）

---

## 验证清单（QA）

### 登录修复验证
- [ ] 注册功能：新用户注册是否正常（JSON+PG 双写）
- [ ] 登录功能 chenjunshangmao@163.com：使用原密码能否登录
- [ ] 内置账号：admin@claw.com / user@claw.com 登录是否正常
- [ ] 错误处理：不存在用户是否返回 401 "用户不存在"（非自动注册）

### API 状态检查
- [ ] `GET /api/auth/test` 返回 200
- [ ] `GET /api/browser/system-status` 返回正常（Playwright 修复后）
- [ ] `POST /api/auth/login` + `POST /api/auth/register` 正常

---

## 文件变更
- `src/routes/auth.min.js` — 登录逻辑修复（+40/-20）
- `fix-chen-user.js`（新增）— PG 用户修复脚本

## Git
- commit `170d02c` - fix: auth.min.js - PG优先查询，移除错误自动注册逻辑
