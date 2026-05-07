@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================
echo    Claw 一键部署脚本 v2.0
echo    铁律: pull → CODELOCK检查 → build → 验证 → 部署 → 烟雾测试
echo ================================================================
echo.

:: ============================================================
:: Step 0: 获取构建者名称（从参数或默认）
:: ============================================================
set BUILDER=%1
if "%BUILDER%"=="" set BUILDER=Unknown

:: ============================================================
:: Step 1: Git Pull 最新代码
:: ============================================================
echo [1/9] git pull — 拉取最新代码...
git pull gitee master 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  git pull 失败，可能有冲突，请手动解决！
    pause
    exit /b 1
)
echo ✅ 代码已是最新
echo.

:: ============================================================
:: Step 1.5: CODELOCK 部署前门禁检查
:: ============================================================
echo [2/9] CODELOCK 门禁检查 — 检测锁定文件是否被修改...
node scripts/pre-deploy-check.js
if %errorlevel% neq 0 (
    echo.
    echo ⛔ 部署中止！CODELOCK 锁定文件被修改。
    echo    如需强制部署: set FORCE_DEPLOY=模块名 ^&^& deploy.bat
    echo.
    pause
    exit /b 1
)
echo ✅ CODELOCK 门禁通过
echo.

:: ============================================================
:: Step 2: 清理旧构建产物
:: ============================================================
echo [3/9] 清理旧构建...
if exist "complete-deploy" (
    rd /s /q "complete-deploy" 2>nul
)
:: 废弃的 deploy-package，删除避免混淆
if exist "deploy-package" (
    echo ⚠️  检测到废弃的 deploy-package/ 目录，正在删除...
    rd /s /q "deploy-package" 2>nul
)
echo ✅ 清理完成
echo.

:: ============================================================
:: Step 3: 安装依赖（如果需要）
:: ============================================================
echo [4/9] 检查依赖...
cd frontend
if not exist "node_modules" (
    echo 📥 安装依赖...
    call npm install
)
cd ..
echo ✅ 依赖就绪
echo.

:: ============================================================
:: Step 4: 构建前端
:: ============================================================
echo [5/9] Vite 构建前端...
cd frontend
call npx vite build
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ 构建完成
echo.

:: ============================================================
:: Step 5: 验证构建产物（chunk hash 匹配检查）
:: ============================================================
echo [6/9] 验证构建产物...

if not exist "complete-deploy\assets\app.js" (
    echo ❌ complete-deploy/assets/app.js 不存在！
    pause
    exit /b 1
)

:: 检查 app.js 引用的 chunk 是否都存在
set MISSING=0
for /f "tokens=*" %%f in ('findstr /r "assets/[A-Za-z].*-[A-Za-z0-9_-]*\.js" complete-deploy\assets\app.js 2^>nul') do (
    for /f "tokens=2 delims=/" %%c in ("%%f") do (
        for /f "tokens=1 delims='" %%n in ("%%c") do (
            if not exist "complete-deploy\assets\%%n" (
                echo ❌ 缺失: %%n
                set MISSING=1
            )
        )
    )
)

if !MISSING!==1 (
    echo ❌ Chunk hash 不匹配！请重新构建
    pause
    exit /b 1
)
echo ✅ 所有 chunk 文件完整，hash 匹配
echo.

:: ============================================================
:: Step 6: 更新版本号
:: ============================================================
echo [7/9] 更新版本号...

:: 生成版本号 YYYY.MM.DD.NNN
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set DT=%%a
set VER_DATE=!DT:~0,4!.!DT:~4,2!.!DT:~6,2!
set VER_TIME=!DT:~8,2!:!DT:~10,2!

:: 读当前版本号，+1
set BUILD_NUM=1
if exist "VERSION.md" (
    for /f "tokens=*" %%l in (VERSION.md) do (
        echo %%l | findstr /r "版本号.*\*\*.*\*\*" >nul
        if !errorlevel!==0 (
            for /f "tokens=4 delims=." %%v in ("%%l") do (
                set /a PREV=%%v 2>nul
                if !PREV! gtr 0 set /a BUILD_NUM=!PREV!+1
            )
        )
    )
)

set VERSION=!VER_DATE!.00!BUILD_NUM!

:: 获取 Git 提交
for /f "tokens=*" %%g in ('git rev-parse --short HEAD 2^>nul') do set GIT_HASH=%%g
if "%GIT_HASH%"=="" set GIT_HASH=unknown

:: 生成新的 VERSION.md
echo # Claw 项目版本记录 > VERSION.md.tmp
echo. >> VERSION.md.tmp
echo ^> 铁律：部署前必须 git pull → 重新构建 → 更新版本号 → 部署 >> VERSION.md.tmp
echo ^> 禁止直接用旧文件部署！ >> VERSION.md.tmp
echo. >> VERSION.md.tmp
echo --- >> VERSION.md.tmp
echo. >> VERSION.md.tmp
echo ## 当前版本 >> VERSION.md.tmp
echo. >> VERSION.md.tmp
echo ^| 字段 ^| 值 ^| >> VERSION.md.tmp
echo ^|------^|-----^| >> VERSION.md.tmp
echo ^| 版本号 ^| **!VERSION!** ^| >> VERSION.md.tmp
echo ^| 构建时间 ^| !VER_DATE! !VER_TIME! CST ^| >> VERSION.md.tmp
echo ^| 构建者 ^| !BUILDER! ^| >> VERSION.md.tmp
echo ^| Git 提交 ^| !GIT_HASH! ^| >> VERSION.md.tmp
echo. >> VERSION.md.tmp

:: 保留旧的版本历史
type VERSION.md | findstr /v "当前版本\|构建时间\|构建者\|Git\|版本号\|铁律\|禁止\|字段\|-----" > VERSION.md.tail 2>nul
type VERSION.md.tail >> VERSION.md.tmp 2>nul
del VERSION.md.tail 2>nul

move /y VERSION.md.tmp VERSION.md >nul

echo ✅ 版本号: !VERSION!
echo.

:: ============================================================
:: Step 7: 部署到 Cloudflare Pages
:: ============================================================
echo [8/9] 部署到 Cloudflare Pages (生产版)...
call npx wrangler pages deploy complete-deploy --project-name=claw-app-2026 --branch=master

if %errorlevel% neq 0 (
    echo ❌ 部署失败！
    pause
    exit /b 1
)
echo.

:: ============================================================
:: Step 9: 部署后烟雾测试
:: ============================================================
echo [9/9] 烟雾测试 — 验证核心功能...
node scripts/smoke-test.js
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  烟雾测试未完全通过！请检查上方失败项。
    echo    部署已完成，但可能有功能异常。
    echo.
)

echo ================================================================
echo    🎉 部署完成！
echo    版本: !VERSION!
echo    构建者: !BUILDER!
echo    Git: !GIT_HASH!
echo ================================================================
echo.

:: ============================================================
:: 提醒提交 Git
:: ============================================================
echo 📋 请记得提交代码:
echo    git add -A
echo    git commit -m "deploy: !VERSION! - !BUILDER!"
echo    git push gitee master
echo.

endlocal
