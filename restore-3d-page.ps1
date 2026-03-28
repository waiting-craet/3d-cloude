# 3D知识图谱页面恢复脚本
# 用法: .\restore-3d-page.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3D知识图谱页面恢复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查恢复文件是否存在
$recoveredFiles = @(
    "components/KnowledgeGraph.tsx.recovered",
    "components/GraphNodes.tsx.recovered",
    "components/GraphEdges.tsx.recovered",
    "components/TopNavbar.tsx.recovered",
    "components/NodeDetailPanel.tsx.recovered",
    "components/WorkflowCanvas.tsx.recovered",
    "app/page.tsx.recovered"
)

$missingFiles = @()
foreach ($file in $recoveredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ 以下恢复文件不存在:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "请先运行以下命令来恢复文件:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "git show 31ba075:components/KnowledgeGraph.tsx > components/KnowledgeGraph.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:components/GraphNodes.tsx > components/GraphNodes.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:components/GraphEdges.tsx > components/GraphEdges.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:components/TopNavbar.tsx > components/TopNavbar.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:components/NodeDetailPanel.tsx > components/NodeDetailPanel.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:components/WorkflowCanvas.tsx > components/WorkflowCanvas.tsx.recovered" -ForegroundColor Gray
    Write-Host "git show 31ba075:app/page.tsx > app/page.tsx.recovered" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ 所有恢复文件已找到" -ForegroundColor Green
Write-Host ""

# 询问用户是否要备份当前文件
Write-Host "是否要备份当前文件？(Y/N)" -ForegroundColor Yellow
$backup = Read-Host

if ($backup -eq "Y" -or $backup -eq "y") {
    Write-Host ""
    Write-Host "正在备份当前文件..." -ForegroundColor Cyan
    
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Copy-Item "components/KnowledgeGraph.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "components/GraphNodes.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "components/GraphEdges.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "components/TopNavbar.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "components/NodeDetailPanel.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "components/WorkflowCanvas.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    Copy-Item "app/page.tsx" "$backupDir/" -ErrorAction SilentlyContinue
    
    Write-Host "✅ 备份已保存到: $backupDir" -ForegroundColor Green
    Write-Host ""
}

# 恢复文件
Write-Host "正在恢复3D知识图谱页面文件..." -ForegroundColor Cyan
Write-Host ""

$fileMappings = @(
    @{ source = "components/KnowledgeGraph.tsx.recovered"; dest = "components/KnowledgeGraph.tsx" },
    @{ source = "components/GraphNodes.tsx.recovered"; dest = "components/GraphNodes.tsx" },
    @{ source = "components/GraphEdges.tsx.recovered"; dest = "components/GraphEdges.tsx" },
    @{ source = "components/TopNavbar.tsx.recovered"; dest = "components/TopNavbar.tsx" },
    @{ source = "components/NodeDetailPanel.tsx.recovered"; dest = "components/NodeDetailPanel.tsx" },
    @{ source = "components/WorkflowCanvas.tsx.recovered"; dest = "components/WorkflowCanvas.tsx" },
    @{ source = "app/page.tsx.recovered"; dest = "app/page.tsx" }
)

$successCount = 0
foreach ($mapping in $fileMappings) {
    try {
        Copy-Item $mapping.source $mapping.dest -Force
        Write-Host "✅ $($mapping.dest)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ 恢复失败: $($mapping.dest)" -ForegroundColor Red
        Write-Host "   错误: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "恢复完成！" -ForegroundColor Green
Write-Host "成功恢复: $successCount/$($fileMappings.Count) 个文件" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "后续步骤:" -ForegroundColor Yellow
Write-Host "1. 运行 'npm install' 确保所有依赖已安装" -ForegroundColor Gray
Write-Host "2. 运行 'npm run dev' 启动开发服务器" -ForegroundColor Gray
Write-Host "3. 访问 http://localhost:3000 查看3D知识图谱" -ForegroundColor Gray
Write-Host ""

Write-Host "如需帮助，请查看 3D-PAGE-RECOVERY-GUIDE.md" -ForegroundColor Cyan
