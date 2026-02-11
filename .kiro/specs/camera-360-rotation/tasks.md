# Implementation Plan: 3D Camera 360° Vertical Rotation

## Overview

本实现计划将3D相机的垂直旋转限制从120度扩展到完整的360度。实现非常简单，主要是移除 OrbitControls 的 `maxPolarAngle` 配置限制，然后通过测试验证功能正确性和兼容性。

## Tasks

- [x] 1. 移除垂直旋转限制配置
  - 在 `components/KnowledgeGraph.tsx` 中找到 OrbitControls 组件
  - 移除 `maxPolarAngle={Math.PI / 1.5}` 配置行
  - 添加注释说明此修改允许360度垂直旋转
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 编写配置验证单元测试
  - 创建测试文件 `components/__tests__/KnowledgeGraph.camera360.test.tsx`
  - **Property 1: OrbitControls 配置完整性**
  - **Validates: Requirements 1.4, 4.4, 4.5**
  - 验证 OrbitControls 不包含 maxPolarAngle 属性
  - 验证其他配置属性保持不变（dampingFactor: 0.05, minDistance: 20, maxDistance: 200）
  - _Requirements: 1.4, 4.4, 4.5_

- [x] 2. 验证现有功能兼容性
  - 启动开发服务器并进入3D视图
  - 测试相机缩放功能（鼠标滚轮）
  - 测试节点拖拽时控制器禁用
  - 测试节点聚焦动画
  - 确认所有现有功能正常工作
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.1 编写拖拽状态同步测试
  - 在测试文件中添加新的测试用例
  - **Property 2: 拖拽状态同步**
  - **Validates: Requirements 4.3**
  - 模拟 isDragging 状态变化
  - 验证 controlsRef.current.enabled 与 !isDragging 保持一致
  - _Requirements: 4.3_

- [x] 2.2 编写相机动画兼容性测试
  - 在测试文件中添加新的测试用例
  - **Property 3: 相机动画目标位置计算**
  - **Validates: Requirements 4.2**
  - 测试 animateCameraToNode 在不同相机角度下的计算
  - 验证返回的目标位置坐标都是有限数值（无 NaN 或 Infinity）
  - _Requirements: 4.2_

- [ ] 3. 执行360度旋转功能测试
  - 使用鼠标拖拽进行垂直旋转
  - 尝试旋转到正上方（俯视角度）
  - 继续旋转穿越正上方
  - 旋转到正下方（仰视角度）
  - 完成完整的360度垂直循环
  - 验证旋转平滑无跳跃
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. 执行水平旋转兼容性测试
  - 在不同垂直角度下测试水平旋转
  - 在正上方位置进行水平旋转
  - 在正下方位置进行水平旋转
  - 同时进行水平和垂直旋转
  - 验证所有角度下水平旋转都正常
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. 执行极端角度测试
  - 快速拖拽到正上方和正下方
  - 在极限角度停留并尝试继续拖拽
  - 从极限角度快速返回常规角度
  - 验证无异常行为或方向混乱
  - 测试阻尼效果是否平滑
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.1 编写极点位置稳定性测试
  - 在测试文件中添加示例测试
  - **Example 1: 正上方位置稳定性**
  - **Validates: Requirements 1.2**
  - 程序化设置相机到正上方（phi = 0）
  - 验证相机矩阵无 NaN 值
  - **Example 2: 正下方位置稳定性**
  - **Validates: Requirements 1.2**
  - 程序化设置相机到正下方（phi = π）
  - 验证相机矩阵无 NaN 值
  - _Requirements: 1.2_

- [ ] 6. 执行聚焦动画测试
  - 将相机旋转到正上方
  - 点击节点触发聚焦动画
  - 验证动画平滑完成
  - 将相机旋转到正下方
  - 再次点击节点触发聚焦动画
  - 验证动画在所有角度下都正常
  - _Requirements: 4.2_

- [ ] 7. 执行性能测试
  - 加载包含多个节点的图谱（建议50+节点）
  - 快速连续旋转相机（水平和垂直）
  - 观察浏览器开发者工具中的帧率
  - 验证帧率保持在30fps以上
  - 检查控制台无错误或警告
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Checkpoint - 确保所有测试通过 ✅
  - ✅ 运行所有自动化测试：`npm test`
  - ✅ 确认所有单元测试通过 (13/13 tests passing)
  - ⏳ 手动测试场景待验证 (tasks 3-7)
  - 所有自动化测试已通过，准备进行手动测试

- [ ] 9. 最终验证和文档更新
  - 再次验证所有需求的验收标准
  - 确认无回归问题
  - 如需要，更新相关文档或注释
  - 准备提交代码变更
  - _Requirements: 所有需求_

## Notes

- 所有任务都是必需的，包括自动化测试和手动测试
- 核心修改非常简单（仅一行代码），但需要充分的测试验证
- 手动测试是验证3D交互和视觉效果的主要方法
- 如果在任何阶段发现问题，可以快速回滚到原始配置
- 每个任务都标注了对应的需求编号，便于追溯
