# Claw 后端部署指南

## 部署到 Render（免费版）

### 1. 准备工作

确保以下文件已准备好：
- `package.json` - 依赖配置
- `src/index.db.js` - 入口文件
- `render.yaml` - Render部署配置

### 2. 创建 Render 账号

1. 访问 https://render.com
2. 使用 GitHub 账号登录
3. 完成邮箱验证

### 3. 创建 PostgreSQL 数据库

1. 在 Render Dashboard 点击 "New +"
2. 选择 "PostgreSQL"
3. 配置：
   - Name: `claw-db`
   - Plan: Free
   - Region: Singapore (离你最近)
4. 点击 "Create Database"
5. 等待数据库创建完成，复制 `Internal Database URL`

### 4. 部署 Web Service

#### 方式一：通过 Blueprint（推荐）

1. 将代码推送到 GitHub
2. 在 Render Dashboard 点击 "New +" → "Blueprint"
3. 选择你的 GitHub 仓库
4. Render 会自动读取 `render.yaml` 配置
5. 点击 "Apply"

#### 方式二：手动创建

1. 在 Render Dashboard 点击 "New +" → "Web Service"
2. 选择你的 GitHub 仓库
3. 配置：
   - Name: `claw-backend` (如果已被占用，用 `claw-backend-2026`)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
4. 添加环境变量：
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: （从数据库复制Internal URL）
   - `JWT_SECRET`: （随机字符串，用于JWT签名）
   - `ALLOWED_ORIGINS`: `https://your-frontend.onrender.com`
5. 点击 "Create Web Service"

### 5. 配置环境变量

在 Render Dashboard → Web Service → Environment 中添加：

```
# 必需
DATABASE_URL=postgresql://claw_db_user:xxx@xxx.render.com:5432/claw_db
JWT_SECRET=your-random-secret-key-here

# AI API Keys（可选，用于AI功能）
BAILIAN_API_KEY=sk-xxx
HUNYUAN_API_KEY=xxx

# 前端域名（用于CORS）
ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:5173
```

### 6. 初始化数据库

部署完成后，执行数据库初始化：

```bash
# 在本地连接到Render数据库并执行初始化
psql $DATABASE_URL -f init-db.js
```

或在 Render Shell 中运行：
```bash
npm run init-db
```

### 7. 验证部署

访问健康检查接口：
```
https://claw-backend-xxx.onrender.com/api/health
```

预期返回：
```json
{
  "status": "healthy",
  "timestamp": "2026-04-16Txx:xx:xx.xxxZ",
  "version": "1.0.0",
  "database": "connected"
}
```

### 8. 更新前端 API 地址

在前端 `.env` 文件中：
```
VITE_API_URL=https://claw-backend-xxx.onrender.com
```

## 免费版限制

- **Web Service**: 15分钟无请求会休眠，首次请求需10-30秒唤醒
- **Database**: 90天无活动会暂停，数据保留
- **带宽**: 100GB/月
- **构建**: 每次git push自动部署

## 常见问题

### 1. 部署失败
检查 Render Dashboard → Logs 查看错误信息

### 2. 数据库连接失败
- 确认 DATABASE_URL 格式正确
- 确认数据库和Web Service在同一Region

### 3. CORS 错误
- 更新 ALLOWED_ORIGINS 包含前端域名
- 确保包含 `https://` 前缀

### 4. 休眠问题
- 免费版15分钟无请求会休眠
- 可以使用 UptimeRobot 定时ping保持唤醒

## 下一步

部署完成后，继续开发：
1. 平台账号管理API
2. 爆款选品功能
3. AI图片生成接口
