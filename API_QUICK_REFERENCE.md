# Claw API 快速参考

## 认证流程

### 1. 注册
```bash
curl -X POST http://localhost:8088/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "测试用户"
  }'
```

### 2. 登录（获取令牌）
```bash
curl -X POST http://localhost:8088/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. 使用令牌（后续所有请求）
```bash
curl -X GET http://localhost:8088/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 核心接口速查

### 产品管理
```bash
# 获取产品列表
curl -X GET http://localhost:8088/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建产品
curl -X POST http://localhost:8088/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试产品",
    "cost": 15.5
  }'

# 更新产品
curl -X PUT http://localhost:8088/api/products/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新名称",
    "status": "published"
  }'
```

### AI生成
```bash
# 生成文案
curl -X POST http://localhost:8088/api/generate/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productInfo": {
      "name": "产品名称",
      "platform": "tiktok"
    }
  }'
```

### 利润计算
```bash
# 计算利润
curl -X POST http://localhost:8088/api/calculate/profit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cost": 15.5,
    "shippingCost": 15
  }'
```

### 浏览器自动化
```bash
# TikTok登录
curl -X POST http://localhost:8088/api/browser/tiktok/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# TikTok发布产品
curl -X POST http://localhost:8088/api/browser/tiktok/publish \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "title": "产品标题",
    "price": 399.9
  }'
```

## 错误处理速查

### 常见错误响应
```json
// 400 - 验证错误
{
  "success": false,
  "error": "邮箱格式无效",
  "code": "VALIDATION_ERROR"
}

// 401 - 认证错误
{
  "success": false,
  "error": "无效或已过期的令牌",
  "code": "AUTH_INVALID_TOKEN"
}

// 403 - 权限错误
{
  "success": false,
  "error": "权限不足",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS"
}

// 404 - 资源不存在
{
  "success": false,
  "error": "产品不存在",
  "code": "RESOURCE_NOT_FOUND"
}

// 429 - 速率限制
{
  "success": false,
  "error": "请求过于频繁，请30秒后再试",
  "code": "RATE_LIMIT_EXCEEDED"
}

// 500 - 服务器错误
{
  "success": false,
  "error": "服务器内部错误",
  "code": "SERVER_ERROR"
}
```

### 调试技巧
1. **检查健康状态**: `GET /api/health`
2. **查看请求日志**: 服务器控制台输出详细日志
3. **验证令牌**: 使用JWT调试工具检查令牌内容
4. **检查速率限制**: 查看响应头中的X-RateLimit-*信息

## 环境配置

### 开发环境
```bash
# .env 文件
PORT=8088
NODE_ENV=development
JWT_SECRET=claw-secret-key-2026
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### 生产环境
```bash
# .env.production 文件
PORT=8088
NODE_ENV=production
JWT_SECRET=strong-production-secret-key
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 测试API
node test-api.cjs

# 测试新API
node test-new-apis.cjs

# 检查代码质量
node check-old-api.js
node check-src-dist.js
```

## 前端集成示例

### 使用fetch
```javascript
const API_BASE = 'http://localhost:8088/api';

// 登录函数
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  if (result.success) {
    localStorage.setItem('token', result.data.token);
    return result.data.user;
  } else {
    throw new Error(result.error);
  }
}

// 带认证的请求
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });
}

// 使用示例
async function getProducts() {
  const response = await fetchWithAuth('/products');
  return response.json();
}
```

### 使用axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8088/api'
});

// 请求拦截器（添加token）
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器（处理错误）
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 处理认证错误
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 使用示例
async function createProduct(productData) {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('创建产品失败:', error.response?.data?.error);
    throw error;
  }
}
```

## 监控和调试

### 健康检查
```bash
curl http://localhost:8088/api/health
```

### 查看服务器日志
```bash
# 查看实时日志
tail -f logs/server.log

# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log
```

### 性能监控
- **内存使用**: `GET /api/health` 包含内存信息
- **响应时间**: 查看请求日志中的duration字段
- **错误率**: 监控错误响应计数

## 常见问题排查

### Q1: 认证失败
**问题**: 总是收到401错误
**解决方案**:
1. 检查令牌是否过期（令牌有效期7天）
2. 确认Authorization头格式正确：`Bearer {token}`
3. 尝试刷新令牌或重新登录

### Q2: 速率限制
**问题**: 收到429错误
**解决方案**:
1. 降低请求频率
2. 实现请求队列
3. 检查响应头中的重试时间

### Q3: 跨域问题
**问题**: 前端无法访问API
**解决方案**:
1. 确认CORS配置正确
2. 开发环境设置 `CORS_ORIGIN=*`
3. 生产环境设置前端域名

### Q4: 服务器无响应
**问题**: API无法访问
**解决方案**:
1. 检查服务器是否运行：`netstat -ano | findstr 8088`
2. 查看服务器日志
3. 重启服务器：`node src/index.js`

## 安全建议

### 生产环境
1. **不要使用默认的JWT_SECRET**
2. **启用HTTPS**
3. **限制CORS来源**
4. **配置防火墙规则**
5. **定期轮换密钥**

### 开发环境
1. 使用环境变量管理密钥
2. 不要提交.env文件到版本控制
3. 使用不同的密钥用于开发和生产

## 紧急联系方式

- 技术支持: 通过内部聊天工具联系
- 紧急问题: 联系系统管理员
- 文档更新: 查看API_DOCS.md

---

**最后更新**: 2026-04-11  
**API版本**: 1.0.0  
**维护团队**: api-dev