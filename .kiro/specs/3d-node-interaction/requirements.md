# Requirements Document

## Introduction

本文档定义了3D知识图谱节点交互优化功能的需求。该功能旨在改善用户在3D空间中与节点交互的体验,包括优化摄像机聚焦行为和节点文本标签的显示方式。

## Glossary

- **Node_Sphere**: 3D空间中代表知识节点的球体对象
- **Camera**: Three.js场景中的透视相机,用于观察3D场景
- **Billboard_Text**: 始终面向摄像机的文本标签,无论摄像机角度如何变化
- **Focus_Animation**: 当用户点击节点时,摄像机平滑移动到最佳观察位置的动画效果
- **Viewport**: 用户可见的屏幕区域
- **Screen_Coverage**: 节点球体在屏幕上占据的面积比例

## Requirements

### Requirement 1: 优化摄像机聚焦行为

**User Story:** 作为用户,我希望点击节点时摄像机能够智能地移动到最佳观察位置,使选中的节点清晰可见且占据合适的屏幕空间,以便我能够专注于该节点的详细信息。

#### Acceptance Criteria

1. WHEN 用户点击一个节点球体 THEN THE Camera SHALL 计算最佳观察距离使节点球体占据屏幕高度的40-50%
2. WHEN 摄像机移动到聚焦位置 THEN THE Camera SHALL 将节点球体定位在视口中心
3. WHEN 计算摄像机位置 THEN THE System SHALL 考虑节点的大小属性(size)来调整观察距离
4. WHEN 多个节点具有不同大小 THEN THE Camera SHALL 根据每个节点的实际大小动态调整聚焦距离
5. WHEN 摄像机聚焦到节点 THEN THE Camera SHALL 保持当前的观察角度方向,仅调整距离和目标点

### Requirement 2: 改进摄像机移动动画

**User Story:** 作为用户,我希望摄像机移动动画更加流畅自然,让我在切换关注不同节点时获得舒适的视觉体验。

#### Acceptance Criteria

1. WHEN 摄像机开始移动 THEN THE Focus_Animation SHALL 使用缓动函数实现平滑的加速和减速效果
2. WHEN 摄像机移动距离较短(小于20单位) THEN THE Focus_Animation SHALL 持续时间为600毫秒
3. WHEN 摄像机移动距离较长(大于等于20单位) THEN THE Focus_Animation SHALL 持续时间为1000毫秒
4. WHEN 动画执行过程中 THEN THE Focus_Animation SHALL 使用easeInOutCubic缓动函数提供自然的运动曲线
5. WHEN 用户在动画执行期间点击另一个节点 THEN THE System SHALL 取消当前动画并开始新的聚焦动画
6. WHEN 摄像机移动动画完成 THEN THE Camera SHALL 精确停留在目标位置,无抖动或偏移

### Requirement 3: 节点文本标签始终面向摄像机

**User Story:** 作为用户,我希望节点名称标签始终正面朝向我,无论我从哪个角度观察,以便我能够清晰地阅读所有节点的名称。

#### Acceptance Criteria

1. WHEN 摄像机位置或角度发生变化 THEN THE Billboard_Text SHALL 实时旋转以面向摄像机
2. WHEN 渲染每一帧 THEN THE Billboard_Text SHALL 计算从文本到摄像机的方向向量并相应旋转
3. WHEN 文本旋转时 THEN THE Billboard_Text SHALL 保持垂直方向(Y轴)始终向上,避免文字倒置
4. WHEN 多个节点同时可见 THEN THE System SHALL 为所有可见节点的文本标签应用billboard效果
5. WHEN 用户旋转视角 THEN THE Billboard_Text SHALL 平滑过渡到新的朝向,无突兀的跳跃
6. WHEN 节点被选中或悬停 THEN THE Billboard_Text SHALL 保持billboard效果的同时显示高亮样式

### Requirement 4: 性能优化

**User Story:** 作为用户,我希望交互响应迅速且流畅,即使在包含大量节点的图谱中也能保持良好的性能。

#### Acceptance Criteria

1. WHEN 场景包含超过50个节点 THEN THE System SHALL 保持至少30 FPS的帧率
2. WHEN 执行摄像机聚焦动画 THEN THE System SHALL 使用requestAnimationFrame优化动画性能
3. WHEN 更新billboard文本方向 THEN THE System SHALL 仅在摄像机位置实际变化时重新计算旋转
4. WHEN 计算摄像机目标位置 THEN THE System SHALL 缓存中间计算结果避免重复计算
5. WHEN 用户快速连续点击多个节点 THEN THE System SHALL 取消未完成的动画,避免动画队列堆积

### Requirement 5: 边界情况处理

**User Story:** 作为用户,我希望系统能够妥善处理各种特殊情况,确保交互始终可靠稳定。

#### Acceptance Criteria

1. WHEN 节点位于场景边界 THEN THE Camera SHALL 调整聚焦位置避免超出场景范围
2. WHEN 节点大小为0或未定义 THEN THE System SHALL 使用默认大小值(1.5)进行计算
3. WHEN 摄像机距离节点过近(小于最小距离) THEN THE System SHALL 限制最小观察距离为5单位
4. WHEN 摄像机距离节点过远(大于最大距离) THEN THE System SHALL 限制最大观察距离为50单位
5. IF 聚焦动画计算失败 THEN THE System SHALL 回退到默认的摄像机位置
6. WHEN 节点坐标包含NaN或Infinity THEN THE System SHALL 记录错误并跳过该节点的聚焦操作
