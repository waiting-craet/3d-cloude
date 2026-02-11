# Requirements Document

## Introduction

本规范定义了节点外观编辑功能。当前的节点详情面板中的"修改"按钮会跳转到2D编辑页面。本功能将改变"修改"按钮的行为，点击后在原位置切换到编辑模式，允许用户直接修改节点的颜色和3D形状，并确保在各种形状下节点名称和显示都正常工作。

## Glossary

- **NodeDetailPanel**: 节点详情面板组件，显示在页面右侧的弹窗
- **EditMode**: 编辑模式，点击"修改"按钮后进入的状态，显示颜色和形状编辑器
- **ViewMode**: 查看模式，默认状态，显示节点详细信息
- **ColorPicker**: 颜色选择器，包含拾色器和滑轮控制
- **ShapeSelector**: 形状选择器，提供10种3D形状选项
- **Node3DShape**: 节点的3D形状类型，包括：box（正方体）、rect（长方体）、cylinder（圆柱）、cone（圆锥）、sphere（球）、prism（棱柱）、pyramid（棱锥）、frustum（圆台）、torus（圆环）、arrow（箭头）

## Requirements

### Requirement 1: 编辑模式切换

**User Story:** 作为用户，我希望点击"修改"按钮后在原位置切换到编辑模式，这样我可以快速修改节点外观而不需要跳转页面。

#### Acceptance Criteria

1. WHEN 用户点击"修改"按钮时，THE NodeDetailPanel SHALL 切换到编辑模式
2. WHEN 切换到编辑模式时，THE NodeDetailPanel SHALL 保持相同的位置和大小
3. WHEN 切换到编辑模式时，THE NodeDetailPanel SHALL 将标题从"节点详情"改为"修改节点"
4. WHEN 在编辑模式时，THE NodeDetailPanel SHALL 隐藏原有的名称、描述、图片等字段
5. WHEN 在编辑模式时，THE NodeDetailPanel SHALL 显示颜色选择器和形状选择器

### Requirement 2: 颜色选择功能

**User Story:** 作为用户，我希望使用拾色器和滑轮选择节点颜色，这样我可以精确地自定义节点的视觉外观。

#### Acceptance Criteria

1. THE ColorPicker SHALL 显示当前节点的颜色
2. WHEN 用户点击颜色预览区域时，THE ColorPicker SHALL 打开原生颜色选择器
3. WHEN 用户在颜色选择器中选择颜色时，THE ColorPicker SHALL 实时更新颜色预览
4. THE ColorPicker SHALL 显示色相（Hue）滑轮控制
5. THE ColorPicker SHALL 显示饱和度（Saturation）滑轮控制
6. THE ColorPicker SHALL 显示亮度（Lightness）滑轮控制
7. WHEN 用户调整滑轮时，THE ColorPicker SHALL 实时更新颜色预览
8. THE ColorPicker SHALL 显示当前颜色的十六进制值

### Requirement 3: 形状选择功能

**User Story:** 作为用户，我希望从10种不同的3D形状中选择节点形状，这样我可以用不同的形状表示不同类型的节点。

#### Acceptance Criteria

1. THE ShapeSelector SHALL 显示10种形状选项：正方体、长方体、圆柱、圆锥、球、棱柱、棱锥、圆台、圆环、箭头
2. THE ShapeSelector SHALL 高亮显示当前选中的形状
3. WHEN 用户点击某个形状选项时，THE ShapeSelector SHALL 更新选中状态
4. THE ShapeSelector SHALL 为每个形状显示图标或预览
5. THE ShapeSelector SHALL 为每个形状显示中文名称

### Requirement 4: 形状兼容性保证

**User Story:** 作为系统，我需要确保在切换到各种形状时节点名称和显示都正常工作，以保证用户体验的一致性。

#### Acceptance Criteria

1. WHEN 节点形状为正方体时，THE System SHALL 正确显示节点名称在形状上方
2. WHEN 节点形状为长方体时，THE System SHALL 正确显示节点名称在形状上方
3. WHEN 节点形状为圆柱时，THE System SHALL 正确显示节点名称在形状上方
4. WHEN 节点形状为圆锥时，THE System SHALL 正确显示节点名称在形状上方
5. WHEN 节点形状为球时，THE System SHALL 正确显示节点名称在形状上方
6. WHEN 节点形状为棱柱时，THE System SHALL 正确显示节点名称在形状上方
7. WHEN 节点形状为棱锥时，THE System SHALL 正确显示节点名称在形状上方
8. WHEN 节点形状为圆台时，THE System SHALL 正确显示节点名称在形状上方
9. WHEN 节点形状为圆环时，THE System SHALL 正确显示节点名称在形状上方
10. WHEN 节点形状为箭头时，THE System SHALL 正确显示节点名称在形状上方
11. FOR ALL 形状类型，THE System SHALL 确保节点名称文本清晰可读
12. FOR ALL 形状类型，THE System SHALL 确保节点在3D场景中正确渲染

### Requirement 5: 保存和取消功能

**User Story:** 作为用户，我希望能够保存或取消我的修改，这样我可以控制是否应用更改。

#### Acceptance Criteria

1. THE EditMode SHALL 显示"保存"按钮
2. THE EditMode SHALL 显示"取消"按钮
3. WHEN 用户点击"保存"按钮时，THE NodeDetailPanel SHALL 调用API保存颜色和形状更改
4. WHEN 保存成功后，THE NodeDetailPanel SHALL 更新全局状态中的节点数据
5. WHEN 保存成功后，THE NodeDetailPanel SHALL 切换回查看模式
6. WHEN 用户点击"取消"按钮时，THE NodeDetailPanel SHALL 放弃所有更改
7. WHEN 用户点击"取消"按钮时，THE NodeDetailPanel SHALL 切换回查看模式
8. IF 保存失败，THEN THE NodeDetailPanel SHALL 显示错误提示并保持编辑模式

### Requirement 6: 数据持久化

**User Story:** 作为系统，我需要将节点的形状信息持久化到数据库，以便在重新加载时保持节点的外观。

#### Acceptance Criteria

1. THE System SHALL 在数据库 Node 模型中添加 shape 字段
2. THE shape 字段 SHALL 存储形状类型字符串（box, rect, cylinder, cone, sphere, prism, pyramid, frustum, torus, arrow）
3. THE shape 字段 SHALL 有默认值 "box"
4. WHEN 创建新节点时，THE System SHALL 使用默认形状 "box"
5. WHEN 更新节点形状时，THE System SHALL 保存新的形状值到数据库
6. WHEN 加载节点数据时，THE System SHALL 读取并应用保存的形状

### Requirement 7: UI设计要求

**User Story:** 作为用户，我希望编辑界面美观且易用，这样我可以愉快地自定义节点外观。

#### Acceptance Criteria

1. THE EditMode SHALL 保持与查看模式相同的视觉风格（渐变背景、圆角、阴影）
2. THE ColorPicker SHALL 使用直观的视觉布局
3. THE ShapeSelector SHALL 使用网格布局展示所有形状选项
4. THE ShapeSelector SHALL 为选中的形状显示高亮边框
5. THE 滑轮控制 SHALL 显示当前值的数字标签
6. THE 编辑模式 SHALL 在保存过程中显示加载指示器
7. THE 编辑模式 SHALL 禁用保存按钮直到用户做出更改

### Requirement 8: 权限控制

**User Story:** 作为系统管理员，我希望只有授权用户可以修改节点外观，以保护数据安全。

#### Acceptance Criteria

1. WHEN 用户未登录为管理员时，THE NodeDetailPanel SHALL 隐藏"修改"按钮
2. WHEN 用户已登录为管理员时，THE NodeDetailPanel SHALL 显示"修改"按钮
3. WHEN 用户已登录为管理员时，THE NodeDetailPanel SHALL 允许进入编辑模式

### Requirement 9: 3D渲染更新

**User Story:** 作为用户，我希望在保存后立即看到3D场景中节点外观的变化，这样我可以确认我的修改已生效。

#### Acceptance Criteria

1. WHEN 节点颜色更新后，THE 3D场景 SHALL 立即更新节点的颜色显示
2. WHEN 节点形状更新后，THE 3D场景 SHALL 立即更新节点的形状显示
3. THE 3D场景 SHALL 保持节点的位置不变
4. THE 3D场景 SHALL 保持节点名称标签的显示
5. THE 3D场景 SHALL 平滑过渡到新的外观（可选动画效果）
