@echo off
REM 首页广场项目 - 本地开发启动脚本

echo.
echo ========================================
echo   首页广场 - 本地开发环境启动
echo ========================================
echo.

REM 检查 Node.js
echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js
    echo 请访问 https://nodejs.org 安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

REM 检查依赖
echo.
echo [2/4] 检查依赖...
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)
echo ✅ 依赖已安装

REM 检查环境变量
echo.
echo [3/4] 检查环境变量...
if not exist ".env" (
    if exist ".env.example" (
        echo ⚠️  .env 文件不存在，正在创建...
        copy .env.example .env >nul
        echo ✅ .env 文件已创建（请根据需要修改）
    ) else (
        echo ⚠️  .env.example 文件不存在
    )
) else (
    echo ✅ .env 文件已存在
)

REM 启动开发服务器
echo.
echo [4/4] 启动开发服务器...
echo.
echo ========================================
echo   ✅ 开发服务器启动中...
echo   📍 访问地址: http://localhost:3000
echo   ⏹️  停止服务: 按 Ctrl+C
echo ========================================
echo.

npm run dev

pause
