# GitHub MCP 配置问题说明

## 🔴 当前状态

GitHub MCP 服务器暂时无法使用，已禁用。

## 问题描述

### 已解决的问题
1. ✅ **Deno 安装** - Deno 2.6.4 已成功安装并配置
2. ✅ **PATH 配置** - Deno 路径已正确添加到环境变量
3. ✅ **JSON 语法** - MCP 配置文件语法正确

### 当前问题
❌ **github-mcp-server 包错误**

```
ModuleNotFoundError: No module named 'src'
```

这是 `github-mcp-server` Python 包本身的一个 bug。包的内部导入路径有问题：
- 文件位置: `github_mcp/cli.py`
- 错误代码: `from src.github_mcp.utils.health import health_check`
- 问题: 包内部使用了错误的导入路径 `src.github_mcp` 而不是 `github_mcp`

## 解决方案

### 方案 1: 等待包更新（推荐）

`github-mcp-server` 包目前有 bug，建议：
1. 暂时禁用 GitHub MCP（已完成）
2. 等待包作者修复这个问题
3. 定期检查包更新: `uvx --upgrade github-mcp-server`

### 方案 2: 使用替代方案

如果你需要 GitHub 集成功能，可以考虑：

1. **使用 GitHub CLI (gh)**
   ```powershell
   # 安装 GitHub CLI
   winget install GitHub.cli
   
   # 认证
   gh auth login
   
   # 使用命令
   gh repo list
   gh issue list
   gh pr list
   ```

2. **使用 Git 命令**
   - 直接使用 git 命令管理仓库
   - 通过浏览器访问 GitHub 网页

3. **等待其他 MCP 服务器**
   - 社区可能会开发其他 GitHub MCP 实现
   - 关注 MCP 生态系统更新

## 当前配置

MCP 配置文件 (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "uvx",
      "args": ["--from", "github-mcp-server", "github-mcp-cli"],
      "env": {
        "GITHUB_TOKEN": "github_pat_...",
        "FASTMCP_LOG_LEVEL": "INFO",
        "PATH": "C:\\Users\\waiting\\.deno\\bin;${PATH}"
      },
      "autoApprove": ["read_repo", "list_issues", "list_prs"],
      "disabled": true  // 已禁用
    }
  }
}
```

## 技术细节

### 错误堆栈
```
File "github_mcp\cli.py", line 22, in <module>
    from src.github_mcp.utils.health import health_check
ModuleNotFoundError: No module named 'src'
```

### 包信息
- **包名**: github-mcp-server
- **版本**: v2.5.4
- **安装方式**: uvx (uv 包管理器)
- **Python 版本**: 3.10.19
- **Deno 版本**: 2.6.4

### 已尝试的解决方法
1. ✅ 重新安装 Deno
2. ✅ 配置 PATH 环境变量
3. ✅ 修正 MCP 配置语法
4. ✅ 在 MCP 配置中显式添加 Deno PATH
5. ❌ 包本身有 bug，无法通过配置解决

## 对项目的影响

### ✅ 不影响的功能
- Vercel 部署 - 完全正常
- 3D 知识图谱 - 完全正常
- 2D 工作流画布 - 完全正常
- 媒体上传 (Vercel Blob) - 完全正常
- 数据库 (Neon PostgreSQL) - 完全正常
- 所有核心开发功能 - 完全正常

### ❌ 受影响的功能
- GitHub MCP 集成 - 暂时无法使用
  - 无法通过 Kiro 直接操作 GitHub
  - 需要使用其他方式访问 GitHub（浏览器、gh CLI、git 命令）

## 下一步

1. **继续开发项目** - GitHub MCP 不是必需的，不影响核心功能
2. **使用替代方案** - 使用 GitHub CLI 或浏览器访问 GitHub
3. **定期检查更新** - 等待 github-mcp-server 包修复

## 检查更新

定期运行以下命令检查包是否已修复：

```powershell
# 升级包
uvx --upgrade --from github-mcp-server github-mcp-cli --help

# 如果不再报错，则可以重新启用
# 修改 .kiro/settings/mcp.json 中的 "disabled": false
```

---

**更新时间**: 2026-01-13  
**状态**: GitHub MCP 暂时禁用，不影响项目开发
