# 需求文档：AI文本输入锁定功能

## 简介

本文档定义了AI知识图谱生成页面中文本输入锁定功能的需求。该功能确保用户在上传文件后，文本输入框被禁用，防止同时使用多个数据输入源造成混淆，从而提供清晰一致的用户体验。

## 术语表

- **TextInputBox**：文本输入框组件，用于用户手动输入文本内容
- **FileUploadComponent**：文件上传组件，允许用户上传文档文件
- **UploadedFile**：已上传的文件对象，包含文件名、大小、类型和内容
- **InputState**：输入框的状态，包括启用/禁用状态和视觉样式
- **DataSource**：数据输入源，可以是文本输入或文件上传

## 需求

### 需求 1：文本输入框禁用控制

**用户故事**：作为用户，我希望在上传文件后文本输入框被自动禁用，这样我就不会混淆数据输入源。

#### 验收标准

1. WHEN 用户上传有效文件 THEN TextInputBox SHALL 被禁用
2. WHEN UploadedFile 状态为 null THEN TextInputBox SHALL 被启用
3. WHEN TextInputBox 被禁用 THEN 用户输入操作 SHALL 被阻止
4. WHEN 用户尝试在禁用的 TextInputBox 中输入 THEN 输入文本状态 SHALL 保持不变

### 需求 2：文件移除后恢复输入

**用户故事**：作为用户，我希望在移除上传的文件后能够重新使用文本输入框，这样我可以切换输入方式。

#### 验收标准

1. WHEN 用户点击移除文件按钮 THEN UploadedFile 状态 SHALL 被设置为 null
2. WHEN UploadedFile 被移除 THEN TextInputBox SHALL 立即被启用
3. WHEN 文件移除操作完成 THEN 预览窗口 SHALL 被关闭
4. WHEN TextInputBox 被重新启用 THEN 用户 SHALL 能够输入新的文本内容

### 需求 3：视觉反馈一致性

**用户故事**：作为用户，我希望看到清晰的视觉提示来了解输入框的状态，这样我就知道当前可以使用哪种输入方式。

#### 验收标准

1. WHEN TextInputBox 被禁用 THEN 背景颜色 SHALL 显示为灰色（#f5f5f5）
2. WHEN TextInputBox 被禁用 THEN 光标样式 SHALL 显示为 'not-allowed'
3. WHEN TextInputBox 被禁用 THEN 文本颜色 SHALL 显示为浅灰色（#999）
4. WHEN TextInputBox 被启用 THEN 背景颜色 SHALL 显示为白色
5. WHEN TextInputBox 被启用 THEN 光标样式 SHALL 显示为 'text'
6. WHEN TextInputBox 被启用 THEN 文本颜色 SHALL 显示为深色（#2c2c2c）
7. WHEN 输入框状态改变 THEN 样式过渡 SHALL 在 0.2 秒内平滑完成

### 需求 4：占位符文本更新

**用户故事**：作为用户，我希望看到描述性的占位符文本，这样我就能理解为什么输入框被禁用以及如何恢复。

#### 验收标准

1. WHEN UploadedFile 存在 THEN 占位符文本 SHALL 显示"已导入文件，如需输入文本请先移除文件"
2. WHEN UploadedFile 为 null THEN 占位符文本 SHALL 显示"输入文本内容，AI 将自动提取实体和关系..."
3. WHEN 占位符文本更新 THEN 更新 SHALL 与输入框状态变化同步发生

### 需求 5：数据源互斥性

**用户故事**：作为系统，我需要确保 AI 分析时只使用一个数据源，这样可以保证数据的完整性和一致性。

#### 验收标准

1. WHEN AI 分析被触发 THEN 系统 SHALL 使用且仅使用一个 DataSource
2. WHEN UploadedFile 存在 THEN AI 分析 SHALL 使用文件内容作为 DataSource
3. WHEN UploadedFile 为 null 且文本输入非空 THEN AI 分析 SHALL 使用输入文本作为 DataSource
4. WHEN UploadedFile 存在 THEN 输入文本内容 SHALL 被忽略

### 需求 6：状态一致性保证

**用户故事**：作为系统，我需要维护输入框状态与文件上传状态之间的一致性，这样可以防止 UI 状态错误。

#### 验收标准

1. THE 系统 SHALL 确保 TextInputBox 禁用状态始终反映 UploadedFile 的存在性
2. WHEN 组件重新渲染 THEN InputState SHALL 根据当前 UploadedFile 状态重新计算
3. WHEN 状态不一致被检测到 THEN React 声明式渲染 SHALL 自动修正状态

### 需求 7：文件上传错误处理

**用户故事**：作为用户，我希望在文件上传失败时得到清晰的反馈，这样我可以采取适当的行动。

#### 验收标准

1. WHEN 文件读取过程中发生错误 THEN 系统 SHALL 显示错误提示消息
2. WHEN 文件上传失败 THEN UploadedFile 状态 SHALL 保持为 null
3. WHEN 文件上传失败 THEN TextInputBox SHALL 保持启用状态
4. WHEN 文件内容为空 THEN 系统 SHALL 显示警告提示
5. WHEN 文件内容为空 THEN UploadedFile 状态 SHALL 不被设置
6. WHEN 文件上传错误发生后 THEN 用户 SHALL 能够重新选择文件上传

### 需求 8：性能要求

**用户故事**：作为用户，我希望输入框状态切换是即时的，这样可以获得流畅的交互体验。

#### 验收标准

1. WHEN 计算输入框禁用状态 THEN 计算时间 SHALL 小于 1 毫秒
2. WHEN 样式对象被计算 THEN 计算 SHALL 在单次渲染周期内完成
3. WHEN 状态改变触发重新渲染 THEN UI 更新 SHALL 在 16 毫秒内完成（60fps）
