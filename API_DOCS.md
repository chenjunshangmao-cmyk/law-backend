# Claw外贸网站后端API文档

## 概述

Claw外贸网站后端API提供完整的电商自动化功能，包括用户认证、产品管理、AI生成、利润计算、浏览器自动化等。

**基础信息**
- API根路径: `http://localhost:8088/api`
- 健康检查: `GET /api/health`
- 文档版本: 1.0.0
- 开发环境: Node.js + Express

## 认证和授权

### JWT认证流程
1. 用户注册或登录获取JWT令牌
2. 在后续请求的Authorization头中携带令牌
3. 令牌格式: `Bearer {token}`
4. 令牌有效期: 7天（可设置记住我为30天）

### 错误码
- `AUTH_MISSING_TOKEN`: 未提供认证令牌
- `AUTH_INVALID_TOKEN`: 无效或已过期的令牌
- `AUTH_USER_NOT_FOUND`: 用户不存在
- `AUTH_ACCOUNT_SUSPENDED`: 账户已被限制
- `INVALID_CREDENTIALS`: 邮箱或密码错误
- `EMAIL_EXISTS`: 邮箱已被注册

## API端点

### 🔐 认证管理

#### 用户注册
```
POST /api/auth/register
```

**请求参数**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user",
      "plan": "free",
      "status": "active",
      "createdAt": "2026-04-11T07:45:00.000Z"
    },
    "token": "jwt-token",
    "tokenExpiresIn": "7d",
    "timestamp": "2026-04-11T07:45:00.000Z"
  }
}
```

#### 用户登录
```
POST /api/auth/login
```

**请求参数**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user",
      "plan": "free",
      "status": "active",
      "lastLoginTime": "2026-04-11T07:45:00.000Z"
    },
    "token": "jwt-token",
    "tokenExpiresIn": "7d",
    "timestamp": "2026-04-11T07:45:00.000Z"
  }
}
```

#### 用户登出
```
POST /api/auth/logout
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "message": "已成功登出",
  "timestamp": "2026-04-11T07:45:00.000Z"
}
```

#### 刷新令牌
```
POST /api/auth/refresh
```

**请求头**
```
Authorization: Bearer {old-token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      // 用户信息
    },
    "token": "new-jwt-token",
    "tokenExpiresIn": "7d",
    "timestamp": "2026-04-11T07:45:00.000Z"
  }
}
```

#### 获取用户信息
```
GET /api/auth/profile
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user",
      "plan": "free",
      "status": "active",
      "createdAt": "2026-04-11T07:45:00.000Z",
      "lastLoginTime": "2026-04-11T07:45:00.000Z",
      "statistics": {
        "quotaRemaining": {
          "text": 45,
          "image": 8,
          "products": 18
        },
        "accountAge": 5
      }
    },
    "timestamp": "2026-04-11T07:45:00.000Z"
  }
}
```

#### 获取用户额度
```
GET /api/auth/quota
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "quota": {
      "plan": "free",
      "limits": {
        "text": 50,
        "image": 10,
        "products": 20
      },
      "usage": {
        "text": 5,
        "image": 2,
        "products": 3
      },
      "remaining": {
        "text": 45,
        "image": 8,
        "products": 17
      },
      "usagePercentages": {
        "text": 10,
        "image": 20,
        "products": 15
      },
      "updatedAt": "2026-04-11T07:45:00.000Z"
    },
    "warnings": [],
    "timestamp": "2026-04-11T07:45:00.000Z"
  }
}
```

### 🛍️ 产品管理

#### 获取产品列表
```
GET /api/products
```

**请求头**
```
Authorization: Bearer {token}
```

**查询参数**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `status`: 状态过滤（draft, published, archived）
- `category`: 分类过滤

**响应**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product-uuid",
        "userId": "user-uuid",
        "name": "产品名称",
        "description": "产品描述",
        "cost": 15.5,
        "sourceUrl": "https://1688.com/item",
        "category": "clothing",
        "images": ["image1.jpg", "image2.jpg"],
        "status": "draft",
        "createdAt": "2026-04-11T07:45:00.000Z",
        "updatedAt": "2026-04-11T07:45:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### 获取单个产品
```
GET /api/products/{id}
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product-uuid",
      "userId": "user-uuid",
      "name": "产品名称",
      "description": "产品描述",
      "cost": 15.5,
      "sourceUrl": "https://1688.com/item",
      "category": "clothing",
      "images": ["image1.jpg", "image2.jpg"],
      "status": "draft",
      "createdAt": "2026-04-11T07:45:00.000Z",
      "updatedAt": "2026-04-11T07:45:00.000Z"
    }
  }
}
```

#### 创建产品
```
POST /api/products
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "name": "产品名称",
  "description": "产品描述",
  "cost": 15.5,
  "sourceUrl": "https://1688.com/item",
  "category": "clothing",
  "images": ["image1.jpg", "image2.jpg"]
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product-uuid",
      "userId": "user-uuid",
      "name": "产品名称",
      "description": "产品描述",
      "cost": 15.5,
      "sourceUrl": "https://1688.com/item",
      "category": "clothing",
      "images": ["image1.jpg", "image2.jpg"],
      "status": "draft",
      "createdAt": "2026-04-11T07:45:00.000Z",
      "updatedAt": "2026-04-11T07:45:00.000Z"
    }
  }
}
```

#### 更新产品
```
PUT /api/products/{id}
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "name": "更新后的产品名称",
  "description": "更新后的描述",
  "status": "published"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product-uuid",
      "userId": "user-uuid",
      "name": "更新后的产品名称",
      "description": "更新后的描述",
      "cost": 15.5,
      "sourceUrl": "https://1688.com/item",
      "category": "clothing",
      "images": ["image1.jpg", "image2.jpg"],
      "status": "published",
      "createdAt": "2026-04-11T07:45:00.000Z",
      "updatedAt": "2026-04-11T07:50:00.000Z"
    }
  }
}
```

#### 删除产品
```
DELETE /api/products/{id}
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "message": "产品已删除",
  "timestamp": "2026-04-11T07:50:00.000Z"
}
```

### 🤖 AI生成

#### 生成文案
```
POST /api/generate/text
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "productInfo": {
    "name": "产品名称",
    "description": "产品描述",
    "features": ["特点1", "特点2"],
    "targetMarket": "新加坡",
    "platform": "tiktok"
  },
  "tone": "专业",
  "language": "英文"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "generatedText": "生成的文案内容...",
    "platform": "tiktok",
    "language": "英文",
    "characterCount": 150,
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

#### 生成图片描述
```
POST /api/generate/image
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "style": "电商风格",
  "targetPlatform": "instagram",
  "hashtags": true
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "description": "图片描述内容...",
    "hashtags": ["#fashion", "#shopnow"],
    "platform": "instagram",
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

### 💰 利润计算

#### 计算利润
```
POST /api/calculate/profit
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "cost": 15.5,
  "shippingCost": 15,
  "platformFee": 0.1,
  "taxRate": 0.07,
  "exchangeRate": 5.2,
  "markup": 2.5
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "cost": 15.5,
    "shippingCost": 15,
    "totalCost": 30.5,
    "convertedCost": 158.6,
    "sellingPrice": 396.5,
    "recommendedPrice": 399.9,
    "profit": 241.4,
    "profitMargin": 0.61,
    "breakdown": {
      "platformFee": 39.65,
      "tax": 27.76,
      "netProfit": 241.4
    },
    "currency": "CNY",
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

#### 快速定价
```
POST /api/calculate/quick
```

**请求头**
```
Authorization: Bearer {token}
```

**请求参数**
```json
{
  "cost": 15.5,
  "platform": "tiktok",
  "targetMargin": 0.5
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "cost": 15.5,
    "recommendedPrice": 399.9,
    "expectedMargin": 0.5,
    "estimatedProfit": 199.95,
    "platform": "tiktok",
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

### 👥 账号管理

#### 获取账号列表
```
GET /api/accounts
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account-uuid",
        "userId": "user-uuid",
        "platform": "tiktok",
        "username": "shop123",
        "email": "shop@example.com",
        "status": "active",
        "lastSync": "2026-04-11T07:45:00.000Z",
        "createdAt": "2026-04-11T07:45:00.000Z",
        "updatedAt": "2026-04-11T07:45:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### 测试账号连接
```
POST /api/accounts/{id}/test
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "platform": "tiktok",
    "message": "连接成功",
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

### 📝 任务管理

#### 获取任务列表
```
GET /api/tasks
```

**请求头**
```
Authorization: Bearer {token}
```

**查询参数**
- `status`: 状态过滤（pending, processing, completed, failed）
- `type`: 类型过滤（publish, generate, calculate）
- `page`: 页码
- `limit`: 每页数量

**响应**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "userId": "user-uuid",
        "type": "publish",
        "platform": "tiktok",
        "status": "completed",
        "progress": 100,
        "result": {
          "productId": "product-uuid",
          "publishedUrl": "https://tiktok.com/product"
        },
        "createdAt": "2026-04-11T07:45:00.000Z",
        "updatedAt": "2026-04-11T07:50:00.000Z",
        "completedAt": "2026-04-11T07:50:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### 👑 会员管理

#### 获取套餐列表
```
GET /api/membership/plans
```

**请求头**
```
Authorization: Bearer {token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "free",
        "name": "免费版",
        "price": 0,
        "features": {
          "textGenerations": 50,
          "imageGenerations": 10,
          "productsLimit": 20,
          "browserAutomation": false,
          "prioritySupport": false
        },
        "description": "适合个人用户试用"
      },
      {
        "id": "pro",
        "name": "专业版",
        "price": 299,
        "billingPeriod": "monthly",
        "features": {
          "textGenerations": 1000,
          "imageGenerations": 100,
          "productsLimit": 500,
          "browserAutomation": true,
          "prioritySupport": true
        },
        "description": "适合专业卖家"
      }
    ],
    "currentPlan": "free"
  }
}
```

### 🌐 浏览器自动化

#### TikTok登录
```
POST /api/browser/tiktok/login
```

**请求参数**
```json
{
  "email": "user@example.com"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "message": "请在新打开的浏览器中登录TikTok",
    "sessionSaved": true,
    "email": "user@example.com",
    "timestamp": "2026-04-11T07:50:00.000Z"
  }
}
```

#### TikTok发布产品
```
POST /api/browser/tiktok/publish
```

**请求参数**
```json
{
  "email": "user@example.com",
  "title": "产品标题",
  "description": "产品描述",
  "price": 399.9,
  "stock": 100,
  "images": ["image1.jpg", "image2.jpg"]
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "message": "产品发布成功",
    "platform": "tiktok",
    "productUrl": "https://tiktok.com/product/123",
    "publishedAt": "2026-04-11T07:55:00.000Z",
    "timestamp": "2026-04-11T07:55:00.000Z"
  }
}
```

#### YouTube上传视频
```
POST /api/browser/youtube/upload
```

**请求参数**
```json
{
  "email": "user@example.com",
  "videoPath": "/videos/promo.mp4",
  "title": "视频标题",
  "description": "视频描述",
  "thumbnail": "thumbnail.jpg",
  "category": "教育",
  "privacy": "public"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "message": "视频上传成功",
    "platform": "youtube",
    "videoId": "abc123",
    "videoUrl": "https://youtube.com/watch?v=abc123",
    "uploadedAt": "2026-04-11T07:55:00.000Z",
    "timestamp": "2026-04-11T07:55:00.000Z"
  }
}
```

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "timestamp": "2026-04-11T07:45:00.000Z",
  "path": "/api/auth/login"
}
```

### 常见错误码
- `VALIDATION_ERROR`: 请求参数验证失败
- `RATE_LIMIT_EXCEEDED`: 请求过于频繁
- `RESOURCE_NOT_FOUND`: 资源未找到
- `INSUFFICIENT_PERMISSIONS`: 权限不足
- `QUOTA_EXCEEDED`: 额度不足
- `EXTERNAL_SERVICE_ERROR`: 外部服务错误
- `DATABASE_ERROR`: 数据库错误
- `SERVER_ERROR`: 服务器内部错误

## 速率限制

- 全局限制: 每分钟100个请求
- 认证接口限制: 每分钟10个请求
- 浏览器自动化接口限制: 每分钟5个请求
- 响应头包含: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 安全特性

1. **JWT认证**: 安全的令牌认证机制
2. **速率限制**: 防止暴力攻击
3. **输入验证**: 所有输入都经过验证
4. **CORS保护**: 配置安全的跨域请求
5. **安全头**: 自动设置安全相关的HTTP头
6. **账户保护**: 登录尝试限制和账户锁定
7. **令牌吊销**: 支持令牌吊销机制

## 环境变量

```
PORT=8088
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
LOG_LEVEL=info
```

## 快速开始

1. 安装依赖: `npm install`
2. 启动开发服务器: `npm run dev`
3. 访问健康检查: `http://localhost:8088/api/health`
4. 使用API文档进行测试

## 测试

运行测试脚本:
```bash
node test-api.cjs
node test-new-apis.cjs
```

## 部署

1. 生产环境设置环境变量
2. 使用PM2或Docker进行部署
3. 配置反向代理（如Nginx）
4. 启用HTTPS
5. 配置监控和日志

## 更新日志

### v1.0.0 (2026-04-11)
- 初始版本发布
- 完整的API接口
- 增强的安全特性
- 详细的API文档