# 需求文档

## 简介

本功能旨在将导入数据页面的模板格式从当前的矩阵列表格式改为更简洁直观的边列表格式。新格式采用三列结构：源节点、关系、目标节点，使用户能够更容易地理解和填写图谱数据。

## 术语表

- **Edge_List_Format**: 边列表格式，一种图数据表示方法，每行表示一条边，包含源节点、关系和目标节点
- **Template_Generator**: 模板生成器，负责生成Excel、JSON和CSV格式的导入模板
- **Data_Validator**: 数据验证器，负责验证导入数据的完整性和正确性
- **Graph_Import_Service**: 图谱导入服务，负责解析和转换导入的图谱数据
- **Coordinate_Generator**: 坐标生成器，负责为节点生成3D空间坐标
- **Matrix_List_Format**: 矩阵列表格式，当前使用的格式，每行表示一个节点及其所有出边关系
- **Source_Node**: 源节点，边的起始节点
- **Target_Node**: 目标节点，边的终止节点
- **Edge_Label**: 边标签，描述源节点和目标节点之间的关系类型

## 需求

### 需求 1: Excel模板格式更新

**用户故事:** 作为用户，我希望使用简洁的三列格式填写Excel模板，以便更容易理解和录入图谱数据。

#### 验收标准

1. WHEN Template_Generator生成Excel模板时，THE Template_Generator SHALL创建包含三列的工作表：源节点、关系、目标节点
2. THE Excel模板 SHALL在第一行包含列标题："源节点"、"关系"、"目标节点"
3. THE Excel模板 SHALL包含至少3行示例数据行（如：N1-V1-N2, N1-V2-N3, N2-V3-N3）
4. THE Excel模板 SHALL包含使用说明工作表，说明边列表格式的填写方法
5. THE 使用说明工作表 SHALL说明每行代表一条边关系，而非一个节点的所有关系

### 需求 2: JSON模板格式更新

**用户故事:** 作为开发者，我希望JSON模板采用边列表格式，以便与Excel格式保持一致。

#### 验收标准

1. WHEN Template_Generator生成JSON模板时，THE Template_Generator SHALL创建包含edges数组的结构
2. THE edges数组中的每个对象 SHALL包含source、relation和target字段
3. THE JSON模板 SHALL包含至少3条示例边数据
4. THE JSON模板 SHALL包含使用说明对象，解释边列表格式
5. THE JSON模板 SHALL自动从边数据中提取唯一节点列表

### 需求 3: CSV模板格式更新

**用户故事:** 作为数据分析师，我希望CSV模板使用三列格式，以便使用常见工具处理数据。

#### 验收标准

1. WHEN Template_Generator生成CSV模板时，THE Template_Generator SHALL创建三列格式：源节点,关系,目标节点
2. THE CSV模板 SHALL在第一行包含列标题
3. THE CSV模板 SHALL包含至少3行示例数据
4. THE CSV模板 SHALL在文件开头包含注释行，说明格式和填写方法
5. THE CSV模板 SHALL使用UTF-8编码以支持中文字符

### 需求 4: 边列表数据解析

**用户故事:** 作为系统，我需要正确解析边列表格式的数据，以便转换为内部图谱结构。

#### 验收标准

1. WHEN Graph_Import_Service接收边列表格式的Excel文件时，THE Graph_Import_Service SHALL从三列数据中提取源节点、关系和目标节点
2. WHEN Graph_Import_Service解析边列表数据时，THE Graph_Import_Service SHALL自动提取所有唯一节点
3. WHEN Graph_Import_Service解析边列表数据时，THE Graph_Import_Service SHALL为每条边创建edge对象，包含source、target和label字段
4. WHEN Graph_Import_Service解析边列表数据时，THE Graph_Import_Service SHALL为每个唯一节点创建node对象，包含label字段
5. THE Graph_Import_Service SHALL跳过空行和仅包含空白字符的行

### 需求 5: 数据验证逻辑更新

**用户故事:** 作为系统，我需要验证边列表数据的完整性，以便及早发现数据错误。

#### 验收标准

1. WHEN Data_Validator验证边列表数据时，THE Data_Validator SHALL检查每条边是否包含非空的源节点和目标节点
2. IF 边的源节点或目标节点为空，THEN THE Data_Validator SHALL返回错误信息，说明具体哪一行缺少必需字段
3. WHEN Data_Validator验证边列表数据时，THE Data_Validator SHALL检查是否存在自环边（源节点等于目标节点）
4. IF 存在自环边，THEN THE Data_Validator SHALL返回警告信息，提示用户确认
5. WHEN Data_Validator验证边列表数据时，THE Data_Validator SHALL统计唯一节点数量和边数量

### 需求 6: 坐标生成逻辑适配

**用户故事:** 作为系统，我需要为从边列表提取的节点生成3D坐标，以便在3D空间中显示图谱。

#### 验收标准

1. WHEN Coordinate_Generator接收从边列表提取的节点时，THE Coordinate_Generator SHALL为每个节点生成唯一的3D坐标（x, y, z）
2. THE Coordinate_Generator SHALL使用力导向布局算法，确保连接的节点距离适中
3. THE Coordinate_Generator SHALL确保生成的坐标分布均匀，避免节点重叠
4. THE Coordinate_Generator SHALL将坐标范围控制在合理区间（-500到500）
5. THE Coordinate_Generator SHALL为节点分配默认的颜色、大小和形状属性

### 需求 7: 向后兼容性

**用户故事:** 作为现有用户，我希望系统仍能识别旧的矩阵列表格式，以便我的历史数据仍然可用。

#### 验收标准

1. WHEN Graph_Import_Service接收Excel文件时，THE Graph_Import_Service SHALL检测文件使用的格式类型（边列表或矩阵列表）
2. IF Excel文件包含三列且列标题为"源节点"、"关系"、"目标节点"，THEN THE Graph_Import_Service SHALL使用边列表解析器
3. IF Excel文件不符合边列表格式，THEN THE Graph_Import_Service SHALL尝试使用矩阵列表解析器
4. THE Graph_Import_Service SHALL在解析失败时返回清晰的错误信息，说明支持的格式类型
5. THE Graph_Import_Service SHALL在导入成功后记录使用的格式类型

### 需求 8: 模板下载功能更新

**用户故事:** 作为用户，我希望下载的模板文件使用新的边列表格式，以便按照最新标准填写数据。

#### 验收标准

1. WHEN 用户请求下载Excel模板时，THE 系统 SHALL返回边列表格式的Excel文件
2. WHEN 用户请求下载JSON模板时，THE 系统 SHALL返回边列表格式的JSON文件
3. WHEN 用户请求下载CSV模板时，THE 系统 SHALL返回边列表格式的CSV文件
4. THE 下载的模板文件名 SHALL包含格式版本标识（如：graph-template-edgelist-v2.xlsx）
5. THE 模板文件 SHALL包含创建日期和版本信息

### 需求 9: 用户界面提示更新

**用户故事:** 作为用户，我希望在导入页面看到关于新格式的说明，以便了解如何使用边列表格式。

#### 验收标准

1. THE 导入页面 SHALL显示边列表格式的示例图片或表格
2. THE 导入页面 SHALL提供格式说明文本，解释三列的含义
3. THE 导入页面 SHALL提供快速入门指南链接，详细说明边列表格式
4. WHEN 用户上传文件失败时，THE 系统 SHALL显示错误信息和格式要求
5. THE 导入页面 SHALL提供格式对比说明，帮助用户从旧格式迁移到新格式

### 需求 10: 批量边数据处理

**用户故事:** 作为用户，我希望能够一次导入大量边数据，以便快速构建大型图谱。

#### 验收标准

1. THE Graph_Import_Service SHALL支持导入至少10000条边的数据
2. WHEN 导入大量数据时，THE Graph_Import_Service SHALL显示进度指示器
3. WHEN 导入大量数据时，THE Graph_Import_Service SHALL在后台异步处理，避免阻塞用户界面
4. IF 导入过程中发生错误，THEN THE Graph_Import_Service SHALL保存已成功处理的数据
5. THE Graph_Import_Service SHALL在导入完成后显示统计信息（节点数、边数、处理时间）
