# 需求文档

## 简介

本功能为导入数据页面添加冗余数据检测能力。当用户在选择好项目和图谱并成功上传数据后，点击"生成图谱"按钮时，系统将检测上传文件中的节点和边是否与当前项目和图谱中已存在的数据冗余，仅导入非冗余数据，并在弹窗中实时显示冗余数据统计信息。

## 术语表

- **Import_System**: 导入数据处理系统
- **Duplicate_Detector**: 冗余数据检测服务（duplicate-detection.ts）
- **Node**: 图谱中的节点实体
- **Edge**: 图谱中的边（关系）
- **Import_Progress_Dialog**: 点击"生成图谱"按钮后立即显示的导入进度弹窗
- **Project**: 用户当前选择的项目
- **Graph**: 用户当前选择的图谱
- **Import_API**: 导入数据的后端API（/api/import）
- **Import_Page**: 数据导入页面（app/import/page.tsx）

## 需求

### 需求 1: 冗余数据检测

**用户故事:** 作为用户，我希望系统能够检测上传文件中的冗余数据，以避免重复导入相同的节点和边。

#### 验收标准

1. WHEN 用户点击"生成图谱"按钮，THE Duplicate_Detector SHALL 检测上传文件中的节点与当前项目和图谱中已存在节点的冗余性
2. WHEN 用户点击"生成图谱"按钮，THE Duplicate_Detector SHALL 检测上传文件中的边与当前项目和图谱中已存在边的冗余性
3. THE Duplicate_Detector SHALL 基于节点的 name 字段判断节点是否冗余
4. THE Duplicate_Detector SHALL 基于边的源节点 name、目标节点 name 和关系类型判断边是否冗余
5. THE Duplicate_Detector SHALL 在导入操作开始前完成冗余检测

### 需求 2: 非冗余数据导入

**用户故事:** 作为用户，我希望系统只导入非冗余的数据，以保持数据库的数据质量和一致性。

#### 验收标准

1. WHEN 冗余检测完成后，THE Import_System SHALL 仅将非冗余的节点写入数据库
2. WHEN 冗余检测完成后，THE Import_System SHALL 仅将非冗余的边写入数据库
3. THE Import_System SHALL 保持原有的导入流程和数据验证逻辑
4. IF 所有数据均为冗余数据，THEN THE Import_System SHALL 完成导入流程但不写入任何数据

### 需求 3: 冗余统计信息显示

**用户故事:** 作为用户，我希望在点击"生成图谱"按钮后出现的弹窗中看到冗余数据的统计信息，以了解有多少数据被过滤。

#### 验收标准

1. WHEN 用户点击"生成图谱"按钮，THE Import_Progress_Dialog SHALL 立即显示
2. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示文件中的总节点数量
3. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示文件中的总边数量
4. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示检测到的冗余节点数量
5. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示检测到的冗余边数量
6. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示成功导入的节点数量
7. WHEN 导入API返回响应后，THE Import_Progress_Dialog SHALL 显示成功导入的边数量
8. THE Import_Progress_Dialog SHALL 以清晰易读的网格布局展示统计信息

### 需求 4: 检测性能

**用户故事:** 作为用户，我希望冗余检测过程不会显著影响导入操作的性能。

#### 验收标准

1. WHEN 上传文件包含少于 1000 个节点，THE Duplicate_Detector SHALL 在 2 秒内完成检测
2. WHEN 上传文件包含少于 5000 条边，THE Duplicate_Detector SHALL 在 3 秒内完成检测
3. THE Duplicate_Detector SHALL 使用 Set 或 Map 数据结构进行冗余比对
4. THE Import_Progress_Dialog SHALL 在检测过程中显示加载动画

### 需求 5: 错误处理

**用户故事:** 作为用户，我希望当冗余检测过程出现错误时，系统能够给出清晰的错误提示。

#### 验收标准

1. IF 冗余检测过程中发生数据库查询错误，THEN THE Import_API SHALL 返回描述性错误消息
2. IF 冗余检测过程中发生数据格式错误，THEN THE Import_API SHALL 返回描述性错误消息
3. WHEN 检测过程发生错误，THE Import_System SHALL 中止导入操作
4. THE Import_System SHALL 记录错误日志以便调试和追踪
5. WHEN 导入失败，THE Import_Progress_Dialog SHALL 显示错误消息并允许用户关闭弹窗
