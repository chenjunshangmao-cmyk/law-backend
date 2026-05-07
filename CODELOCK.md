# 🔒 CodeLock - 代码锁定清单

> **规则：以下文件/目录已被锁定，任何人（包括 AI）修改前必须征得使用者同意。**
> 
> 解锁方式：使用者明确说「解锁 XXX」或「XX 可以改了」即可解除。
> 加锁方式：使用者说「锁定 XX」或「XX 上锁」即可添加。

---

## 当前锁定

### 🔒 支付系统
| 文件 | 说明 | 锁定日期 |
|------|------|----------|
| `src/routes/shouqianba.db.js` | 收钱吧核心路由（创建订单/回调验签/查询状态） | 2026-05-07 |
| `src/config/shouqianba.js` | 收钱吧终端配置（vendorSn/terminalKey/terminalSn） | 2026-05-07 |
| `frontend/src/pages/MembershipPage.tsx` | 定价页面（PLANS 价格/支付按钮） | 2026-05-07 |
| `frontend/src/pages/ServicesPage.tsx` | 业务服务支付页面 | 2026-05-07 |
| `frontend/src/pages/PaymentResultPage.tsx` | 支付结果页 | 2026-05-07 |
| `frontend/src/pages/OrdersPage.tsx` | 订单管理页 | 2026-05-07 |
| `收钱吧支付系统验收报告.md` | 验收文档 | 2026-05-07 |

> ⛔ 以上文件修改前必须征得使用者同意。
> 系统已验收通过，支付链路稳定运行中。

### 🔒 部署保障系统
| 文件 | 说明 | 锁定日期 |
|------|------|----------|
| `scripts/pre-deploy-check.js` | CODELOCK 部署前门禁（锁定文件变更检测） | 2026-05-08 |
| `scripts/smoke-test.js` | 部署后烟雾测试（6项核心检查） | 2026-05-08 |
| `deploy.bat` | 一键部署脚本（v2.0 含门禁+烟雾测试） | 2026-05-08 |
| `src/routes/heartbeat.js` | 综合心跳监控端点 | 2026-05-08 |

### 🔒 WhatsApp 中继引流
| 文件 | 说明 | 锁定日期 |
|------|------|----------|
| `src/routes/whatsapp.js` | WhatsApp 中继后端（链接管理/跳转/数据持久化 PostgreSQL） | 2026-05-07 |
| `frontend/src/pages/WhatsAppPage.tsx` | WhatsApp 管理页面 | 2026-05-07 |

> ⛔ 以上文件修改前必须征得使用者同意。

---

## 锁定历史

| 日期 | 文件/目录 | 原因 | 锁定人 |
|------|----------|------|--------|
| - | - | - | - |

---

## 如何使用

### 加锁
告诉我：**「锁定 小红书页面」** 或 **「把支付模块锁住」**

### 解锁
告诉我：**「解锁 小红书」** 或 **「支付模块可以改了」**

### 查看锁定
问我：**「现在锁了哪些？」**

### 系统行为
- 锁定的文件：AI 修改前会⛔弹窗警告，必须等你确认
- 锁定的目录：整个目录下的文件都受保护
- 团队 AI（Backend/Frontend）：同样遵守此规则
