# Requirements Document

## Introduction

本需求文档定义了3D知识图谱视图中相机控制系统的改进。当前系统在水平方向上支持360度旋转，但在垂直方向上存在角度限制（约120度）。本需求旨在实现垂直方向的完全自由旋转，使用户能够从任意角度观察3D场景，包括从正上方和正下方观察。

## Glossary

- **Camera_System**: 3D场景中的相机控制系统，基于Three.js和react-three/fiber实现
- **OrbitControls**: Three.js提供的轨道控制器，用于实现相机的旋转、缩放和平移
- **Polar_Angle**: 极角，表示相机在垂直方向上相对于目标点的角度（0度为正上方，180度为正下方）
- **Azimuth_Angle**: 方位角，表示相机在水平方向上相对于目标点的角度
- **Gimbal_Lock**: 万向节锁，当垂直旋转接近90度或270度时可能出现的旋转异常现象
- **User**: 使用3D知识图谱进行节点查看和交互的用户

## Requirements

### Requirement 1: 移除垂直旋转限制

**User Story:** 作为用户，我希望能够在垂直方向上自由旋转相机360度，以便从任意角度（包括正上方和正下方）观察知识图谱。

#### Acceptance Criteria

1. WHEN 用户拖拽鼠标进行垂直旋转时，THE Camera_System SHALL 允许相机在垂直方向上完整旋转360度
2. WHEN 相机旋转到正上方（极角0度）或正下方（极角180度）时，THE Camera_System SHALL 保持稳定的旋转控制
3. WHEN 相机穿越正上方或正下方位置时，THE Camera_System SHALL 平滑过渡而不出现跳跃或抖动
4. THE Camera_System SHALL 移除当前的 maxPolarAngle 限制配置

### Requirement 2: 保持水平旋转功能

**User Story:** 作为用户，我希望在移除垂直限制后，水平旋转功能仍然正常工作，以确保完整的3D导航体验。

#### Acceptance Criteria

1. WHEN 用户拖拽鼠标进行水平旋转时，THE Camera_System SHALL 继续支持360度水平旋转
2. WHEN 用户同时进行水平和垂直旋转时，THE Camera_System SHALL 正确响应两个方向的输入
3. THE Camera_System SHALL 保持现有的阻尼效果和平滑旋转特性

### Requirement 3: 防止万向节锁问题

**User Story:** 作为用户，我希望在极端角度（如正上方或正下方）旋转时，相机控制仍然直观可用，不会出现异常的旋转行为。

#### Acceptance Criteria

1. WHEN 相机位于正上方或正下方位置时，THE Camera_System SHALL 保持水平旋转的可预测性
2. IF 出现万向节锁现象，THEN THE Camera_System SHALL 通过适当的数学处理避免或最小化其影响
3. WHEN 用户从极端角度旋转回常规角度时，THE Camera_System SHALL 平滑恢复正常的旋转行为

### Requirement 4: 保持现有相机功能

**User Story:** 作为用户，我希望在改进垂直旋转后，其他相机功能（如缩放、平移、聚焦动画）仍然正常工作。

#### Acceptance Criteria

1. WHEN 用户使用鼠标滚轮缩放时，THE Camera_System SHALL 保持现有的缩放功能和距离限制
2. WHEN 用户点击节点时，THE Camera_System SHALL 继续执行平滑的聚焦动画
3. WHEN 用户拖拽节点时，THE Camera_System SHALL 正确禁用轨道控制以避免冲突
4. THE Camera_System SHALL 保持现有的最小距离（20单位）和最大距离（200单位）限制
5. THE Camera_System SHALL 保持现有的阻尼因子（0.05）和平滑效果

### Requirement 5: 性能和稳定性

**User Story:** 作为用户，我希望改进后的相机控制系统性能稳定，不会导致卡顿或渲染问题。

#### Acceptance Criteria

1. WHEN 用户快速旋转相机时，THE Camera_System SHALL 保持流畅的帧率（至少30fps）
2. WHEN 相机处于任意角度时，THE Camera_System SHALL 正确渲染场景中的所有节点和边
3. THE Camera_System SHALL 不引入内存泄漏或性能退化
4. WHEN 场景包含大量节点（100+）时，THE Camera_System SHALL 保持响应性能

### Requirement 6: 用户体验一致性

**User Story:** 作为用户，我希望相机控制的行为符合直觉，与其他3D应用的操作习惯一致。

#### Acceptance Criteria

1. WHEN 用户首次使用360度垂直旋转时，THE Camera_System SHALL 提供直观的操作体验
2. THE Camera_System SHALL 保持与现有水平旋转相同的操作方式（鼠标拖拽）
3. WHEN 相机从下方观察场景时，THE Camera_System SHALL 保持正确的上下方向感知
4. THE Camera_System SHALL 在所有角度下保持一致的旋转速度和灵敏度
