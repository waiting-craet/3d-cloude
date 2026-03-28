# 需求文档

## 简介

本功能旨在简化导入数据页面的数据导入模板，让用户只需填写节点的核心信息（名称、内容、媒体文件、关系），而节点坐标等技术数据由系统自动生成。这将显著降低用户使用门槛，提升导入体验。

## 术语表

- **Import_System**: 数据导入系统，负责处理用户上传的图谱数据文件
- **Template_Generator**: 模板生成器，负责创建简化的导入模板文件
- **Coordinate_Generator**: 坐标生成器，负责为节点自动生成3D空间坐标
- **Template_File**: 模板文件，用户下载的示例数据文件
- **User_Data**: 用户填写的图谱数据，包含节点和边信息
- **Node**: 图谱中的节点，表示知识点或实体
- **Edge**: 图谱中的边，表示节点之间的关系
- **Media_Field**: 媒体字段，用于存储节点关联的图片或视频URL
- **Layout_Algorithm**: 布局算法，用于计算节点在3D空间中的位置

## 需求

### 需求 1: 简化模板字段

**用户故事:** 作为用户，我希望导入模板只包含必要的字段，这样我可以快速填写数据而不被复杂的技术参数困扰。

#### 验收标准

1. THE Template_Generator SHALL 生成包含以下必填字段的节点模板：label（节点名称）
2. THE Template_Generator SHALL 生成包含以下可选字段的节点模板：description（节点内容）、image（图片URL）、video（视频URL）
3. THE Template_Generator SHALL 生成包含以下必填字段的边模板：source（起始节点）、target（目标节点）
4. THE Template_Generator SHALL 生成包含以下可选字段的边模板：label（关系名称）
5. THE Template_Generator SHALL NOT 在模板中包含坐标字段（x、y、z）
6. THE Template_Generator SHALL NOT 在模板中包含视觉属性字段（color、size、shape）

### 需求 2: 自动生成节点坐标

**用户故事:** 作为用户，我希望系统自动为我的节点生成合理的空间位置，这样我不需要手动计算和填写坐标数据。

#### 验收标准

1. WHEN User_Data 不包含坐标信息时，THE Coordinate_Generator SHALL 使用力导向布局算法为所有节点生成3D坐标
2. THE Coordinate_Generator SHALL 确保生成的坐标值在合理范围内（-10000到10000）
3. THE Coordinate_Generator SHALL 确保节点之间保持适当的间距，避免重叠
4. THE Coordinate_Generator SHALL 根据边的连接关系优化节点布局，使相连节点距离适中
5. THE Coordinate_Generator SHALL 将生成的坐标保存到数据库中的x、y、z字段

### 需求 3: 支持媒体字段

**用户故事:** 作为用户，我希望在导入时可以为节点指定图片或视频，这样我的知识图谱可以包含丰富的多媒体内容。

#### 验收标准

1. THE Import_System SHALL 接受节点数据中的image字段（图片URL）
2. THE Import_System SHALL 接受节点数据中的video字段（视频URL）
3. WHEN 节点同时包含image和video字段时，THE Import_System SHALL 保存两个字段的值
4. THE Import_System SHALL 验证image和video字段的URL格式有效性
5. IF URL格式无效，THEN THE Import_System SHALL 记录警告信息但继续导入流程

### 需求 4: 更新模板文件

**用户故事:** 作为用户，我希望下载到的模板文件反映最新的简化格式，这样我可以按照正确的格式准备数据。

#### 验收标准

1. THE Template_Generator SHALL 更新3d-graph-template.json文件，移除所有坐标字段
2. THE Template_Generator SHALL 在模板文件中添加image和video字段示例
3. THE Template_Generator SHALL 在模板文件的使用说明中明确标注哪些字段由系统自动生成
4. THE Template_Generator SHALL 在模板文件中提供至少3个节点和3条边的示例数据
5. THE Template_Generator SHALL 确保模板文件的JSON格式正确且可被解析

### 需求 5: 向后兼容旧格式

**用户故事:** 作为已有数据的用户，我希望系统仍然能够处理包含坐标信息的旧格式文件，这样我不需要重新准备历史数据。

#### 验收标准

1. WHEN User_Data 包含x、y、z坐标字段时，THE Import_System SHALL 使用用户提供的坐标值
2. WHEN User_Data 部分节点包含坐标、部分节点不包含时，THE Coordinate_Generator SHALL 仅为缺失坐标的节点生成坐标
3. THE Import_System SHALL 接受同时包含新旧格式字段的混合数据
4. THE Import_System SHALL 在导入日志中记录使用的坐标来源（用户提供或系统生成）

### 需求 6: 数据验证增强

**用户故事:** 作为用户，我希望系统能够验证我填写的必要信息是否完整，这样我可以及时发现和修正数据问题。

#### 验收标准

1. THE Import_System SHALL 验证所有节点都包含label字段且非空
2. THE Import_System SHALL 验证所有边都包含source和target字段且非空
3. THE Import_System SHALL 验证边引用的节点在节点列表中存在
4. IF 验证失败，THEN THE Import_System SHALL 返回详细的错误信息，包括具体的节点或边索引
5. THE Import_System SHALL 允许description、image、video、label（边）字段为空或缺失

### 需求 7: 更新导入页面说明

**用户故事:** 作为用户，我希望导入页面的说明文档能够清楚地告诉我如何使用新的简化模板，这样我可以快速上手。

#### 验收标准

1. THE Import_System SHALL 在导入页面显示简化模板的字段说明
2. THE Import_System SHALL 在导入页面说明中强调坐标由系统自动生成
3. THE Import_System SHALL 在导入页面提供新模板文件的下载链接
4. THE Import_System SHALL 在导入页面说明中包含媒体字段（image、video）的使用示例
5. THE Import_System SHALL 在导入页面说明中注明支持Excel、CSV、JSON三种文件格式

### 需求 8: 解析器和打印器

**用户故事:** 作为开发者，我希望系统能够正确解析简化格式的数据文件，并能够将数据导出为相同格式，这样可以确保数据的一致性和可维护性。

#### 验收标准

1. WHEN 用户上传简化格式的JSON文件时，THE Import_System SHALL 正确解析节点的label、description、image、video字段
2. WHEN 用户上传简化格式的Excel文件时，THE Import_System SHALL 正确解析Nodes工作表中的所有字段
3. WHEN 用户上传简化格式的CSV文件时，THE Import_System SHALL 正确解析所有列数据
4. THE Import_System SHALL 提供导出功能，将图谱数据导出为简化格式的JSON文件
5. FOR ALL 有效的简化格式数据，导入后导出再导入 SHALL 产生等价的图谱结构（往返属性）

### 需求 9: 布局算法性能

**用户故事:** 作为用户，我希望系统能够快速生成节点布局，即使我导入了大量节点，这样我不需要长时间等待。

#### 验收标准

1. WHEN 节点数量少于100时，THE Coordinate_Generator SHALL 在1秒内完成坐标生成
2. WHEN 节点数量在100到500之间时，THE Coordinate_Generator SHALL 在5秒内完成坐标生成
3. WHEN 节点数量超过500时，THE Coordinate_Generator SHALL 在10秒内完成坐标生成
4. THE Coordinate_Generator SHALL 使用优化的力导向算法，避免不必要的计算
5. IF 坐标生成超时，THEN THE Import_System SHALL 使用简化的随机布局算法作为后备方案

### 需求 10: 错误处理和用户反馈

**用户故事:** 作为用户，我希望在导入过程中遇到问题时能够获得清晰的错误提示，这样我可以知道如何修正数据。

#### 验收标准

1. WHEN 文件格式不支持时，THE Import_System SHALL 显示支持的文件格式列表
2. WHEN 必填字段缺失时，THE Import_System SHALL 显示缺失字段的具体位置（行号或节点索引）
3. WHEN 边引用不存在的节点时，THE Import_System SHALL 显示无效的节点名称和边的索引
4. THE Import_System SHALL 在导入成功后显示导入的节点数量和边数量
5. THE Import_System SHALL 在导入过程中显示进度指示器，包括当前步骤（解析、验证、生成坐标、保存）
