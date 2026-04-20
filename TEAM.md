# Claw 网站开发团队规范

> 建立时间：2026-04-19
> 版本：v1.1（2026-04-19 Bug 修复批次更新）
> 负责人：WorkBuddy AI（架构师 + 全栈开发）

---

## 一、团队架构

```
Claw 网站开发团队
├── 👑 架构师 (WorkBuddy AI)
│   ├── 技术方案设计
│   ├── 代码审核（Code Review）
│   ├── 质量把关
│   └── 最终验收
├── 🔧 后端开发 (WorkBuddy AI)
│   ├── Node.js / Express API 开发
│   ├── 浏览器自动化 (Playwright)
│   ├── 数据库设计与优化
│   └── API 文档维护
├── 🎨 前端开发 (WorkBuddy AI)
│   ├── React 组件开发
│   ├── UI/UX 优化
│   └── 前端测试验收
├── 🧪 QA 测试工程师 (WorkBuddy AI)
│   ├── 自动化测试脚本编写
│   ├── API 接口测试
│   ├── 端到端测试
│   └── Bug 报告与追踪
└── 🚀 DevOps (WorkBuddy AI)
    ├── 前后端部署
    ├── CI/CD 流程
    ├── 监控与告警
    └── CHANGELOG 维护
```

---

## 二、质量门禁（一次就能跑的标准）

### 每次代码变更必须通过：

| 检查项 | 标准 | 责任方 |
|--------|------|--------|
| **语法检查** | `node --check` 无错误 | 后端开发 |
| **单元测试** | 核心函数有测试用例 | QA |
| **API 测试** | `curl` 或脚本验证响应 | QA |
| **前后端联调** | 接口返回格式一致 | 后端+前端 |
| **浏览器自动化** | 有降级/异常处理 | 后端开发 |
| **部署包** | 包含所有依赖和资源 | DevOps |
| **CHANGELOG** | 记录本次变更内容 | DevOps |

### 禁止出现：
- ❌ `TODO: ...` 未完成的占位符代码
- ❌ 硬编码的 URL/Token/密码
- ❌ 未 try-catch 的异步操作
- ❌ 没有错误提示的神秘 Bug
- ❌ 浏览器自动化无超时设置

---

## 三、开发工作流

### 任务认领 → 开发 → 自测 → 审核 → 部署

```
1️⃣ 任务认领
   ├── 架构师分配任务
   └── 明确需求、验收标准、截止时间

2️⃣ 技术方案（复杂任务）
   ├── 方案文档
   ├── 技术选型
   └── 风险评估

3️⃣ 编码实现
   ├── 按规范编码
   ├── 注释关键逻辑
   └── 错误处理完备

4️⃣ 自测验证
   ├── 本地运行测试
   ├── 边界条件测试
   └── 异常流程测试

5️⃣ 代码审核（架构师）
   ├── 逻辑正确性
   ├── 安全性检查
   └── 规范一致性

6️⃣ 部署上线
   ├── 更新 CHANGELOG
   ├── 生成部署包
   └── 验证线上功能
```

---

## 四、代码规范

### 文件命名
- 路由文件：`xxx.routes.js`
- 服务文件：`xxx.service.js`
- 测试文件：`xxx.test.js`
- 脚本文件：`xxx-script.js`

### 错误处理
```javascript
// ✅ 正确：所有异步操作必须 try-catch
async function myFunc() {
  try {
    const result = await someAsyncCall();
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    return { success: false, error: error.message };
  }
}

// ❌ 禁止：无错误处理的 async
async function myFunc() {
  return await someAsyncCall(); // 没有错误处理
}
```

### API 响应格式
```javascript
// 成功
{ success: true, data: {...}, message: "操作成功" }

// 失败
{ success: false, error: "错误原因", code: "ERROR_CODE" }
```

---

## 五、TikTok / YouTube 开发规范

### 浏览器自动化规范
1. **必须有超时设置**：`timeout: 60000`
2. **必须等待页面稳定**：`waitUntil: 'domcontentloaded'`
3. **必须有重试机制**：关键操作失败重试 2-3 次
4. **必须有降级方案**：浏览器方式失败时返回友好提示
5. **Session 保存必须验证**：保存后验证文件非空
6. **必须有 Stealth 模式**：注入防检测脚本（navigator.webdriver 等）
7. **代理必须可配置**：通过 `PLAYWRIGHT_PROXY_URL` 环境变量设置

### TikTok 规范
- 登录 URL：`https://seller.tiktok.com`
- 发布路径：`https://seller.tiktok.com/product/add`（2026-04-19 修正）
- 选择器要兼容多版本：同时准备 3 种以上选择器
- 国内访问需要代理：配置 `PLAYWRIGHT_PROXY_URL=http://127.0.0.1:6789`

### YouTube 规范
- 登录 URL：`https://studio.youtube.com`
- 上传路径：`https://studio.youtube.com/upload`（自动跳转到对应频道）
- **Session 登录**：YouTube openLoginPage 中必须主动调用 `context.storageState()` 保存 session
- 选择器要兼容多版本

---

## 六、部署规范

### 部署前检查清单
- [ ] `npm run build` 成功
- [ ] 所有 API 有测试脚本
- [ ] 环境变量已配置
- [ ] CHANGELOG 已更新
- [ ] 旧部署包备份

### 部署包结构
```
deploy-package/
├── backend/        # 后端源码（src/）
├── frontend/       # 前端构建产物（build/）
├── tests/          # 测试脚本
├── .env.example    # 环境变量模板
├── DEPLOY.md       # 部署说明
└── CHANGELOG.md    # 更新日志
```

---

## 七、当前任务列表

> 最后更新：2026-04-19（第二轮：账号系统 + OZON 实现批次）

### ✅ 已完成（2026-04-19 第二轮）

| 编号 | 内容 | 优先级 |
|------|------|--------|
| P1 | 新建 platformAccounts.js 集成 API（账号CRUD + 浏览器状态 + 仪表盘 + 一键登录） | P1 |
| P1 | 实现 OzonAutomation 类（俄罗斯 OZON 电商浏览器自动化） | P2 |
| P1 | 在 browser.js 中添加 OZON 全部 API 路由（login/status/publish/cookies/token） | P1 |
| P1 | 在 browserAutomation.js 基类添加 logout() 方法 | P1 |
| P1 | 增强 browser.test.js v2.0（加入 API 测试 + logout 测试） | P1 |
| P2 | 更新 TEAM.md + index.db.js 注册新路由 | P2 |

### ✅ 已完成（2026-04-19 第一轮）

| Bug ID | 修复内容 | 优先级 |
|--------|---------|--------|
| B1 | YouTube openLoginPage Session 保存 Bug（之前只检查存在不主动保存） | P0 |
| B2 | TikTok 产品发布 URL 修正（seller.tiktok.com 而非 seller-accounts.tiktok.com） | P0 |
| B2 | 代理配置可配置化（PLAYWRIGHT_PROXY_URL 环境变量） | P0 |
| B3 | YouTube checkLogin 添加 cookies 类型区分 | P1 |
| B4 | Playwright Stealth 防检测配置（navigator.webdriver 等） | P1 |
| B5 | YouTube 上传 URL 修正为 /upload（兼容自动频道跳转） | P1 |

### 🔄 进行中

| 任务 | 优先级 | 说明 |
|------|--------|------|
| TikTok 真实发布商品流程测试 | P0 | 需要真实 TikTok 账号验证完整流程 |
| YouTube 真实上传视频测试 | P0 | 需要真实 Google 账号验证上传流程 |
| 浏览器选择器适配验证 | P1 | TikTok/YouTube 随时可能改 UI，需要验证 |

### 📋 进行中 / 待认领

| 任务 | 优先级 | 说明 |
|------|--------|------|
| TikTok 真实账号验证 | P0 | 需要真实 TikTok 账号和代理配置 |
| YouTube 真实账号验证 | P0 | 需要真实 Google 账号 |
| 前端账号管理 UI | P1 | 前端为打包 React，需修改源码重新构建 |
| CI/CD 自动化部署 | P1 | Git push → 自动测试 → 自动部署 |
| 多浏览器并发支持 | P2 | 支持同时管理多个账号 |

### 新增 API 路由（2026-04-19）

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/platform-accounts` | GET | 获取账号+浏览器状态（统一视图） |
| `/api/platform-accounts/dashboard` | GET | 账号仪表盘（跨平台汇总） |
| `/api/platform-accounts/:id/login` | POST | 触发浏览器登录 |
| `/api/platform-accounts/:id/logout` | POST | 登出并清理 session |
| `/api/platform-accounts/:id/status` | GET | 查询实时登录状态 |
| `/api/browser/ozon/*` | ALL | OZON 浏览器自动化全套 API |

---

*本文档由 WorkBuddy AI 架构师维护，每次任务完成后更新。*
