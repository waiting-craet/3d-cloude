# Requirements Document

## Introduction

本规范定义了节点详情面板的编辑功能增强。当前的节点详情面板仅支持只读查看，用户需要跳转到2D编辑页面才能修改节点信息。本功能将使节点详情面板支持直接编辑节点信息（名称、描述）和上传图片，并在关闭面板时自动保存更改。

## Glossary

- **NodeDetailPanel**: 节点详情面板组件，显示在页面右侧的弹窗
- **Node**: 知识图谱中的节点对象，包含id、name、description、imageUrl等属性
- **AutoSave**: 自动保存机制，在用户关闭面板时触发
- **ImageUpload**: 图片上传功能，允许用户为节点添加或更新图片
- **EditableField**: 可编辑字段，用户可以直接在面板中修改的输入框

## Requirements

### Requirement 1: 节点信息可编辑

**User Story:** 作为用户，我希望在节点详情面板中直接编辑节点的名称和描述，这样我就不需要跳转到其他页面进行修改。

#### Acceptance Criteria

1. WHEN 节点详情面板打开时，THE NodeDetailPanel SHALL 将名称字段显示为可编辑的输入框
2. WHEN 节点详情面板打开时，THE NodeDetailPanel SHALL 将描述字段显示为可编辑的文本区域
3. WHEN 用户在名称输入框中输入文本时，THE NodeDetailPanel SHALL 实时更新本地状态
4. WHEN 用户在描述文本区域中输入文本时，THE NodeDetailPanel SHALL 实时更新本地状态
5. WHEN 输入框获得焦点时，THE NodeDetailPanel SHALL 显示视觉反馈（边框高亮）

### Requirement 2: 自动保存机制

**User Story:** 作为用户，我希望在关闭节点详情面板时自动保存我的修改，这样我就不需要手动点击保存按钮。

#### Acceptance Criteria

1. WHEN 用户点击关闭按钮时，THE NodeDetailPanel SHALL 检查节点信息是否有变更
2. WHEN 节点信息有变更时，THE NodeDetailPanel SHALL 调用API保存更新后的节点数据
3. WHEN 保存成功后，THE NodeDetailPanel SHALL 更新全局状态中的节点数据
4. WHEN 保存成功后，THE NodeDetailPanel SHALL 关闭面板
5. IF 保存失败，THEN THE NodeDetailPanel SHALL 显示错误提示并保持面板打开
6. WHEN 用户按ESC键关闭面板时，THE NodeDetailPanel SHALL 执行相同的自动保存流程

### Requirement 3: 图片上传功能

**User Story:** 作为用户，我希望在节点详情面板中直接上传或更新节点的图片，这样我可以快速为节点添加视觉内容。

#### Acceptance Criteria

1. THE NodeDetailPanel SHALL 移除现有的媒体展示区域（图片和视频显示）
2. THE NodeDetailPanel SHALL 在原媒体展示区域位置添加图片上传组件
3. WHEN 节点没有图片时，THE ImageUpload SHALL 显示上传提示区域
4. WHEN 节点已有图片时，THE ImageUpload SHALL 显示当前图片的缩略图
5. WHEN 用户点击上传区域时，THE ImageUpload SHALL 打开文件选择对话框
6. WHEN 用户选择图片文件后，THE ImageUpload SHALL 上传图片到服务器
7. WHEN 图片上传成功后，THE ImageUpload SHALL 更新节点的imageUrl
8. WHEN 节点已有图片时，THE ImageUpload SHALL 显示删除图片按钮
9. WHEN 用户点击删除按钮时，THE ImageUpload SHALL 清除节点的imageUrl

### Requirement 4: 数据验证

**User Story:** 作为系统，我需要验证用户输入的数据，以确保数据的完整性和有效性。

#### Acceptance Criteria

1. WHEN 用户尝试保存空白名称时，THE NodeDetailPanel SHALL 阻止保存并显示错误提示
2. WHEN 用户输入的名称长度超过100个字符时，THE NodeDetailPanel SHALL 显示警告提示
3. WHEN 用户输入的描述长度超过1000个字符时，THE NodeDetailPanel SHALL 显示警告提示
4. WHEN 用户选择的文件不是图片格式时，THE ImageUpload SHALL 拒绝上传并显示错误提示
5. WHEN 用户选择的图片文件大小超过5MB时，THE ImageUpload SHALL 显示警告提示

### Requirement 5: 用户体验优化

**User Story:** 作为用户，我希望编辑过程流畅且有清晰的反馈，这样我可以确信我的操作正在执行。

#### Acceptance Criteria

1. WHEN 保存操作进行中时，THE NodeDetailPanel SHALL 显示加载指示器
2. WHEN 图片上传进行中时，THE ImageUpload SHALL 显示上传进度
3. WHEN 操作成功时，THE NodeDetailPanel SHALL 显示成功提示（可选的toast通知）
4. WHEN 操作失败时，THE NodeDetailPanel SHALL 显示具体的错误信息
5. WHEN 用户有未保存的更改时，THE NodeDetailPanel SHALL 在关闭前显示确认对话框（可选功能）

### Requirement 6: 权限控制

**User Story:** 作为系统管理员，我希望只有授权用户可以编辑节点信息，以保护数据安全。

#### Acceptance Criteria

1. WHEN 用户未登录为管理员时，THE NodeDetailPanel SHALL 将所有字段显示为只读模式
2. WHEN 用户未登录为管理员时，THE ImageUpload SHALL 隐藏上传功能
3. WHEN 用户已登录为管理员时，THE NodeDetailPanel SHALL 启用所有编辑功能
4. WHEN 用户已登录为管理员时，THE ImageUpload SHALL 显示上传和删除功能
