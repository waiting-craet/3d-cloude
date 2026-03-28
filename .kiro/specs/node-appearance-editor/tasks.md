# Implementation Plan: Node Appearance Editor

## Overview

本实现计划将节点详情面板的"修改"按钮改造为模式切换功能，允许用户直接在面板中编辑节点的颜色和3D形状。实现将分为5个主要阶段，每个阶段都包含核心功能实现和相应的测试任务。

## Tasks

- [x] 1. 数据库和API准备
  - 在 `prisma/schema.prisma` 中的 Node 模型添加 shape 字段
  - 设置默认值为 "box"
  - 运行数据库迁移：`npx prisma migrate dev --name add_node_shape`
  - 更新 `app/api/nodes/[id]/route.ts` 的 PATCH 方法支持 shape 字段
  - 确保向后兼容（shape 为可选字段）
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]* 1.1 编写 API 更新测试
  - 测试 PATCH 请求可以更新 shape 字段
  - 测试 shape 为 undefined 时不影响其他字段
  - _Requirements: 6.5_

- [x] 2. 更新全局状态管理
  - 验证 `lib/store.ts` 中的 `updateNodeLocal` 方法支持 shape 字段
  - 如需要，更新类型定义以包含 shape
  - _Requirements: 5.4, 6.6_

- [ ]* 2.1 编写状态更新测试
  - 测试 updateNodeLocal 正确更新 shape 字段
  - 测试更新后 selectedNode 反映新的 shape 值
  - _Requirements: 5.4_

- [x] 3. 创建 ColorPicker 组件
  - 创建 `components/ColorPicker.tsx` 文件
  - 实现颜色预览区域
  - 实现原生颜色选择器（type="color"）
  - 实现 HSL 滑轮控制（色相、饱和度、亮度）
  - 实现十六进制值显示
  - 实现 hex ↔ HSL 转换函数
  - 支持 disabled 状态
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]* 3.1 编写 ColorPicker 单元测试
  - 测试组件正确渲染
  - 测试颜色预览显示当前颜色
  - 测试 HSL 滑轮更新颜色
  - 测试十六进制值正确显示
  - _Requirements: 2.1, 2.3, 2.8_

- [ ]* 3.2 编写颜色转换测试
  - **Property 5: 颜色十六进制转换正确性**
  - **Validates: Requirements 2.8**
  - 对于任何颜色值，验证 hex 和 HSL 转换的正确性
  - _Requirements: 2.8_

- [x] 4. 创建 ShapeSelector 组件
  - 创建 `components/ShapeSelector.tsx` 文件
  - 定义 10 种形状的配置（id, name, icon）
  - 实现网格布局（2列）
  - 实现形状选项按钮
  - 实现选中状态高亮显示
  - 实现点击选择功能
  - 支持 disabled 状态
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 编写 ShapeSelector 单元测试
  - 测试显示 10 种形状选项
  - 测试选中状态高亮
  - 测试点击更新选中状态
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Checkpoint - 确保组件测试通过
  - 运行所有测试确保新组件工作正常
  - 如有问题请向用户询问

- [x] 6. 修改 NodeDetailPanel - 添加编辑模式状态
  - 在 `components/NodeDetailPanel.tsx` 中添加编辑模式状态
  - 添加 `isEditMode`、`editedColor`、`editedShape` 状态
  - 在组件加载时初始化编辑状态（从 selectedNode 读取）
  - _Requirements: 1.1, 1.2_

- [x] 7. 修改 NodeDetailPanel - 实现模式切换
  - 修改 `handleEdit` 函数，不再跳转到 2D 页面
  - 改为切换到编辑模式（setIsEditMode(true)）
  - 初始化 editedColor 和 editedShape
  - 根据 isEditMode 条件渲染不同的内容
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ]* 7.1 编写模式切换测试
  - **Property 1: 编辑模式切换状态一致性**
  - **Validates: Requirements 1.1, 1.2**
  - 测试点击修改按钮切换到编辑模式
  - 测试面板位置和大小保持不变
  - _Requirements: 1.1, 1.2_

- [ ]* 7.2 编写UI元素可见性测试
  - **Property 2: 编辑模式UI元素可见性**
  - **Validates: Requirements 1.4, 1.5**
  - 测试编辑模式隐藏查看模式字段
  - 测试编辑模式显示颜色和形状选择器
  - _Requirements: 1.4, 1.5_

- [x] 8. 修改 NodeDetailPanel - 集成编辑组件
  - 在编辑模式下渲染 ColorPicker 组件
  - 在编辑模式下渲染 ShapeSelector 组件
  - 传递正确的 props（value, onChange, disabled）
  - 更新标题为"修改节点"
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 3.2_

- [x] 9. 实现保存和取消功能
  - 实现 `handleSaveAppearance` 函数
  - 调用 PATCH API 保存 color 和 shape
  - 处理保存成功：更新全局状态，切换回查看模式
  - 处理保存失败：显示错误提示，保持编辑模式
  - 实现 `handleCancelEdit` 函数
  - 放弃更改，恢复原始值，切换回查看模式
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ]* 9.1 编写保存操作测试
  - **Property 10: 保存操作触发API调用**
  - **Validates: Requirements 5.3**
  - 测试点击保存按钮调用 API
  - _Requirements: 5.3_

- [ ]* 9.2 编写保存成功状态更新测试
  - **Property 11: 保存成功后状态更新**
  - **Validates: Requirements 5.4**
  - 测试保存成功后全局状态更新
  - _Requirements: 5.4_

- [ ]* 9.3 编写模式切换测试
  - **Property 12: 保存或取消后模式切换**
  - **Validates: Requirements 5.5, 5.7**
  - 测试保存成功后切换回查看模式
  - 测试取消后切换回查看模式
  - _Requirements: 5.5, 5.7_

- [ ]* 9.4 编写取消操作测试
  - **Property 13: 取消操作放弃更改**
  - **Validates: Requirements 5.6**
  - 测试取消后恢复原始值
  - _Requirements: 5.6_

- [x] 10. 修改编辑模式的按钮区域
  - 在编辑模式下显示"保存"和"取消"按钮
  - 隐藏"修改"和"删除"按钮
  - 添加保存中的加载状态
  - 保存中禁用所有按钮和输入
  - _Requirements: 5.1, 5.2_

- [x] 11. Checkpoint - 确保面板功能测试通过
  - 运行所有测试确保面板功能正常
  - 手动测试模式切换、保存、取消流程
  - 如有问题请向用户询问

- [x] 12. 创建几何体工厂函数
  - 在 `components/GraphNodes.tsx` 中创建 `createGeometry` 函数
  - 为每种形状类型创建对应的 Three.js 几何体
  - box: BoxGeometry
  - rect: BoxGeometry (不同比例)
  - cylinder: CylinderGeometry
  - cone: ConeGeometry
  - sphere: SphereGeometry
  - prism: CylinderGeometry (6边)
  - pyramid: ConeGeometry (4边)
  - frustum: CylinderGeometry (不同半径)
  - torus: TorusGeometry
  - arrow: 组合 CylinderGeometry + ConeGeometry
  - _Requirements: 4.1-4.10, 4.12_

- [ ]* 12.1 编写几何体创建测试
  - **Property 9: 所有形状的3D渲染成功**
  - **Validates: Requirements 4.12**
  - 对于每种形状，测试几何体创建成功
  - 测试不会抛出错误
  - _Requirements: 4.12_

- [x] 13. 创建文本位置计算函数
  - 在 `components/GraphNodes.tsx` 中创建 `getTextYPosition` 函数
  - 为每种形状计算合适的文本Y位置
  - 确保文本在形状上方且不重叠
  - _Requirements: 4.1-4.10_

- [ ]* 13.1 编写文本位置测试
  - **Property 8: 所有形状的文本位置正确性**
  - **Validates: Requirements 4.1-4.10**
  - 对于每种形状和不同尺寸，测试文本位置正确
  - 测试文本Y位置大于形状顶部
  - _Requirements: 4.1-4.10_

- [x] 14. 修改 Node 组件支持多种形状
  - 读取 node.shape 字段（默认 'box'）
  - 使用 createGeometry 函数创建几何体
  - 使用 getTextYPosition 函数计算文本位置
  - 确保其他功能（悬停、选中、拖拽）正常工作
  - _Requirements: 4.1-4.12, 6.6_

- [ ] 15. 测试所有形状的渲染
  - 手动测试每种形状的渲染效果
  - 验证节点名称在所有形状下正确显示
  - 验证悬停和选中效果正常
  - 验证拖拽功能正常
  - _Requirements: 4.1-4.12_

- [ ] 16. Checkpoint - 确保3D渲染测试通过
  - 运行所有测试确保3D渲染正常
  - 如有问题请向用户询问

- [ ] 17. 实现3D场景更新响应
  - 验证保存后 3D 场景立即更新颜色和形状
  - 验证节点位置保持不变
  - 验证节点名称标签继续显示
  - 可选：添加形状切换的平滑过渡动画
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 17.1 编写3D场景更新测试
  - **Property 18: 3D场景外观更新响应性**
  - **Validates: Requirements 9.1, 9.2**
  - 测试颜色更新后3D场景反映新颜色
  - 测试形状更新后3D场景反映新形状
  - _Requirements: 9.1, 9.2_

- [ ]* 17.2 编写位置不变性测试
  - **Property 19: 3D场景位置不变性**
  - **Validates: Requirements 9.3**
  - 测试外观更新后节点位置不变
  - _Requirements: 9.3_

- [ ]* 17.3 编写名称标签持久性测试
  - **Property 20: 3D场景名称标签持久性**
  - **Validates: Requirements 9.4**
  - 测试外观更新后名称标签继续显示
  - _Requirements: 9.4_

- [ ] 18. 验证权限控制
  - 测试非管理员模式下"修改"按钮隐藏
  - 测试管理员模式下"修改"按钮显示
  - 测试管理员可以进入编辑模式
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 18.1 编写权限控制测试
  - **Property 17: 权限控制UI可见性**
  - **Validates: Requirements 8.1-8.3**
  - 测试管理员和非管理员的按钮可见性
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 19. 集成测试 - 完整编辑流程
  - 测试打开面板 → 点击修改 → 编辑颜色和形状 → 保存的完整流程
  - 验证数据正确保存到数据库
  - 验证全局状态正确更新
  - 验证3D场景正确更新
  - 验证切换回查看模式
  - _Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.5, 5.3-5.5, 9.1-9.4_

- [ ]* 19.1 集成测试 - 取消编辑流程
  - 测试打开面板 → 点击修改 → 编辑 → 取消的流程
  - 验证更改被放弃
  - 验证切换回查看模式
  - _Requirements: 5.6, 5.7_

- [ ]* 19.2 集成测试 - 保存失败处理
  - 测试保存失败时的错误处理
  - 验证显示错误提示
  - 验证保持在编辑模式
  - _Requirements: 5.8_

- [ ]* 19.3 编写形状数据持久化测试
  - **Property 16: 形状数据持久化round-trip**
  - **Validates: Requirements 6.5, 6.6**
  - 测试保存形状后重新加载得到相同值
  - _Requirements: 6.5, 6.6_

- [ ] 20. 最终验证和优化
  - 手动测试所有功能
  - 检查用户体验和视觉反馈
  - 优化性能（如有需要）
  - 确保向后兼容性
  - 验证所有10种形状都正常工作

## Notes

- 任务标记 `*` 的为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- 属性测试使用 fast-check 库，每个测试运行最少 100 次迭代
- 在 Checkpoint 任务处暂停，确保增量验证
- 10种形状：box（正方体）、rect（长方体）、cylinder（圆柱）、cone（圆锥）、sphere（球）、prism（棱柱）、pyramid（棱锥）、frustum（圆台）、torus（圆环）、arrow（箭头）
- 保留现有的查看模式功能，确保向后兼容
