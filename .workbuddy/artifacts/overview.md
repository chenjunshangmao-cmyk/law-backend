# 会员系统彻底修复报告 — v2026.05.13.009

**时间**: 2026-05-13 09:07-09:55 CST  
**状态**: ✅ 已修复并验证

---

## 诚实回答：昨天为什么说"永远不会有问题"但问题还在？

| 环节 | 昨天做了 | 实际效果 |
|------|---------|---------|
| 代码开发 | ✅ database.js v3.2 + switchDatabase + set-db端点 | ✅ 已推送 |
| 本地PG | ✅ PostgreSQL 18 安装 + claw数据库 + 表结构 | ✅ 一直在运行 |
| **隧道守护进程** | ✅ 脚本开发完成 | ❌ **从未启动** — 这是问题的根因 |
| Render实际状态 | 以为已切换到PG | ❌ 一整晚都在JSON模式 |

**结论**: 昨天开发了完整的解决方案，但最后一步——启动pinggy隧道——没有执行。就像修好了路但忘了通车。

---

## 修复的3个致命bug

### Bug 1: `membership.db.js` plan字段永远读不到
```
修复前: const plan = user.plan || 'free';    ← PG存的是membership_type，读不到
修复后: const plan = user.membership_type || user.plan || 'free';
```
影响: admin在PG中是flagship，但API永远返回free

### Bug 2: `createUser` PG模式插入失败
```
修复前: INSERT INTO users (email, password, name, ...)  ← 缺少id列（NOT NULL）
修复后: INSERT INTO users (id, email, password, name, ...) + uuidv4()
```
影响: 新用户注册永远写不进PG，只存内存/JSON

### Bug 3: `auth.min.js` 有自己的死连接池
```
修复前: auth.min.js用独立的getPool() → 连接死掉的Render PG → 永远失败
修复后: auth.min.js改用database.js的smartPool → 隧道切换自动生效
```
影响: 这是最隐蔽的bug。switchDatabase切换了database.js的池，但auth.min.js完全不受影响

---

## 当前运行状态

| 组件 | 状态 | 说明 |
|------|------|------|
| Render后端 | 🟢 mode=pg | 通过隧道连接本地PG |
| 本地PostgreSQL | 🟢 运行中 | 端口5432，3个用户 |
| pinggy隧道 | 🟢 守护进程运行 | 60分钟自动续期 |
| admin@claw.com | 🟢 flagship旗舰版 | 全功能无限，永不过期 |
| 新用户注册 | 🟢 UUID写入PG | 已验证 permanent@claw.com |

---

## 管理员账号

- **邮箱**: admin@claw.com
- **密码**: admin123（请尽快在网站上修改）
- **会员**: flagship旗舰版（5888元/年，所有功能无限）
- **到期**: 2099-12-31（永久）

## 需要持续关注

1. **pinggy免费隧道60分钟过期** — 守护进程会自动续期，但本机不能关机
2. **Render每次部署会重启** — 守护进程会自动重新切换数据库
3. **如本机重启** — 需重新启动 `node scripts/pg-tunnel-daemon.cjs`
