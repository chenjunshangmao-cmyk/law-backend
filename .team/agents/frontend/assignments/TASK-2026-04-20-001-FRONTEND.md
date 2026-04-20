# Frontend-AI 任务：TASK-2026-04-20-001 前端检查

## 任务概述
检查 Claw 外贸网站前端，确保登录注册、支付、会员页面正常工作。

## 工作目录
前端代码在：`C:\Users\Administrator\WorkBuddy\Claw\src\`（React/TypeScript）
已构建资源在：`C:\Users\Administrator\WorkBuddy\Claw\src\dist\`（静态资源，供部署）

**注意**：前端源码可能不在 `src/` 目录内，需搜索确认：
- 搜索 `src/components/`、`src/pages/`、`src/App.tsx` 等
- 如果没有源码，说明前端需要重新构建
- 已构建的 `src/dist/assets/` 是上一次构建的结果

## 检查任务

### 1. 登录/注册页面
**检查**:
- 找到登录/注册页面组件（可能在 `src/pages/` 或 `src/components/`）
- 确认调用 `/api/auth/login` 和 `/api/auth/register`
- 确认登录成功后 token 存入 `localStorage`
- 确认错误处理（网络错误、无效凭据）

### 2. 支付流程页面
**检查**:
- 找到支付相关页面（`/payment/`、`Membership.tsx` 等）
- 确认调用 `/api/payment/create` 创建订单
- 确认调用 `/api/payment/status/:orderNo` 查询状态
- 确认回调处理（支付成功/失败的页面跳转）

### 3. 会员功能页面
**检查**:
- 找到会员页面（`/membership/`、`Membership.tsx`）
- 确认调用 `/api/membership` 获取会员信息
- 确认调用 `/api/membership/plans` 获取套餐列表
- 确认调用 `/api/membership/upgrade` 或 `/api/membership/create` 发起支付

### 4. TikTok/YouTube 登录按钮
**检查**:
- 找到相关按钮/入口
- 确认调用 `/api/browser/tiktok/login` 和 `/api/browser/youtube/login`
- 确认前端需要传递 email 参数
- 确认登录状态检查接口 `/api/browser/tiktok/status` 和 `/api/browser/youtube/status`

### 5. API 基础配置
**检查**:
- 确认 `VITE_API_BASE_URL` 或类似的环境变量配置
- 确认前端调用的 API 地址（是否指向 `https://claw-backend-2026.onrender.com`）
- 确认前端构建后 `src/dist/` 中的资源文件是否正确引用 API

## 已知后端情况（供参考）
- 后端地址：`https://claw-backend-2026.onrender.com`
- 后端本地：`http://localhost:8089`
- API 前缀：`/api/`
- 支付路由：`/api/payment/*`（当前后端可能缺失，待 Backend-AI 修复）

## 发现问题时的处理
- 如果发现问题，直接修复
- 如果需要后端配合，在报告中说明
- 如果前端源码缺失，生成对应的页面组件

## 交付要求
1. 提供前端检查报告
2. 列出所有发现的问题（分 P0/P1/P2）
3. 如有修改，提交代码变更
4. 向 QA-AI 提交审核，附上 Handoff 文档

## 完成后
向 QA-AI 提交审核，附上 Handoff 文档。
