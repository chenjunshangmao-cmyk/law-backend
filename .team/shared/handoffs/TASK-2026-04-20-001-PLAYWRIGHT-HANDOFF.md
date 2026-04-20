# Handoff - Playwright Chromium 安装修复

## 任务信息
- **任务来源**: frontend 报 TikTok 登录报错
- **问题**: Render 服务器上 Playwright Chromium 未安装
- **Handoff ID**: TASK-2026-04-20-001
- **Backend-AI**: 已完成
- **时间**: 2026-04-20 21:30

## 修复内容

### 1. package.json
**文件**: `C:\Users\Administrator\WorkBuddy\Claw\package.json`
```json
// 修改前
"postinstall": "npx playwright install chromium --with-deps"

// 修改后
"postinstall": "npx playwright install chromium"
```
**原因**: `--with-deps` 需要安装系统依赖包（libnss3, libatk 等），Render Ubuntu 基础镜像可能缺失，导致 postinstall 退出码非零但 npm 仍继续。移除该参数，仅安装 Chromium 本身（不含系统依赖包）。

### 2. render.yaml
**文件**: `C:\Users\Administrator\WorkBuddy\Claw\render.yaml`
```yaml
# 修改前
buildCommand: npm install

# 修改后
buildCommand: npm install && npm run postinstall
```
**原因**: 显式执行 postinstall，确保 Chromium 安装不被 npm 其他行为干扰。

### 3. src/services/browserAutomation.js
**文件**: `C:\Users\Administrator\WorkBuddy\Claw\src\services\browserAutomation.js`
**修改**: 添加 `ensureBrowserInstalled()` 兜底函数
```javascript
import { execSync } from 'child_process'; // 新增导入

// 新增函数
let browserInstallChecked = false;

async function ensureBrowserInstalled() {
  if (browserInstallChecked) return;
  browserInstallChecked = true;
  try {
    const executablePath = chromium.executablePath();
    if (fs.existsSync(executablePath)) return;
  } catch (e) {}
  if (isServerEnvironment()) {
    console.log('[Browser] ⚠️ Chromium 未找到，正在自动安装...');
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      console.log('[Browser] ✅ Chromium 安装完成');
    } catch (err) {
      console.error('[Browser] ❌ Chromium 自动安装失败:', err.message);
    }
  }
}
```
**在以下方法开头调用**:
- `launchWithSession()`: `await ensureBrowserInstalled();`
- `openForManualLogin()`: `await ensureBrowserInstalled();`

**原因**: 兜底机制——如果 build 阶段 Chromium 安装失败，运行时首次启动时仍能自动补救，避免用户看到 "Executable doesn't exist" 报错。

### 4. browserAutomation.js（根目录 CLI 版本）
**文件**: `C:\Users\Administrator\WorkBuddy\Claw\browserAutomation.js`
**修改**: 同步上述第 3 项的所有改动（CLI 独立运行版本，保持一致）。

## 部署状态
- ✅ GitHub commit `fbf9a6b` 已推送
- 🔄 Render 自动部署中（预计 2-3 分钟）
- 待验证：部署完成后 TikTok 登录功能是否正常

## QA 检查清单
1. ✅ 修复方案覆盖了 build 时和运行时两个阶段
2. ✅ 未修改任何其他功能代码（认证、数据库、API 路由均未动）
3. ✅ 后端服务启动时 headless 为 true，Chromium 应以无头模式运行
4. ⬜ Render 构建日志中确认 `npx playwright install chromium` 执行成功（无报错）
5. ⬜ 调用 `/api/browser/tiktok/login` 接口确认 Chromium 能正常启动
6. ⬜ 调用 `/api/browser/system-status` 确认浏览器状态正常

## Git 信息
- 提交: `fbf9a6b` - fix: Playwright Chromium auto-install for Render deployment
- 推送: GitHub law-backend 仓库 → Render 自动触发
