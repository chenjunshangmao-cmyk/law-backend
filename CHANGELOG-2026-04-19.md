# Changelog - 2026-04-19 浏览器自动化修复批次

## v1.0.1 - 2026-04-19

### 🐛 Bug 修复

#### B1 - YouTube Session 保存 Bug（P0）
- **问题**：`YouTubeAutomation.openLoginPage()` 的 `disconnected` 事件处理器只检查 session 文件是否存在，从未主动调用 `context.storageState()` 保存 session，导致所有手动登录都返回"登录未完成"
- **修复**：在 `disconnected` 事件中主动调用 `await context.storageState({ path: sessionPath })`，并验证保存内容非空
- **文件**：`src/services/browserAutomation.js` 第 667-699 行

#### B2 - TikTok 产品发布 URL 错误（P0）
- **问题**：使用 `https://seller-accounts.tiktok.com/product/add`，该域名不正确
- **修复**：改为 `https://seller.tiktok.com/product/add`（与 dashboardUrl 一致）
- **文件**：`src/services/browserAutomation.js` 第 423 行

#### B2 - 代理配置不可配置（P0）
- **问题**：代理完全禁用且硬编码为 `127.0.0.1:6789`，无法在生产环境灵活配置
- **修复**：改为 `PLAYWRIGHT_PROXY_URL` 环境变量，null = 直连，有值 = 使用代理
- **文件**：`src/services/browserAutomation.js` 第 17-20 行，第 28-46 行

#### B3 - YouTube checkLogin 不区分 cookies/session（P1）
- **问题**：`hasSession` 时统一返回 `loginType: 'session'`，无法区分是手动登录还是 cookies 导入
- **修复**：读取 session 文件，检查 `cookies.length > 0` 则为 `'cookies'`，否则为 `'session'`
- **文件**：`src/services/browserAutomation.js` 第 1113-1131 行

#### B4 - Playwright 无 Stealth 防检测（P1）
- **问题**：未注入防检测脚本，TikTok/YouTube 可检测到 `navigator.webdriver = true`
- **修复**：在 `openForManualLogin()` 中通过 `context.on('page')` 注入 Stealth 脚本，覆盖 webdriver、plugins、languages、chrome 对象
- **文件**：`src/services/browserAutomation.js` 第 77-115 行

#### B5 - YouTube 上传 URL 不稳定（P1）
- **问题**：使用 `https://studio.youtube.com/channel/upload` 需要预先知道频道 ID
- **修复**：改为 `https://studio.youtube.com/upload`，系统会自动跳转到已登录账号的频道上传页
- **文件**：`src/services/browserAutomation.js` 第 885 行

### 🧪 新增测试

#### T6 - browser.test.js 测试脚本
- 覆盖 YouTube/TikTok 登录 Session 保存、Status 检查、浏览器关闭、环境配置
- 路径：`tests/browser.test.js`
- 运行：`node tests/browser.test.js`

### 📝 文档更新

- `TEAM.md` v1.1：更新 TikTok/YouTube 规范，更新任务列表
- `tests/browser.test.js`：新增自动化测试脚本

---

## 部署方式

```bash
# 本地测试（直连）
node tests/browser.test.js

# 本地测试（带代理，如需访问 TikTok）
PLAYWRIGHT_PROXY_URL=http://127.0.0.1:6789 node tests/browser.test.js

# 启动后端
npm start

# 推送 Git 触发 Render 自动部署
git add . && git commit -m "fix: 浏览器自动化7个Bug修复 + 测试脚本" && git push
```
