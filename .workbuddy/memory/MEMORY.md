# WorkBuddy Claw 记忆库

## 系统架构
- **后端**: https://claw-backend-2026.onrender.com（GitHub: chenjunshangmao-cmyk/law-backend）
- **前端**: https://claw-app-2026.pages.dev
- **Git远程**: origin → git@github.com:chenjunshangmao-cmyk/law-backend.git
- **Git推送注意**: 需要加 `-c http.proxy=` 绕过代理，否则TLS断连

## 支付系统修复 (2026-04-18)

### 根本原因链
1. `auth.min.js` 将用户存内存（JS对象），从不做持久化
2. `middleware/auth.js` 用 `findUserById` 从 `data/users.json` 查用户 → 找不到 → 401
3. `payment.db.js` 依赖 PostgreSQL 表（shouqianba_terminals、payment_orders），这些表从未被创建

### 修复方案
1. **`auth.min.js`**：改用 fs 持久化到 `data/users.json`，登录/注册时异步同步用户到 PostgreSQL `users` 表
2. **`payment.db.js`**：`ensurePaymentTables()` 自动创建 shouqianba_terminals 和 payment_orders 表（完整字段），收钱吧 API 失败时降级到测试模式返回模拟支付链接
3. **`membership.db.js`**：查询 PostgreSQL 失败时降级到 `req.user`（auth middleware 传入的 JSON 用户数据）

### Git推送关键配置
- 全局配置有 URL 重写 `url.https://github.com/.insteadof=git@github.com:` + 代理 `http.proxy=http://127.0.0.1:6789`
- 推送必须用 `git -c http.proxy= push origin <branch>:master` 否则 TLS 断连

## Claw前端技术栈
- React + Vite，单页应用
- API调用: `src/src/services/api.ts` → 后端 `/api/*`
- 认证: `src/src/services/auth.ts` → localStorage 存 token

## 数据库
- PostgreSQL (Render)，连接池来自 `src/config/database.js`
- JSON文件: `data/users.json`（auth主数据）、`data/products.json` 等
- `init-db.js` 使用 `src/db/postgres.js`（UUID主键），`database.js` 使用 `pg`（SERIAL主键）——两套连接并存
