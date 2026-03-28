# PowerShell 脚本 - 重启开发服务器

Write-Host "🔄 正在重启开发服务器..." -ForegroundColor Cyan
Write-Host ""

# 停止所有 node 进程（开发服务器）
Write-Host "1️⃣ 停止现有的开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 重新生成 Prisma Client
Write-Host "2️⃣ 重新生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client 生成成功！" -ForegroundColor Green
    Write-Host ""
    
    # 启动开发服务器
    Write-Host "3️⃣ 启动开发服务器..." -ForegroundColor Yellow
    Write-Host "📝 提示：按 Ctrl+C 可以停止服务器" -ForegroundColor Gray
    Write-Host ""
    npm run dev
} else {
    Write-Host "❌ Prisma Client 生成失败！" -ForegroundColor Red
    Write-Host "请检查错误信息并手动执行：npx prisma generate" -ForegroundColor Red
    exit 1
}
