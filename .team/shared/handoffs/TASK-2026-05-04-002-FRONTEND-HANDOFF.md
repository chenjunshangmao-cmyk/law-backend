# TASK-2026-05-04-002 — XHS多客户Slot Pool 前端实现

## 任务信息
- **任务 ID**: TASK-2026-05-04-002
- **负责人**: Frontend-AI
- **优先级**: P1
- **截止**: 尽快
- **Handoff 文件**: 本文件
- **依赖**: 等待 Backend-AI 完成后端改动后才能联调（但可以先写好UI）

## 背景

小红书桥接服务正在从单实例改造为5客户并发 Slot Pool。前端需要相应更新以支持多 slot 显示。

参考后端 Handoff：`TASK-2026-05-04-001-BACKEND-HANDOFF.md`

## 需求

### 1. 修改 `XiaohongshuPage.tsx`

**新增功能**:
- 登录/发布时传递 accountId 参数给桥接 API（当前可能用默认值，需要显式传递）
- 显示当前账号占用的 Slot 编号（从 `GET /slots` 获取）
- 满员时（桥接返回错误）显示友好提示：**"所有席位已满（5/5），请稍后再试"**

**改动点**:
- 页面顶部或状态栏加一行: `当前 Slot: #0` 或 `当前 Slot: 空闲`
- 扫码登录时调用 `GET /slots` 检查可用 slot
- 如果 `/login/qrcode` 返回 error（满员），用 toast 提示

### 2. 修改 `AccountsPage.tsx`

**新增功能**:
- 在小红书账号卡片上显示占用的 Slot 编号
- 调用 `GET /slots` API 获取所有 slot 状态
- 显示格式: `Slot #0 · 已登录` 或 `Slot: 未分配`

**改动点**: 
- 加载账号列表时，额外调用 `GET http://localhost:8091/slots` 
- 匹配 accountId → slotId
- 在账号卡片上显示

### 3. API 客户端新增

在 `frontend/src/services/xhsMcpApi.ts` 中新增:
```typescript
async getSlots(): Promise<SlotInfo[]> {
  const res = await fetch(`${BRIDGE_URL}/slots`);
  return (await res.json()).data;
}
```

`SlotInfo` 类型:
```typescript
interface SlotInfo {
  id: number;
  port: number;
  status: 'free' | 'occupied';
  accountId: string | null;
}
```

## UI 参考

### XiaohongshuPage 状态栏
```
┌──────────────────────────────────────┐
│  📕 小红书发布管理    Slot #1 · 客户A  │
│  [已登录] [登出]                      │
└──────────────────────────────────────┘
```

### AccountsPage 账号卡片
```
┌─────────────────────┐
│ 📕 客户A             │
│ 小红书              │
│ Slot #1 · 已登录     │  ← 新增
│ [发布管理] [删除]    │
└─────────────────────┘
```

## 验收标准

- [ ] 小红书管理页显示当前账号的 Slot 编号
- [ ] 店铺账号页显示各账号的 Slot 状态
- [ ] 满员时前端有友好提示（不报 500 错误）
- [ ] 不影响现有登录/发布流程
- [ ] TypeScript 类型完整，无 any
- [ ] 构建通过: `npx vite build`

## 关键文件

- `frontend/src/pages/XiaohongshuPage.tsx` — 主要修改
- `frontend/src/pages/AccountsPage.tsx` — 小改动
- `frontend/src/services/xhsMcpApi.ts` — 新增 API 方法
- 桥接地址: `http://localhost:8091`

## 注意事项

1. 桥接 API 返回格式: `{ success: true, data: [...] }` 或 `{ success: false, error: "..." }`
2. 因为 Backend-AI 可能还没完成，前端可以先用 mock 数据开发，接口格式对齐即可
3. 不要引入新依赖
4. 保持代码风格和现有页面一致
