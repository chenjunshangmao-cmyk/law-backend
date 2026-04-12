# Claw 后端数据库文档

## 概述

Claw 后端使用 **SQLite** 数据库，通过 **Sequelize ORM** 进行数据操作。

- **数据库类型**: SQLite (文件型数据库，无需单独安装)
- **ORM**: Sequelize v6
- **数据库文件**: `./data/claw.db`

## 数据模型

### 1. 用户表 (Users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | STRING | 邮箱，唯一 |
| password | STRING | 加密密码 |
| name | STRING | 用户名称 |
| avatar | STRING | 头像URL |
| plan | ENUM | 套餐: free/basic/pro/enterprise |
| status | ENUM | 状态: active/inactive/suspended |
| lastLoginAt | DATE | 最后登录时间 |

### 2. 产品表 (Products)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属用户ID |
| name | STRING | 产品名称 |
| description | TEXT | 产品描述 |
| cost | DECIMAL | 成本价 |
| price | DECIMAL | 售价 |
| currency | STRING | 货币代码 |
| sourceUrl | STRING | 1688货源链接 |
| category | STRING | 分类 |
| images | JSON | 图片URL数组 |
| platformData | JSON | 各平台发布数据 |
| status | ENUM | 状态: draft/published/archived |
| tags | JSON | 标签数组 |
| aiGenerated | BOOLEAN | 是否AI生成 |
| generatedContent | JSON | AI生成内容 |

### 3. 任务表 (Tasks)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属用户ID |
| type | ENUM | 类型: select/generate/publish/full |
| status | ENUM | 状态: pending/running/completed/failed/cancelled |
| params | JSON | 任务参数 |
| result | JSON | 执行结果 |
| logs | JSON | 执行日志 |
| progress | INTEGER | 进度 (0-100) |
| startedAt | DATE | 开始时间 |
| completedAt | DATE | 完成时间 |
| errorMessage | TEXT | 错误信息 |
| productId | UUID | 关联产品ID |

### 4. 账号表 (Accounts)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属用户ID |
| platform | ENUM | 平台: tiktok/youtube/ozon/taobao/pdd |
| name | STRING | 账号名称 |
| username | STRING | 登录用户名 |
| credentials | JSON | 加密凭证 |
| cookies | TEXT | 浏览器cookies |
| settings | JSON | 平台设置 |
| status | ENUM | 状态: active/inactive/expired/error |
| lastUsedAt | DATE | 最后使用时间 |
| expiresAt | DATE | Cookie过期时间 |

### 5. 额度表 (Quotas)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属用户ID，唯一 |
| plan | ENUM | 套餐类型 |
| textGenerations | INTEGER | 已使用文案生成次数 |
| textLimit | INTEGER | 文案生成上限 |
| imageGenerations | INTEGER | 已使用图片生成次数 |
| imageLimit | INTEGER | 图片生成上限 |
| productsLimit | INTEGER | 产品数量限制 |
| productsCount | INTEGER | 当前产品数量 |
| tasksLimit | INTEGER | 任务执行上限 |
| tasksCount | INTEGER | 已执行任务数 |
| resetDate | DATE | 下次重置日期 |

## 启动方式

### 使用数据库版本（推荐）

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start

# 测试数据库
npm run test:db
```

### 使用旧版 JSON 存储

```bash
npm run start:legacy
```

## API 端点

所有 API 端点保持不变，与之前 JSON 存储版本兼容：

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 用户注册 |
| /api/auth/login | POST | 用户登录 |
| /api/auth/profile | GET | 获取用户信息 |
| /api/auth/quota | GET | 获取用户额度 |
| /api/products | GET/POST | 产品列表/创建 |
| /api/products/:id | GET/PUT/DELETE | 产品详情/更新/删除 |
| /api/tasks | GET/POST | 任务列表/创建 |
| /api/tasks/:id | GET/PUT/DELETE | 任务详情/更新/删除 |
| /api/accounts | GET/POST | 账号列表/创建 |
| /api/accounts/:id | GET/PUT/DELETE | 账号详情/更新/删除 |

## 数据库服务函数

所有 CRUD 操作封装在 `src/services/dbService.js` 中：

### 用户操作
- `findUserByEmail(email)` - 根据邮箱查找用户
- `findUserById(id)` - 根据ID查找用户
- `createUser(userData)` - 创建用户（自动创建额度）
- `updateUser(id, updates)` - 更新用户
- `updateLastLogin(id)` - 更新最后登录时间

### 产品操作
- `getProductsByUser(userId, options)` - 获取用户产品列表
- `getProductById(id)` - 获取产品详情
- `createProduct(productData)` - 创建产品
- `updateProduct(id, updates)` - 更新产品
- `deleteProduct(id)` - 删除产品
- `countUserProducts(userId)` - 统计用户产品数

### 任务操作
- `getTasks(options)` - 获取任务列表
- `getTasksByUser(userId, options)` - 获取用户任务
- `getTaskById(id)` - 获取任务详情
- `createTask(taskData)` - 创建任务
- `updateTask(id, updates)` - 更新任务
- `deleteTask(id)` - 删除任务

### 账号操作
- `getAccounts(options)` - 获取账号列表
- `getAccountsByUser(userId)` - 获取用户账号
- `getAccountById(id)` - 获取账号详情
- `createAccount(accountData)` - 创建账号
- `updateAccount(id, updates)` - 更新账号
- `deleteAccount(id)` - 删除账号

### 额度操作
- `getQuotaByUserId(userId)` - 获取用户额度
- `updateQuota(userId, updates)` - 更新额度
- `incrementUsage(userId, type)` - 增加使用量
- `checkQuota(userId, type)` - 检查额度

## 数据迁移

如需从旧版 JSON 数据迁移到数据库，可使用以下脚本：

```javascript
// 迁移示例
import { readData } from './src/services/dataStore.js';
import { createUser, createProduct, createTask } from './src/services/dbService.js';

const migrateData = async () => {
  // 读取旧数据
  const users = readData('users');
  const products = readData('products');
  const tasks = readData('tasks');
  
  // 迁移到数据库...
};
```

## 注意事项

1. **数据库文件**: SQLite 数据库文件存储在 `./data/claw.db`，请确保该目录有写入权限
2. **备份**: 定期备份 `data/claw.db` 文件
3. **并发**: SQLite 适合中小型应用，高并发场景建议升级到 PostgreSQL
4. **迁移**: 如需迁移到 PostgreSQL，只需修改 `src/config/database.js` 中的配置
