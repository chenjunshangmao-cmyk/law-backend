# Claw 更新日志 2026-04-20

## Phase 1 完成：TikTok/YouTube 登录问题修复

### ✅ 完成的修复

#### 1. headless 模式自动检测 (P0)
**文件**: `src/services/browserAutomation.js`, `browserAutomation.js`

**修复内容**:
- 自动检测服务器 vs 本地环境
- 服务器环境自动使用 `headless: true`
- 本地开发自动使用 `headless: false`
- 可通过环境变量 `BROWSER_HEADLESS=true/false` 强制指定

**判断逻辑**:
```javascript
// 服务器检测优先级：
1. BROWSER_HEADLESS 环境变量
2. RENDER / NODE_ENV=production
3. Linux 无 DISPLAY
4. 其他 → 本地开发
```

#### 2. TikTok URL 修复 (P0)
**文件**: `src/services/browserAutomation.js`

**修复前**: `https://seller.tiktok.com`
**修复后**: `https://seller-accounts.tiktok.com/account/login`

新增发布页 URL: `https://seller-accounts.tiktok.com/product/add`

#### 3. 防检测增强 (P1)
**文件**: `src/services/browserAutomation.js`

新增 Stealth 配置：
```javascript
{
  viewport: { width: 1920, height: 1080 },  // 大屏更真实
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  permissions: ['geolocation'],
  userAgent: 随机化（3种）,
  extraHTTPHeaders: {
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,...'
  }
}
```

浏览器参数增强：
```javascript
'--disable-blink-features=AutomationControlled'  // 隐藏webdriver
'--disable-web-security'                        // 允许跨域
'--disable-features=IsolateOrigins,site-per-process'
'--single-process'                              // 服务器稳定性
```

#### 4. Session 文件名多账号支持 (P1)
**文件**: `src/services/browserAutomation.js`, `src/routes/browser.js`

**修复前**: `tiktok-user@example.com.json`
**修复后**: `tiktok-user@example.com-accountId.json`（可选 accountId）

支持 accountId 参数：
- body: `{ email, accountId }`
- query: `?email=&accountId=`
- header: `x-account-id`

#### 5. Session 过期验证 (P1)
**文件**: `src/services/browserAutomation.js`

新增 `validateSession()` 方法：
- 打开平台主页检测 URL
- 如果重定向到登录页 → 标记为 `session_expired`
- 自动提示用户重新登录

#### 6. API 路由增强 (P1)
**文件**: `src/routes/browser.js`

新增接口：
- `GET /api/browser/system-status` - 系统状态 + 所有 Session 列表
- `DELETE /api/browser/session` - 删除指定 Session

增强接口：
- 所有接口支持 `accountId` 参数
- 登录接口返回 `environment` 标记（server/local）
- 状态接口返回 `sessionValid` + 过期原因
- 完善错误提示和示例参数

#### 7. CLI 命令行工具
**文件**: `browserAutomation.js`（根目录）

独立运行版本，支持：
```bash
node browserAutomation.js system-status
node browserAutomation.js tiktok login user@example.com
node browserAutomation.js tiktok status user@example.com
node browserAutomation.js tiktok publish user@example.com "标题" 19.99
node browserAutomation.js youtube login user@example.com
node browserAutomation.js youtube upload user@example.com ./video.mp4 "标题"
```

#### 8. OZON 自动化完善
**文件**: `src/services/browserAutomation.js`, `src/routes/browser.js`

完整实现 OZON 登录和状态检查接口。

---

## 下一步

### Phase 2: 发布产品 + 视频上传完善
- [ ] 验证 TikTok 产品发布页面选择器
- [ ] 验证 YouTube 视频上传页面选择器
- [ ] 添加发布结果检测和数据库记录
- [ ] 视频上传进度追踪

### Phase 3: 支付功能
- [ ] 前端支付页面开发
- [ ] 配置真实收钱吧商户号
- [ ] 支付状态轮询

### Phase 4: 账号系统集成
- [ ] Session 与 accounts 表关联
- [ ] 完整登录 → 发布工作流
