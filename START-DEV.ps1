# 首页广场项目 - 本地开发启动脚本

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  首页广场 - 本地开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/4] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到 Node.js" -ForegroundColor Red
    Write-Host "请访问 https://nodejs.org 安装 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# 检查依赖
Write-Host ""
Write-Host "[2/4] 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host "✅ 依赖已安装" -ForegroundColor Green

# 检查环境变量
Write-Host ""
Write-Host "[3/4] 检查环境变量..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "⚠️  .env 文件不存在，正在创建..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env 文件已创建（请根据需要修改）" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.example 文件不存在" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env 文件已存在" -ForegroundColor Green
}

# 启动开发服务器
Write-Host ""
Write-Host "[4/4] 启动开发服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 开发服务器启动中..." -ForegroundColor Green
Write-Host "  📍 访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  ⏹️  停止服务: 按 Ctrl+C" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev

Read-Host "按 Enter 退出"
