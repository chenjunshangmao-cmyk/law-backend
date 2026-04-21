@echo off
echo ========================================
echo Claw 前端现代化UI安装脚本
echo ========================================
echo.

echo 1. 安装Tailwind CSS及相关依赖...
call npm install --save-dev tailwindcss@latest postcss@latest autoprefixer@latest
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装成功
echo.

echo 2. 初始化Tailwind配置...
if exist tailwind.config.js (
    echo ⚠️  tailwind.config.js已存在，跳过创建
) else (
    npx tailwindcss init -p
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Tailwind配置创建失败
        pause
        exit /b 1
    )
    echo ✅ Tailwind配置创建成功
)
echo.

echo 3. 检查配置文件...
if exist tailwind.config.js (
    echo ✅ tailwind.config.js 存在
) else (
    echo ❌ tailwind.config.js 不存在
    pause
    exit /b 1
)

if exist postcss.config.js (
    echo ✅ postcss.config.js 存在
) else (
    echo ❌ postcss.config.js 不存在
    pause
    exit /b 1
)

if exist src\index.css (
    echo ✅ src\index.css 存在
) else (
    echo ❌ src\index.css 不存在
    pause
    exit /b 1
)
echo.

echo 4. 启动开发服务器...
echo 请在新窗口中运行以下命令：
echo.
echo cd /d "%~dp0"
echo npm run dev
echo.
echo 或者直接访问：http://localhost:5173
echo.
echo ========================================
echo 安装完成！按任意键退出...
pause >nul