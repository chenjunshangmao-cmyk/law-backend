# TASK-2026-05-04-001 — XHS多客户Slot Pool 后端实现

## 任务信息
- **任务 ID**: TASK-2026-05-04-001
- **负责人**: Backend-AI
- **优先级**: P1
- **截止**: 尽快
- **Handoff 文件**: 本文件

## 背景

当前小红书桥接服务（`xhs-bridge-server.js`）只有1个MCP实例（端口18060），所有账号共享同一个Chrome浏览器。切换账号时必须登出再登入，无法支持多客户同时在线。

用户要求改造为5个客户可同时使用。

## 需求

修改 `xhs-bridge-server.js`，实现 **Slot Pool 多实例架构**。

### Slot 池设计

```
5 个固定 Slot，每个 = 1个MCP实例 + 1个独立Chrome:
Slot 0 → MCP :18060, Chrome user-data-dir #0
Slot 1 → MCP :18061, Chrome user-data-dir #1
...
Slot 4 → MCP :18064, Chrome user-data-dir #4
```

### 核心逻辑

1. 每个 Slot 有自己的 McpClient 实例
2. 当 accountId 首次请求登录 → 自动分配空闲 Slot
3. accountId → slotId 映射持久化到 `.xhs_slot_assignments.json`
4. 所有 API 端点先查 accountId → slotId，再路由到对应 McpClient
5. 登出时释放 Slot
6. 5个Slot全满 → 返回错误 `{ error: "所有席位已满（5/5），请稍后再试" }`
7. 新增 `GET /slots` 端点，返回所有 slot 状态

### 改动范围

**只需要修改一个文件**: `xhs-bridge-server.js`

关键改动点:
1. 常量定义: `SLOT_COUNT = 5`, `SLOT_PORTS = [18060, ..., 18064]`
2. 新增 `slotClients = Map<slotId, McpClient>` 替代单一 `McpClient`
3. 新增 `slotAssignments = Map<accountId, slotId>` (读写 `.xhs_slot_assignments.json`)
4. 新增 `freeSlots = Set<slotId>` 管理空闲槽位
5. 新增函数:
   - `assignSlot(accountId)` → 分配空闲 slot
   - `releaseSlot(accountId)` → 释放 slot
   - `getSlotClient(accountId)` → 获取对应 McpClient
   - `saveSlotAssignments()` / `loadSlotAssignments()` → 持久化
6. 所有现有端点 (`/login/qrcode`, `/login/status`, `/publish`, `/publish/video`, `/feeds`) 内部改为通过 `getSlotClient(accountId)` 获取正确的 MCP 实例
7. 新增 `GET /slots` 端点

### 数据流示例

```
POST /login/qrcode { accountId: "客户A" }
  → assignSlot("客户A") → Slot 0 空闲 → 分配 → mcps[0].callTool('get_login_qrcode')
  
POST /publish { accountId: "客户A", title: "..." }
  → getSlotClient("客户A") → Slot 0 → mcps[0].callTool('publish_content', ...)
  
POST /login/logout { accountId: "客户A" }
  → releaseSlot("客户A") → Slot 0 释放 → 回到空闲池
```

### 启动脚本

另外创建两个批处理文件（放在项目根目录）:
- `start-xhs-slots.bat` — 启动5个MCP实例
- `stop-xhs-slots.bat` — 停止所有MCP实例

```
# start-xhs-slots.bat 核心逻辑:
start "XHS-Slot0" xiaohongshu-mcp-windows-amd64.exe -port ":18060" -headless=false
start "XHS-Slot1" xiaohongshu-mcp-windows-amd64.exe -port ":18061" -headless=false
...
```

## 验收标准

- [ ] 当前在线版本的功能不受影响（向后兼容，accountId='default' 仍可用 Slot 0）
- [ ] 多个不同 accountId 可同时登录（各自独立 Chrome）
- [ ] Slot 满员时返回友好错误
- [ ] Slot 分配在桥接重启后恢复（读 `.xhs_slot_assignments.json`）
- [ ] `GET /slots` 返回正确的 slot 状态
- [ ] `GET /health` 显示 slot 数量

## 关键文件

- `xhs-bridge-server.js` — **唯一需要修改的源文件**（约500行，需要改为约700行）
- MCP 二进制: `C:\Users\Administrator\.local\bin\xiaohongshu-mcp-windows-amd64.exe`
- MCP 参数: `-port ":18060"`, `-headless=false`
- 参考: `小红书系统-完结报告-2026-05-04.md`（架构文档）

## 注意事项

1. MCP 的 rod 库自动为每个实例创建独立 temp user-data-dir，Cookie 天然隔离，不需要手动设置
2. `McpClient` 类不需要改，只改外层调用逻辑
3. 桥接服务本身只监听一个端口（8091），不需要多端口
4. 保持 CORS 配置不变
5. 代码风格保持和现有代码一致（纯 Node.js http 模块，零外部依赖）
