# Claw外贸网站后端API文档

## 基础信息

- **Base URL**: `http://localhost:8088/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证说明

除注册和登录接口外，其他API需要在请求头中携带JWT令牌：

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. 用户认证 API

### 1.1 用户注册

**POST** `/api/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "用户名"  // 可选
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "plan": "free",
      "createdAt": "2026-04-09T01:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.2 用户登录

**POST** `/api/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "plan": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.3 获取用户信息

**GET** `/api/auth/profile`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "plan": "free"
    }
  }
}
```

### 1.4 获取用户额度

**GET** `/api/auth/quota`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "quota": {
      "plan": "free",
      "textGenerations": 5,
      "textLimit": 50,
      "textRemaining": 45,
      "imageGenerations": 2,
      "imageLimit": 10,
      "imageRemaining": 8,
      "productsLimit": 20
    }
  }
}
```

---

## 2. 产品管理 API

### 2.1 获取产品列表

**GET** `/api/products`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "产品名称",
        "description": "产品描述",
        "cost": 25,
        "sourceUrl": "https://1688.com/...",
        "category": "children-clothing",
        "images": [],
        "status": "draft",
        "createdAt": "2026-04-09T01:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 2.2 创建产品

**POST** `/api/products`

**请求体**:
```json
{
  "name": "产品名称",
  "description": "产品描述",
  "cost": 25,
  "sourceUrl": "https://1688.com/product/123",
  "category": "children-clothing",
  "images": ["https://example.com/image1.jpg"]
}
```

### 2.3 更新产品

**PUT** `/api/products/:id`

**请求体**:
```json
{
  "name": "新名称",
  "description": "新描述",
  "cost": 30,
  "status": "published"
}
```

### 2.4 删除产品

**DELETE** `/api/products/:id`

---

## 3. AI生成 API

### 3.1 生成文案

**POST** `/api/generate/text`

**请求体**:
```json
{
  "productName": "Children's Summer Dress",
  "productDescription": "100% cotton, breathable, cute cartoon print",
  "platform": "tiktok",
  "style": "professional"
}
```

**platform可选值**: `tiktok`, `shopee`, `ozon`, `amazon`  
**style可选值**: `professional`, `casual`, `luxury`, `youth`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "text": {
      "title": "Premium Children's Summer Dress - Soft Cotton",
      "description": "This adorable children's summer dress...",
      "features": [
        "100% organic cotton material",
        "Breathable and comfortable"
      ],
      "keywords": ["children dress", "summer outfit"]
    },
    "usage": {
      "type": "text",
      "generated": true
    }
  }
}
```

### 3.2 生成图片描述

**POST** `/api/generate/image`

**请求体**:
```json
{
  "productName": "Children's Summer Dress",
  "productDescription": "100% cotton, breathable",
  "style": "professional"
}
```

---

## 4. 利润计算 API

### 4.1 计算多平台利润

**POST** `/api/calculate/profit`

**请求体**:
```json
{
  "cost": 25,
  "platforms": ["tiktok", "shopee", "ozon"],
  "targetMargin": 50
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "costCNY": 25,
    "targetMargin": "50%",
    "platforms": {
      "tiktok": {
        "platform": "TikTok Shop",
        "priceCNY": 98.45,
        "priceLocal": 18.93,
        "currency": "$",
        "margin": "50.12%",
        "profit": {
          "cny": 49.32,
          "local": 9.48
        }
      }
    }
  }
}
```

### 4.2 快速定价

**POST** `/api/calculate/quick`

**请求体**:
```json
{
  "cost": 25,
  "platform": "tiktok",
  "targetProfit": 15
}
```

### 4.3 获取支持的平台

**GET** `/api/calculate/platforms`

---

## 额度说明

| 套餐 | 文案生成 | 图片生成 | 产品数量 |
|------|----------|----------|----------|
| 免费版 | 50次 | 10次 | 20个 |
| 付费版 | 500次 | 100次 | 无限 |

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/认证失败 |
| 403 | 权限不足/额度用完 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 5. 账号管理 API

### 5.1 获取账号列表

**GET** `/api/accounts`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "id_xxx",
      "platform": "1688",
      "name": "我的1688账号",
      "apiKey": "***7890",
      "status": "active",
      "lastSync": null,
      "createdAt": 1775675627084
    }
  ]
}
```

### 5.2 添加平台账号

**POST** `/api/accounts`

**请求体**:
```json
{
  "platform": "1688",
  "name": "我的账号名称",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret"
}
```

**支持的平台**: `1688`, `amazon`, `tiktok`, `ozon`, `lazada`, `shopee`

### 5.3 更新账号

**PUT** `/api/accounts/:id`

**请求体**:
```json
{
  "name": "新名称",
  "status": "active"
}
```

### 5.4 删除账号

**DELETE** `/api/accounts/:id`

### 5.5 测试账号连接

**POST** `/api/accounts/:id/test`

---

## 6. 任务管理 API

### 6.1 获取任务列表

**GET** `/api/tasks`

**查询参数**:
- `status`: `pending`, `running`, `completed`, `failed`
- `type`: `select`, `generate`, `publish`, `full`
- `limit`: 每页数量 (默认50)
- `offset`: 偏移量

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

### 6.2 创建任务

**POST** `/api/tasks`

**请求体**:
```json
{
  "type": "select",
  "params": {
    "keyword": "儿童连衣裙",
    "maxResults": 10
  },
  "autoStart": true
}
```

**任务类型**:
- `select`: 选品任务
- `generate`: 文案生成任务
- `publish`: 发布任务
- `full`: 完整流程

### 6.3 更新任务状态

**PUT** `/api/tasks/:id`

**请求体**:
```json
{
  "status": "running"
}
```

### 6.4 删除任务

**DELETE** `/api/tasks/:id`

### 6.5 获取任务执行日志

**GET** `/api/tasks/:id/logs`

### 6.6 停止运行中的任务

**POST** `/api/tasks/:id/stop`

---

## 7. 会员管理 API

### 7.1 获取会员信息

**GET** `/api/membership`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "xxx",
    "plan": "free",
    "planName": "免费版",
    "quotas": {
      "dailyGenerate": 5,
      "totalProducts": 20,
      "aiCallsPerDay": 20,
      "automationTasks": 2
    },
    "used": {
      "dailyGenerate": 0,
      "totalProducts": 5,
      "aiCallsToday": 10,
      "activeTasks": 1
    }
  }
}
```

### 7.2 获取可用套餐

**GET** `/api/membership/plans`

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "plan": "free", "name": "免费版", "quotas": {...} },
    { "plan": "basic", "name": "基础版", "quotas": {...} },
    { "plan": "premium", "name": "高级版", "quotas": {...} },
    { "plan": "enterprise", "name": "企业版", "quotas": {...} }
  ]
}
```

### 7.3 获取额度详情

**GET** `/api/quota`

### 7.4 消费额度

**POST** `/api/quota/consume`

**请求体**:
```json
{
  "type": "dailyGenerate",
  "amount": 1
}
```

### 7.5 释放额度

**POST** `/api/quota/release`

### 7.6 重置额度

**POST** `/api/quota/reset`

### 7.7 升级套餐

**POST** `/api/membership/upgrade`

**请求体**:
```json
{
  "plan": "basic"
}
```

---

## 套餐说明

| 套餐 | 每日生成 | 产品上限 | AI调用/日 | 自动化任务 |
|------|----------|----------|-----------|------------|
| free (免费版) | 5 | 20 | 20 | 2 |
| basic (基础版) | 50 | 200 | 200 | 20 |
| premium (高级版) | 200 | 1000 | 1000 | 100 |
| enterprise (企业版) | 无限制 | 无限制 | 无限制 | 无限制 |
