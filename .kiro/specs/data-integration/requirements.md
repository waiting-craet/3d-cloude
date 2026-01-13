# Requirements Document

## Introduction

本文档定义了知识图谱系统的完整数据集成需求。该系统需要建立项目-知识图谱-节点-边的完整数据关联体系，确保所有UI组件（下拉框、三维视图、二维视图）都从云端数据库（Neon PostgreSQL 和 Vercel Blob）读取和存储数据，实现数据的完整对接和同步。

## Glossary

- **Project**: 项目，是知识图谱的顶层容器
- **Graph**: 知识图谱，属于某个项目，包含节点和边的集合
- **Node**: 节点，知识图谱中的基本单元
- **Edge**: 边，连接两个节点的关系
- **Neon_Database**: Neon PostgreSQL 云端数据库，存储所有结构化数据
- **Blob_Storage**: Vercel Blob 存储，存储媒体文件
- **TopNavbar**: 顶部导航栏组件，包含项目和图谱下拉框
- **KnowledgeGraph**: 三维知识图谱组件
- **WorkflowCanvas**: 二维知识图谱组件
- **Data_Association**: 数据关联，指项目-图谱-节点-边之间的层级关系

## Requirements

### Requirement 1: 数据库架构完善

**User Story:** 作为系统，我需要完善的数据库架构，以便支持项目-图谱-节点-边的完整关联。

#### Acceptance Criteria

1. WHEN 系统启动 THEN THE System SHALL 确保 Graph 模型与 Project 模型建立关联关系
2. WHEN 系统启动 THEN THE System SHALL 确保 Node 模型同时关联 Project 和 Graph
3. WHEN 系统启动 THEN THE System SHALL 确保 Edge 模型同时关联 Project 和 Graph
4. WHEN 删除项目 THEN THE System SHALL 级联删除该项目的所有图谱、节点和边
5. WHEN 删除图谱 THEN THE System SHALL 级联删除该图谱的所有节点和边

### Requirement 2: 项目和图谱下拉框数据加载

**User Story:** 作为用户，我想要从云端数据库加载项目和图谱列表，以便选择要查看的知识图谱。

#### Acceptance Criteria

1. WHEN 页面加载 THEN THE TopNavbar SHALL 从 Neon 数据库读取所有项目
2. WHEN 页面加载 THEN THE TopNavbar SHALL 从 Neon 数据库读取每个项目的所有图谱
3. WHEN 显示项目 THEN THE TopNavbar SHALL 显示项目名称和图谱数量
4. WHEN 显示图谱 THEN THE TopNavbar SHALL 显示图谱名称、节点数量和边数量
5. WHEN 数据库为空 THEN THE TopNavbar SHALL 显示"暂无项目"提示

### Requirement 3: 新建项目和图谱持久化

**User Story:** 作为用户，我想要新建的项目和图谱保存到云端数据库，以便数据持久化。

#### Acceptance Criteria

1. WHEN 用户创建新项目 THEN THE System SHALL 在 Neon 数据库创建 Project 记录
2. WHEN 用户创建新图谱 THEN THE System SHALL 在 Neon 数据库创建 Graph 记录
3. WHEN 创建图谱 THEN THE System SHALL 将图谱关联到指定项目
4. WHEN 创建成功 THEN THE System SHALL 返回新创建的项目 ID 和图谱 ID
5. WHEN 创建成功 THEN THE System SHALL 刷新下拉框显示最新数据

### Requirement 4: 节点创建时的数据关联

**User Story:** 作为用户，我想要创建的节点关联到当前项目和图谱，以便数据正确组织。

#### Acceptance Criteria

1. WHEN 用户在三维视图创建节点 THEN THE System SHALL 将节点关联到当前项目 ID
2. WHEN 用户在三维视图创建节点 THEN THE System SHALL 将节点关联到当前图谱 ID
3. WHEN 用户在二维视图创建节点 THEN THE System SHALL 将节点关联到当前项目 ID
4. WHEN 用户在二维视图创建节点 THEN THE System SHALL 将节点关联到当前图谱 ID
5. WHEN 节点创建成功 THEN THE System SHALL 更新图谱的节点计数

### Requirement 5: 边创建时的数据关联

**User Story:** 作为用户，我想要创建的边关联到当前项目和图谱，以便数据正确组织。

#### Acceptance Criteria

1. WHEN 用户在三维视图创建边 THEN THE System SHALL 将边关联到当前项目 ID
2. WHEN 用户在三维视图创建边 THEN THE System SHALL 将边关联到当前图谱 ID
3. WHEN 用户在二维视图创建边 THEN THE System SHALL 将边关联到当前项目 ID
4. WHEN 用户在二维视图创建边 THEN THE System SHALL 将边关联到当前图谱 ID
5. WHEN 边创建成功 THEN THE System SHALL 更新图谱的边计数

### Requirement 6: 切换图谱时加载数据

**User Story:** 作为用户，我想要切换图谱时加载对应的数据，以便查看不同图谱的内容。

#### Acceptance Criteria

1. WHEN 用户在下拉框选择图谱 THEN THE System SHALL 从 Neon 数据库读取该图谱的所有节点
2. WHEN 用户在下拉框选择图谱 THEN THE System SHALL 从 Neon 数据库读取该图谱的所有边
3. WHEN 数据加载完成 THEN THE System SHALL 在三维视图渲染所有节点和边
4. WHEN 切换图谱 THEN THE System SHALL 清空之前图谱的数据
5. WHEN 图谱为空 THEN THE System SHALL 显示空白画布

### Requirement 7: 编辑已有节点时加载数据

**User Story:** 作为用户，我想要编辑节点时看到已有的数据，以便修改现有内容。

#### Acceptance Criteria

1. WHEN 用户点击节点编辑按钮 THEN THE System SHALL 从 Neon 数据库读取节点的完整数据
2. WHEN 节点包含图片 THEN THE System SHALL 从 Blob 存储加载图片 URL
3. WHEN 编辑模态框打开 THEN THE System SHALL 预填充节点的所有字段
4. WHEN 用户修改节点 THEN THE System SHALL 更新 Neon 数据库中的节点记录
5. WHEN 用户上传新图片 THEN THE System SHALL 删除旧图片并上传新图片到 Blob 存储

### Requirement 8: 三维和二维视图数据同步

**User Story:** 作为用户，我想要三维和二维视图显示相同的数据，以便在不同视图间切换。

#### Acceptance Criteria

1. WHEN 用户在三维视图创建节点 THEN THE System SHALL 确保二维视图也能看到该节点
2. WHEN 用户在二维视图创建节点 THEN THE System SHALL 确保三维视图也能看到该节点
3. WHEN 用户在三维视图删除节点 THEN THE System SHALL 确保二维视图也删除该节点
4. WHEN 用户在二维视图删除节点 THEN THE System SHALL 确保三维视图也删除该节点
5. WHEN 切换视图 THEN THE System SHALL 从数据库重新加载数据确保一致性

### Requirement 9: 图谱统计信息实时更新

**User Story:** 作为用户，我想要看到实时的节点和边数量，以便了解图谱规模。

#### Acceptance Criteria

1. WHEN 创建节点 THEN THE System SHALL 增加图谱的 nodeCount
2. WHEN 删除节点 THEN THE System SHALL 减少图谱的 nodeCount
3. WHEN 创建边 THEN THE System SHALL 增加图谱的 edgeCount
4. WHEN 删除边 THEN THE System SHALL 减少图谱的 edgeCount
5. WHEN 下拉框刷新 THEN THE System SHALL 显示最新的统计数字

### Requirement 10: 数据隔离和过滤

**User Story:** 作为系统，我需要确保数据正确隔离，以便不同项目和图谱的数据不混淆。

#### Acceptance Criteria

1. WHEN 查询节点 THEN THE System SHALL 只返回当前图谱 ID 的节点
2. WHEN 查询边 THEN THE System SHALL 只返回当前图谱 ID 的边
3. WHEN 查询图谱列表 THEN THE System SHALL 只返回当前项目 ID 的图谱
4. WHEN 创建节点 THEN THE System SHALL 验证当前项目 ID 和图谱 ID 存在
5. WHEN 创建边 THEN THE System SHALL 验证源节点和目标节点属于当前图谱

### Requirement 11: 从本地存储迁移到云端数据库

**User Story:** 作为系统，我需要停止使用 localStorage，改为使用云端数据库，以便数据可靠存储。

#### Acceptance Criteria

1. WHEN 系统启动 THEN THE System SHALL 不再从 localStorage 读取项目数据
2. WHEN 系统启动 THEN THE System SHALL 从 Neon 数据库读取所有数据
3. WHEN 用户操作 THEN THE System SHALL 不再写入 localStorage
4. WHEN 用户操作 THEN THE System SHALL 直接写入 Neon 数据库
5. WHEN 数据库操作失败 THEN THE System SHALL 显示错误提示而不是回退到 localStorage

### Requirement 12: API 路由完善

**User Story:** 作为开发者，我需要完善的 API 路由，以便前端组件能够正确操作数据。

#### Acceptance Criteria

1. THE System SHALL 提供 GET /api/projects 路由获取所有项目
2. THE System SHALL 提供 POST /api/projects 路由创建项目
3. THE System SHALL 提供 GET /api/projects/[id]/graphs 路由获取项目的所有图谱
4. THE System SHALL 提供 POST /api/projects/[id]/graphs 路由在项目中创建图谱
5. THE System SHALL 提供 GET /api/graphs/[id] 路由获取图谱的完整数据（节点和边）
6. THE System SHALL 提供 PUT /api/graphs/[id] 路由更新图谱统计信息
7. THE System SHALL 提供 DELETE /api/graphs/[id] 路由删除图谱

### Requirement 13: 错误处理和用户反馈

**User Story:** 作为用户，我想要清晰的错误提示，以便知道操作是否成功。

#### Acceptance Criteria

1. WHEN 数据库连接失败 THEN THE System SHALL 显示"无法连接到数据库"错误
2. WHEN 创建操作失败 THEN THE System SHALL 显示具体的错误原因
3. WHEN 数据加载失败 THEN THE System SHALL 显示"加载失败，请重试"提示
4. WHEN 操作成功 THEN THE System SHALL 显示成功提示（如"项目创建成功"）
5. WHEN 网络请求超时 THEN THE System SHALL 显示"请求超时"错误

### Requirement 14: 性能优化

**User Story:** 作为用户，我想要快速的数据加载，以便流畅使用系统。

#### Acceptance Criteria

1. WHEN 加载项目列表 THEN THE System SHALL 在 1 秒内完成
2. WHEN 切换图谱 THEN THE System SHALL 在 2 秒内加载并渲染数据
3. WHEN 创建节点 THEN THE System SHALL 在 500 毫秒内完成并更新 UI
4. WHEN 查询使用索引 THEN THE System SHALL 利用数据库索引加速查询
5. WHEN 数据量大 THEN THE System SHALL 使用分页或虚拟滚动优化性能

### Requirement 15: 数据一致性保证

**User Story:** 作为系统，我需要保证数据一致性，以便避免数据损坏。

#### Acceptance Criteria

1. WHEN 创建节点和更新统计 THEN THE System SHALL 使用数据库事务确保原子性
2. WHEN 删除图谱 THEN THE System SHALL 在同一事务中删除图谱、节点和边
3. WHEN 并发操作 THEN THE System SHALL 使用数据库锁防止竞态条件
4. WHEN 操作失败 THEN THE System SHALL 回滚所有相关更改
5. WHEN 检测到不一致 THEN THE System SHALL 记录错误日志并尝试修复
