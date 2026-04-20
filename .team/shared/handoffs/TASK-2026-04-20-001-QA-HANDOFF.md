# TASK-2026-04-20-001 QA 审核包
# 提交时间：2026-04-20 06:54
# 提交人：总指挥 WorkBuddy AI

---

## 修复内容摘要

### P0-1 ✅：auth.min.js 密码明文存储 → bcrypt 加密
**文件**：`src/routes/auth.min.js`

**改动**：
1. 新增导入：`import bcrypt from 'bcryptjs';`
2. 注册接口（`/register`）：注册时使用 `bcrypt.hash(password, 12)` 加密密码，存入 `hashedPassword` 字段
3. 登录接口（`/login`）：登录时用 `bcrypt.compare(password, hashedPassword)` 验证
4. 登录兼容逻辑：
   - 有 `hashedPassword` → bcrypt 验证
   - 有旧 `password`（明文）→ 直接比对（向后兼容）
   - 无密码字段 → 401
5. `syncUserToPostgres`：同步时也存入 `password` 字段

**关键代码片段**：
```javascript
// 注册时加密
const hashedPassword = await bcrypt.hash(password, 12);
// 存入用户对象
hashedPassword, // 加密后的密码

// 登录时验证
if (user.hashedPassword) {
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ success: false, error: '密码错误' });
} else if (user.password) {
  // 旧明文密码兼容
  if (user.password !== password) return res.status(401).json({ success: false, error: '密码错误' });
}
```

---

### P0-2 ✅：auth.js 中间件数据源 → 改用 dbService.js
**文件**：`src/middleware/auth.js`

**改动**：
```javascript
// 原来（错误）
import { findUserById, findUserByEmail, updateUser } from '../services/dataStore.js';
// 现在（正确）
import { findUserById, findUserByEmail, updateUser } from '../services/dbService.js';
```

**影响**：
- `authMiddleware` 现在从 PostgreSQL（dbService）读取用户，与 `auth.min.js` 注册时写入的数据源一致
- `loginProtectionMiddleware` 和 `recordLoginAttempt` 也使用同一数据源
- 解决了"登录后调用 /api/membership 等接口返回 401 用户不存在"的问题

---

### P2-1 ✅：package.json 添加 Playwright postinstall
**文件**：`package.json`

**改动**：
```json
"postinstall": "npx playwright install chromium --with-deps"
```

**影响**：Render 部署时自动安装 Chromium 浏览器，确保 TikTok/YouTube 自动化功能正常。

---

## 语法验证结果

| 文件 | 结果 |
|------|------|
| src/routes/auth.min.js | ✅ `node --check` 通过 |
| src/middleware/auth.js | ✅ `node --check` 通过 |
| package.json | ✅ JSON 格式正确 |

---

## 验收清单（QA 核查）

- [ ] 新用户注册 → `data/users.json` 中密码字段是 `$2a$12$...` 格式
- [ ] 新用户注册 → PostgreSQL `users` 表中 `password` 字段有值
- [ ] 用正确密码登录 → 返回 200 + token
- [ ] 用错误密码登录 → 返回 401 "密码错误"
- [ ] 注册后用 token 调用 `GET /api/membership` → 返回会员信息（非 401）
- [ ] 注册后用 token 调用 `GET /api/accounts` → 返回账号列表（非 401）
- [ ] 旧明文密码用户（无 hashedPassword）登录 → 仍能成功

---

## 改动文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| src/routes/auth.min.js | 修改 | 添加 bcrypt 加密，登录兼容旧密码 |
| src/middleware/auth.js | 修改 | 数据源从 dataStore.js 改为 dbService.js |
| package.json | 修改 | 添加 Playwright postinstall 脚本 |
| .team/shared/tasks/TASK-2026-04-20-001.md | 修改 | 更新任务记录和验收清单 |
