@echo off
echo.
echo ========================================
echo   重启开发服务器
echo ========================================
echo.

echo 1. 停止现有的开发服务器...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 2. 重新生成 Prisma Client...
call npx prisma generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Prisma Client 生成成功！
    echo.
    echo 3. 启动开发服务器...
    echo 提示：按 Ctrl+C 可以停止服务器
    echo.
    call npm run dev
) else (
    echo.
    echo × Prisma Client 生成失败！
    echo 请检查错误信息并手动执行：npx prisma generate
    pause
    exit /b 1
)
