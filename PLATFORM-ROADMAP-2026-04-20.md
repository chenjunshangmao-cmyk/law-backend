# Claw 平台集成开发路线图
**制定时间**: 2026-04-20
**负责人**: WorkBuddy AI（总指挥）

---

## 🎯 总体目标

**每个平台实现完整闭环**：
> 账号登录 → 浏览器Session保存 → 发布产品/视频 → 上链接

---

## 📊 阶段划分

```
阶段1（最高优先级）: TikTok/YouTube登录修复
阶段2                : 发布产品 + 视频上传功能完善
阶段3                : 支付功能完成
阶段4                : 账号系统集成 + 完整工作流
阶段5（长期）        : 更多平台扩展
```

---

## 🏃 阶段1：TikTok/YouTube登录修复（P0紧急）

### 问题清单

| # | 问题 | 根因 | 优先级 |
|---|------|------|--------|
| 1 | 服务器环境浏览器无法打开（headless问题） | `headless: false` 在无显示器服务器上失败 | P0 |
| 2 | TikTok Seller URL 错误 | `seller.tiktok.com` → 应为 `seller-accounts.tiktok.com` | P0 |
| 3 | Session文件与账号系统未关联 | 只用email做文件名，多账号时冲突 | P1 |
| 4 | 防检测机制薄弱 | 缺少 timezone/language/canvas 等指纹 | P1 |
| 5 | YouTube Studio URL 可能过期 | `studio.youtube.com` 路径需验证 | P1 |
| 6 | Session过期后无重试机制 | 401后直接报错 | P2 |

### 修复计划

#### 1.1 修复 headless 模式（文件：`src/services/browserAutomation.js`）
```
headless: false  →  生产环境: true / 开发环境: false
新增：检测 NODE_ENV 自动切换
```

#### 1.2 修复 TikTok URL（文件：`browserAutomation.js`）
```
当前: this.loginUrl = 'https://seller.tiktok.com'
修复: 需测试以下URL哪个可用：
  - https://seller-accounts.tiktok.com
  - https://seller.tiktokglobalshop.com
  - https://affiliate.tiktok.com
```

#### 1.3 Session文件命名优化（防止多账号冲突）
```
当前: tiktok-{email}.json
修复: tiktok-{email}-{platformAccountId}.json
新增：账号ID关联字段
```

#### 1.4 防检测增强
```
新增 Stealth 插件：playwright-extra + stealth-extra
新增配置：
  - timezone: 'Asia/Shanghai'
  - locale: 'zh-CN'
  - permissions: ['geolocation']
  - viewport: { width: 1920, height: 1080 }  # 大屏更真实
  - extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
```

#### 1.5 Session过期重试
```
登录失败 → 检查session文件存在但过期
→ 提示用户重新登录 → 保存新session
```

---

## 🏃 阶段2：发布产品 + 视频上传完善

### 2.1 TikTok发布产品

**目标URL**（需实测确认）：
```
https://seller-accounts.tiktok.com/product/add
或
https://seller.tiktokglobalshop.com/product/add
```

**需更新的选择器**（需实际抓取页面元素）：
```
标题: input[name="title"], [data-testid="title"]
描述: textarea[name="description"]
价格: input[name="price"]
库存: input[name="stock"]
图片: input[type="file"][accept*="image"]
提交: button[type="submit"]
```

**发布后验证**：
```
- 检测"产品发布成功"提示
- 提取产品ID
- 保存发布结果到数据库
```

### 2.2 YouTube视频上传

**目标URL**：
```
https://studio.youtube.com/channel/upload
```

**需更新的选择器**：
```
文件: input[type="file"][accept*="video"]
标题: input[id="title"], input[name="title"]
描述: textarea[id="description"]
缩略图: input[data-testid="thumbnail-upload"]
隐私: input[type="radio"][value="public"]
发布: button:has-text("发布"), button:has-text("Publish")
```

---

## 🏃 阶段3：支付功能完成

### 当前状态
| 组件 | 状态 |
|------|------|
| 后端订单创建 | ✅ 完成 |
| 收钱吧SDK | ✅ 完成（测试终端） |
| Webhook回调 | ✅ 完成 |
| 前端支付页 | ❌ 缺失 |
| 真实终端 | ⚠️ 测试模式 |

### 阶段3任务

| # | 任务 | 优先级 |
|---|------|--------|
| 1 | 开发前端支付页面（选择套餐→扫码→结果页） | P0 |
| 2 | 配置收钱吧真实商户号/密钥 | P0（需用户提供） |
| 3 | 添加支付状态轮询（前端每3秒轮询） | P1 |
| 4 | Stripe国际支付（可选） | P3 |

---

## 🏃 阶段4：账号系统集成

### 当前账号系统
- API: `/api/accounts` - CRUD完成
- 支持平台: `['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee']`
- 缺陷: **浏览器Session未与账号数据库关联**

### 阶段4任务

```
账号管理页 → 添加平台账号
       ↓
浏览器自动化 → 用该账号的Session登录
       ↓
登录成功 → 保存Session到 accounts 表的 cookies 字段
       ↓
发布时 → 读取账号的Session → 自动登录 → 发布
```

### 完整工作流设计

```
用户操作                      系统行为
─────────────────────────────────────────────
1. 添加TikTok账号
   - 输入店铺名/登录信息
   - 调用 POST /api/browser/tiktok/login
   - 浏览器打开登录页
   - 用户手动登录
   - 登录成功 → 保存Session → 存入accounts表
                                  ↓
2. 发布产品
   - 选择已登录的TikTok账号
   - 填写产品信息
   - 点击发布
   - 系统读取Session → 自动打开TikTok
   - 填写表单 → 点击发布 → 记录结果
```

---

## 🏃 阶段5：更多平台扩展

| 平台 | 优先级 | 说明 |
|------|--------|------|
| OZON | P1 | 俄罗斯市场，已部分实现 |
| Amazon | P2 | 已支持账号管理，待实现浏览器自动化 |
| Shopee | P2 | 东南亚市场 |
| Lazada | P3 | 东南亚市场 |

---

## 📅 预计时间表

```
第1周（阶段1）: TikTok/YouTube登录修复
第2周（阶段2）: 发布功能完善
第3周（阶段3）: 支付功能完成
第4周（阶段4）: 账号系统集成
第5周+（阶段5）: 更多平台
```

---

## ⚠️ 关键风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| TikTok页面结构变化 | 选择器失效 | 每次发布前检查+更新 |
| 收钱吧接口变更 | 支付失败 | 留好日志 + 备选Stripe |
| Session过期 | 发布失败 | 自动检测+重新登录 |
| 平台反爬 | 账号封禁 | 控制频率+多账号轮换 |

---

## ✅ 开始标准

**阶段1完成状态**：
- [x] headless 自动检测 ✅（服务器=true，本地=false）
- [x] TikTok URL 修复 ✅（seller.tiktok.com → seller-accounts.tiktok.com/account/login）
- [x] 防检测增强 ✅（locale/timezone/viewport/随机UA）
- [x] Session 文件名多账号支持 ✅（accountId 参数）
- [x] Session 过期验证 ✅（validateSession 方法）
- [x] API 路由增强 ✅（/system-status、DELETE /session）
- [x] CLI 工具 ✅
- [x] OZON 自动化 ✅
- [ ] 提供真实 TikTok Seller 账号用于实测（待你提供）
- [ ] 测试环境验证（本地运行 + 服务器部署）
