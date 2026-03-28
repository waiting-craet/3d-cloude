# Implementation Plan: 2D to 3D Conversion with Project List Refresh

## Overview

修复"保存并转换为3D后下拉框中项目消失"的问题。主要在GraphStore中添加`refreshProjects`方法,并在WorkflowCanvas的`saveAndConvert`函数中调用该方法,确保跳转前刷新项目列表。

## Tasks

- [x] 1. 在GraphStore中添加refreshProjects方法
  - 在`lib/store.ts`的GraphStore接口中添加`refreshProjects: () => Promise<void>`方法签名
  - 实现refreshProjects方法,调用`/api/projects/with-graphs` API加载最新项目列表
  - 添加缓存控制头(`Cache-Control: no-cache, no-store, must-revalidate`)确保获取最新数据
  - 实现重试机制,最多重试3次,每次重试之间递增延迟(500ms, 1000ms, 1500ms)
  - 如果有currentProject和currentGraph,验证它们是否存在于新加载的数据中
  - 更新GraphStore状态,保持currentProject和currentGraph的选中状态
  - 添加详细的日志输出,便于调试
  - _Requirements: 1.2, 1.3, 2.1, 3.1, 3.2, 3.3_

- [x] 2. 修改WorkflowCanvas的saveAndConvert函数
  - 在`components/WorkflowCanvas.tsx`顶部从useGraphStore中导入refreshProjects方法
  - 在saveAndConvert函数中,数据同步成功后,调用refreshProjects()刷新项目列表
  - 使用try-catch包裹refreshProjects调用,即使刷新失败也继续跳转
  - 添加日志输出,记录刷新项目列表的过程
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 5.2_

- [x] 3. 添加用户反馈状态
  - 在WorkflowCanvas中添加`savingStatus`状态变量
  - 在saveAndConvert的不同阶段更新savingStatus("正在保存到数据库..."、"保存成功！正在刷新数据..."、"即将跳转到3D视图...")
  - 在UI中添加状态提示的显示组件,使用固定定位居中显示
  - 设计美观的提示框样式(白色背景、圆角、阴影、蓝色文字)
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 4. 改进错误处理
  - 在saveAndConvert中,如果Sync API失败,显示错误消息并保持在2D编辑器页面
  - 如果refreshProjects失败,记录错误日志但仍然继续跳转(因为数据已保存)
  - 确保所有错误都有详细的日志输出
  - 在错误发生时,清空savingStatus状态
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. 测试和验证
  - 测试创建新项目和图谱,在2D编辑器中编辑,保存转换,验证下拉框显示
  - 测试编辑现有图谱,保存转换,验证下拉框更新
  - 测试当前图谱保持选中状态
  - 测试重试机制(可以通过添加人工延迟模拟数据库延迟)
  - 测试错误处理(模拟API失败)
  - 测试用户反馈状态的显示
  - 验证缓存控制头是否生效(检查网络请求)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

## Notes

- 所有任务都是核心实现任务,没有标记为可选
- 重点是确保数据一致性和良好的用户体验
- 重试机制很重要,可以处理数据库同步延迟
- 即使刷新项目列表失败,也要继续跳转,因为数据已经保存到数据库
- 添加详细的日志输出,便于调试和监控

