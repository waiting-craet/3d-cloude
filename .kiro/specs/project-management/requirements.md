# Requirements Document

## Introduction

本文档定义了项目管理系统的需求规范。该系统允许用户创建和管理项目，每个项目包含一个或多个知识图谱，所有数据存储在云端（Neon 数据库和 Vercel Blob 存储），并支持从云端读取和展示数据。

## Glossary

- **Project**: 项目，是知识图谱的容器，包含项目名称、描述、创建时间等元数据
- **Knowledge_Graph**: 知识图谱，属于某个项目，包含节点（Nodes）和边（Edges）
- **Node**: 节点，知识图谱中的基本单元，包含文本、图片等内容
- **Edge**: 边，连接两个节点的关系线
- **Neon_Database**: Neon PostgreSQL 数据库，用于存储结构化数据（项目、节点、边的元数据）
- **Blob_Storage**: Vercel Blob 存储，用于存储媒体文件（图片、文档等）
- **Cloud_Sync**: 云端同步，指数据在本地和云端数据库之间的同步过程

## Requirements

### Requirement 1: 项目创建

**User Story:** 作为用户，我想要创建新项目，以便组织和管理我的知识图谱。

#### Acceptance Criteria

1. WHEN 用户点击创建项目按钮 THEN THE System SHALL 显示项目创建表单
2. WHEN 用户提交项目表单 THEN THE System SHALL 验证项目名称不为空
3. WHEN 项目名称有效 THEN THE System SHALL 在 Neon 数据库中创建新项目记录
4. WHEN 项目创建成功 THEN THE System SHALL 生成唯一的项目 ID
5. WHEN 项目创建成功 THEN THE System SHALL 记录创建时间戳

### Requirement 2: 项目列表展示

**User Story:** 作为用户，我想要查看所有项目列表，以便选择要操作的项目。

#### Acceptance Criteria

1. WHEN 用户访问主页 THEN THE System SHALL 从 Neon 数据库读取所有项目
2. WHEN 项目数据加载完成 THEN THE System SHALL 显示项目列表，包含项目名称、描述和创建时间
3. WHEN 项目列表为空 THEN THE System SHALL 显示空状态提示
4. WHEN 用户点击某个项目 THEN THE System SHALL 导航到该项目的知识图谱页面

### Requirement 3: 知识图谱与项目关联

**User Story:** 作为用户，我想要知识图谱关联到特定项目，以便组织和隔离不同项目的数据。

#### Acceptance Criteria

1. WHEN 创建新节点 THEN THE System SHALL 将节点关联到当前活动项目
2. WHEN 创建新边 THEN THE System SHALL 将边关联到当前活动项目
3. WHEN 查询知识图谱数据 THEN THE System SHALL 只返回当前项目的节点和边
4. WHEN 切换项目 THEN THE System SHALL 清空当前显示的知识图谱并加载新项目的数据

### Requirement 4: 节点数据持久化

**User Story:** 作为用户，我想要节点数据自动保存到云端，以便在任何设备上访问我的数据。

#### Acceptance Criteria

1. WHEN 创建新节点 THEN THE System SHALL 将节点元数据保存到 Neon 数据库
2. WHEN 节点包含图片 THEN THE System SHALL 将图片上传到 Blob 存储并保存 URL 到数据库
3. WHEN 更新节点内容 THEN THE System SHALL 更新 Neon 数据库中的节点记录
4. WHEN 删除节点 THEN THE System SHALL 从 Neon 数据库删除节点记录
5. WHEN 删除包含图片的节点 THEN THE System SHALL 从 Blob 存储删除关联的图片文件

### Requirement 5: 边数据持久化

**User Story:** 作为用户，我想要节点之间的连接关系保存到云端，以便保持知识图谱的完整性。

#### Acceptance Criteria

1. WHEN 创建新边 THEN THE System SHALL 将边记录保存到 Neon 数据库，包含源节点 ID 和目标节点 ID
2. WHEN 删除边 THEN THE System SHALL 从 Neon 数据库删除边记录
3. WHEN 删除节点 THEN THE System SHALL 自动删除所有关联的边记录
4. WHEN 查询边数据 THEN THE System SHALL 验证源节点和目标节点都存在于当前项目中

### Requirement 6: 从云端加载数据

**User Story:** 作为用户，我想要从云端加载项目数据，以便在任何设备上继续工作。

#### Acceptance Criteria

1. WHEN 用户打开项目 THEN THE System SHALL 从 Neon 数据库读取该项目的所有节点
2. WHEN 用户打开项目 THEN THE System SHALL 从 Neon 数据库读取该项目的所有边
3. WHEN 节点包含图片 URL THEN THE System SHALL 从 Blob 存储加载图片并显示
4. WHEN 数据加载失败 THEN THE System SHALL 显示错误提示并允许用户重试
5. WHEN 数据加载成功 THEN THE System SHALL 在画布上渲染所有节点和边

### Requirement 7: 数据一致性

**User Story:** 作为系统，我需要确保数据在本地和云端保持一致，以便用户获得可靠的体验。

#### Acceptance Criteria

1. WHEN 执行数据库操作 THEN THE System SHALL 使用事务确保操作的原子性
2. WHEN 创建边 THEN THE System SHALL 验证源节点和目标节点存在于数据库中
3. WHEN 删除节点 THEN THE System SHALL 在同一事务中删除节点和所有关联的边
4. WHEN 上传失败 THEN THE System SHALL 回滚数据库操作并通知用户
5. WHEN 检测到数据不一致 THEN THE System SHALL 记录错误日志并尝试修复

### Requirement 8: 项目删除

**User Story:** 作为用户，我想要删除不需要的项目，以便清理我的工作空间。

#### Acceptance Criteria

1. WHEN 用户请求删除项目 THEN THE System SHALL 显示确认对话框
2. WHEN 用户确认删除 THEN THE System SHALL 删除项目的所有节点记录
3. WHEN 用户确认删除 THEN THE System SHALL 删除项目的所有边记录
4. WHEN 用户确认删除 THEN THE System SHALL 删除项目记录
5. WHEN 用户确认删除 THEN THE System SHALL 删除所有关联的 Blob 存储文件
6. WHEN 删除操作完成 THEN THE System SHALL 刷新项目列表

### Requirement 9: 数据库连接管理

**User Story:** 作为系统，我需要可靠地管理数据库连接，以便提供稳定的服务。

#### Acceptance Criteria

1. WHEN 应用启动 THEN THE System SHALL 初始化 Prisma 客户端连接到 Neon 数据库
2. WHEN 数据库连接失败 THEN THE System SHALL 记录错误并返回友好的错误消息
3. WHEN API 请求完成 THEN THE System SHALL 正确关闭数据库连接
4. WHEN 检测到连接池耗尽 THEN THE System SHALL 等待可用连接或返回超时错误

### Requirement 10: 媒体文件管理

**User Story:** 作为用户，我想要上传和管理知识图谱中的媒体文件，以便丰富节点内容。

#### Acceptance Criteria

1. WHEN 用户上传图片 THEN THE System SHALL 验证文件类型为支持的图片格式
2. WHEN 图片验证通过 THEN THE System SHALL 上传图片到 Blob 存储
3. WHEN 上传成功 THEN THE System SHALL 返回图片的公开访问 URL
4. WHEN 上传失败 THEN THE System SHALL 返回错误消息并保持节点数据不变
5. WHEN 节点被删除 THEN THE System SHALL 从 Blob 存储删除关联的图片文件以释放空间
