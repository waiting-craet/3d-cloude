# Implementation Plan: 3D Node Interaction Optimization

## Overview

本实现计划将3D节点交互优化功能分解为可执行的编码任务。实现将分为三个主要阶段:摄像机聚焦优化、billboard文本效果和测试验证。每个任务都引用了相应的需求,确保完整的可追溯性。

## Tasks

- [ ] 1. 实现摄像机聚焦核心功能
  - [x] 1.1 创建距离计算函数
    - 在KnowledgeGraph.tsx中实现calculateOptimalDistance函数
    - 使用透视投影公式计算最佳观察距离
    - 应用最小/最大距离限制(5-50单位)
    - 处理节点大小为0或未定义的情况(使用默认值1.5)
    - _Requirements: 1.1, 1.3, 5.2, 5.3, 5.4_

  - [ ]* 1.2 编写距离计算函数的属性测试
    - **Property 3: 距离随节点大小缩放**
    - **Property 15: 最小距离限制**
    - **Property 16: 最大距离限制**
    - **Validates: Requirements 1.1, 1.3, 5.3, 5.4**

  - [x] 1.3 实现动画状态管理
    - 定义AnimationState接口和状态变量
    - 实现cancelCurrentAnimation函数清理动画资源
    - 添加动画状态初始化逻辑
    - _Requirements: 2.5_

  - [x] 1.4 实现缓动函数
    - 创建easeInOutCubic缓动函数
    - 确保函数满足边界条件(f(0)=0, f(1)=1)
    - _Requirements: 2.1, 2.4_

  - [ ]* 1.5 编写缓动函数的单元测试和属性测试
    - **Property 5: 缓动函数特性**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 1.6 实现摄像机聚焦动画函数
    - 创建animateCameraToNode函数
    - 计算目标摄像机位置(保持当前观察方向)
    - 根据移动距离选择动画时长(短距离600ms,长距离1000ms)
    - 实现动画循环,使用requestAnimationFrame
    - 应用缓动函数实现平滑移动
    - 更新摄像机位置和控制器目标
    - _Requirements: 1.2, 1.5, 2.2, 2.3, 2.6_

  - [ ]* 1.7 编写摄像机聚焦的属性测试
    - **Property 2: 聚焦后节点居中**
    - **Property 4: 摄像机方向保持**
    - **Property 6: 短距离动画时长**
    - **Property 7: 长距离动画时长**
    - **Property 8: 动画完成位置精确性**
    - **Validates: Requirements 1.2, 1.5, 2.2, 2.3, 2.6**

  - [x] 1.8 集成聚焦功能到节点点击处理
    - 在GraphNodes.tsx的handleNodeClick中调用animateCameraToNode
    - 替换现有的简单相机移动逻辑
    - 添加节点数据验证(检查NaN和Infinity)
    - _Requirements: 1.1, 5.6_

- [x] 2. Checkpoint - 测试摄像机聚焦功能
  - 确保距离计算测试通过
  - 确保动画功能正常工作
  - 在浏览器中手动测试点击不同大小的节点
  - 如有问题请向用户反馈

- [ ] 3. 实现Billboard文本效果
  - [x] 3.1 创建billboard旋转计算函数
    - 在GraphNodes.tsx中实现updateTextRotation函数
    - 计算从文本到摄像机的方向向量
    - 保持Y轴垂直(避免文字倒置)
    - 应用平滑插值(smoothFactor: 0.15)
    - 处理角度环绕问题(-π到π)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 3.2 实现billboard更新优化
    - 创建shouldUpdateBillboard函数
    - 仅在摄像机位置变化超过阈值(0.1单位)时更新
    - 使用useRef缓存上次摄像机位置
    - _Requirements: 4.3_

  - [x] 3.3 集成billboard到Node组件
    - 为Text组件添加ref
    - 在useFrame钩子中调用updateTextRotation
    - 应用shouldUpdateBillboard优化
    - 确保billboard效果独立于节点状态(选中/悬停)
    - _Requirements: 3.4, 3.6_

  - [ ]* 3.4 编写billboard功能的属性测试
    - **Property 9: Billboard文本面向摄像机**
    - **Property 10: Billboard保持垂直**
    - **Property 11: 多节点Billboard一致性**
    - **Property 12: Billboard旋转平滑性**
    - **Property 13: Billboard独立于节点状态**
    - **Property 14: Billboard更新优化**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3**

- [x] 4. Checkpoint - 测试Billboard效果
  - 确保billboard测试通过
  - 在浏览器中从不同角度观察节点文本
  - 验证文本始终可读且不倒置
  - 如有问题请向用户反馈

- [ ] 5. 添加错误处理和边界情况
  - [x] 5.1 实现节点数据验证函数
    - 创建validateNodeData函数
    - 检查坐标是否为有限数值
    - 检查大小是否有效,无效时使用默认值
    - 记录错误到控制台
    - _Requirements: 5.2, 5.6_

  - [x] 5.2 添加安全包装函数
    - 创建safeAnimateCameraToNode包装函数
    - 添加try-catch错误捕获
    - 实现回退到默认摄像机位置的逻辑
    - 创建safeUpdateTextRotation包装函数
    - _Requirements: 5.5_

  - [ ]* 5.3 编写边界情况的单元测试
    - 测试节点大小为0或undefined的处理
    - 测试NaN和Infinity坐标的处理
    - 测试动画取消逻辑
    - _Requirements: 5.2, 5.6_

- [ ] 6. 性能优化和最终调整
  - [x] 6.1 优化动画性能
    - 确认使用requestAnimationFrame
    - 验证动画取消逻辑防止队列堆积
    - 添加性能监控日志(可选)
    - _Requirements: 4.2, 4.5_

  - [x] 6.2 调整配置参数
    - 创建DEFAULT_CAMERA_FOCUS_CONFIG常量
    - 创建DEFAULT_BILLBOARD_CONFIG常量
    - 允许通过props覆盖配置(可选)
    - _Requirements: 1.1, 3.5, 4.3_

  - [x] 6.3 代码清理和文档
    - 添加JSDoc注释到所有公共函数
    - 移除调试日志或添加条件编译
    - 确保代码符合项目风格指南
    - _Requirements: All_

- [x] 7. 最终Checkpoint - 完整功能验证
  - 运行所有单元测试和属性测试
  - 在浏览器中进行完整的交互测试
  - 测试大量节点(50+)的性能
  - 验证所有需求都已实现
  - 如有问题请向用户反馈

## Notes

- 标记为`*`的任务是可选的测试任务,可以跳过以加快MVP开发
- 每个任务都引用了具体的需求编号,确保可追溯性
- Checkpoint任务提供了验证和反馈的机会
- 属性测试使用fast-check库,每个测试至少运行100次
- 单元测试使用Jest和React Testing Library
- 实现语言: TypeScript (React Three Fiber)
