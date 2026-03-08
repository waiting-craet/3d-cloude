# 实施计划 - 导入页面莫兰蒂色彩重新设计

## 概述

本实施计划将导入数据页面(app/import/page.tsx)重新设计为莫兰蒂色系风格,参考创建页面的设计语言。此次重新设计仅涉及视觉呈现层面,不修改任何现有功能逻辑。实施将采用增量方式,每个任务专注于特定的UI组件,确保功能完整性保持不变。

## 任务

- [x] 1. 定义莫兰蒂色系调色板和视觉效果配置
  - 在app/import/page.tsx文件顶部(ImportPage函数之前)添加MorandiColors对象
  - 在app/import/page.tsx文件顶部(ImportPage函数之前)添加InkWashEffects对象
  - 确保所有颜色值和视觉效果常量与创建页面保持一致
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 编写颜色配置完整性属性测试
  - **属性 1: 颜色配置完整性**
  - **验证: 需求 1.3, 1.4**
  - 创建app/import/__tests__/import-page.color-config.property.test.tsx
  - 使用fast-check验证MorandiColors包含所有必需的颜色属性
  - 使用fast-check验证InkWashEffects包含所有必需的视觉效果属性
  - 最小迭代次数: 100次
  - _需求: 1.3, 1.4_

- [x] 2. 更新页面主容器和导航栏样式
  - [x] 2.1 更新页面主容器背景
    - 修改main元素的background属性为InkWashEffects.pageGradient
    - 保持所有其他样式属性不变
    - _需求: 1.1, 1.5, 10.1_

  - [x] 2.2 更新导航栏样式
    - 修改nav元素的background为InkWashEffects.navGradient
    - 添加backdropFilter为InkWashEffects.backdropBlur
    - 修改borderBottom颜色为莫兰蒂色系
    - 修改boxShadow为InkWashEffects.softShadow
    - 修改品牌标识颜色为MorandiColors.sageGreen
    - 修改品牌标识背景为鼠尾草绿到黛绿色的渐变
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1_

- [x] 3. 更新选择器和按钮样式
  - [x] 3.1 更新项目选择器样式
    - 修改选择器容器background为InkWashEffects.cardGradient
    - 修改选择器容器border为MorandiColors.warmGray
    - 修改选择器容器borderRadius为InkWashEffects.smallRadius
    - 修改选择器容器boxShadow为InkWashEffects.softShadow
    - 修改select元素background为MorandiColors.softWhite
    - 修改select元素border为MorandiColors.warmGray
    - 修改select元素color为MorandiColors.charcoal
    - _需求: 3.1, 10.2, 10.4, 10.5_

  - [x] 3.2 更新图谱选择器样式
    - 修改选择器容器background为InkWashEffects.cardGradient
    - 修改选择器容器border为MorandiColors.warmGray
    - 修改选择器容器borderRadius为InkWashEffects.smallRadius
    - 修改选择器容器boxShadow为InkWashEffects.softShadow
    - 修改select元素background为MorandiColors.softWhite
    - 修改select元素border为MorandiColors.warmGray
    - 修改select元素color为MorandiColors.charcoal
    - _需求: 3.2, 10.2, 10.4, 10.5_

  - [x] 3.3 更新新建按钮样式
    - 修改新建项目按钮background为MorandiColors.sageGreen
    - 修改新建图谱按钮background为MorandiColors.sageGreen
    - 修改按钮borderRadius为InkWashEffects.smallRadius
    - 修改按钮boxShadow为InkWashEffects.softShadow
    - 添加悬停状态,background变为MorandiColors.sageGreenHover
    - _需求: 3.3, 3.4, 3.6, 10.3, 10.4, 10.5_

  - [ ]* 3.4 编写按钮悬停效果单元测试
    - 创建app/import/__tests__/import-page.button-hover.test.tsx
    - 测试新建按钮悬停时背景颜色变化
    - 测试生成图谱按钮悬停时背景颜色变化
    - 测试模板下载按钮悬停时背景颜色变化
    - _需求: 3.4, 5.3_

  - [x] 3.5 更新生成图谱按钮样式
    - 修改启用状态background为MorandiColors.sageGreen
    - 修改禁用状态background为MorandiColors.warmGray
    - 修改启用状态color为white
    - 修改禁用状态color为MorandiColors.charcoal
    - 修改borderRadius为InkWashEffects.mediumRadius
    - 修改启用状态boxShadow为InkWashEffects.softShadow
    - 添加悬停状态(启用时),background变为MorandiColors.sageGreenHover
    - _需求: 3.5, 3.6, 10.3, 10.4, 10.5_

- [x] 4. 更新文件类型卡片样式
  - [x] 4.1 更新文件类型卡片基础样式
    - 修改卡片background为InkWashEffects.cardGradient
    - 修改未选中状态border为MorandiColors.warmGray
    - 修改选中状态border为MorandiColors.sageGreen(2px)
    - 修改borderRadius为InkWashEffects.mediumRadius
    - 修改boxShadow为InkWashEffects.cardShadow
    - 修改文本color为MorandiColors.charcoal
    - _需求: 4.1, 4.2, 4.3, 4.5, 10.2, 10.4, 10.5_

  - [x] 4.2 添加文件类型卡片悬停效果
    - 添加悬停状态,borderColor变为MorandiColors.sageGreenHover
    - 添加悬停状态,transform为translateY(-2px)
    - _需求: 4.4_

  - [ ]* 4.3 编写文件卡片交互单元测试
    - 创建app/import/__tests__/import-page.file-card.test.tsx
    - 测试文件选中时边框颜色变化
    - 测试文件卡片悬停时边框颜色变化
    - _需求: 4.3, 4.4_

- [x] 5. 更新模板下载区域样式
  - [x] 5.1 更新模板下载按钮样式
    - 修改按钮background为MorandiColors.sageGreen
    - 修改按钮color为white
    - 修改按钮border为MorandiColors.warmGray
    - 修改按钮borderRadius为InkWashEffects.smallRadius
    - 修改按钮boxShadow为InkWashEffects.softShadow
    - 添加悬停状态,background变为MorandiColors.sageGreenHover
    - _需求: 5.1, 5.2, 5.3, 5.5, 10.3, 10.4, 10.5_

  - [x] 5.2 更新模板下载区域容器样式
    - 修改容器background为白色(与主内容区一致)
    - 修改容器border样式与主内容区保持一致
    - _需求: 5.4_

- [x] 6. 更新模态框样式
  - [x] 6.1 更新模态框遮罩层样式
    - 修改所有模态框遮罩层background为InkWashEffects.modalOverlay
    - 添加backdropFilter为InkWashEffects.backdropBlur
    - 包括: 新建项目模态框、新建图谱模态框、确认导入模态框、加载模态框
    - _需求: 6.5_

  - [x] 6.2 更新模态框容器样式
    - 修改所有模态框容器background为InkWashEffects.modalGradient
    - 修改borderRadius为InkWashEffects.largeRadius
    - 修改boxShadow为InkWashEffects.modalShadow
    - 修改标题color为MorandiColors.charcoal
    - 包括: 新建项目模态框、新建图谱模态框、确认导入模态框
    - _需求: 6.1, 6.2, 6.3, 10.2, 10.4, 10.5_

  - [x] 6.3 更新模态框输入框样式
    - 修改输入框background为MorandiColors.softWhite
    - 修改输入框border为MorandiColors.warmGray
    - 修改输入框borderRadius为InkWashEffects.smallRadius
    - 修改输入框color为MorandiColors.charcoal
    - 添加聚焦状态,borderColor变为MorandiColors.sageGreen
    - 添加聚焦状态,boxShadow为鼠尾草绿色的外发光效果
    - _需求: 6.7, 10.4_

  - [ ]* 6.4 编写输入框聚焦高亮单元测试
    - 创建app/import/__tests__/import-page.input-focus.test.tsx
    - 测试模态框输入框聚焦时边框颜色变化
    - 测试模态框输入框聚焦时阴影效果
    - _需求: 6.7_

  - [x] 6.5 更新模态框按钮样式
    - 修改确认按钮background为MorandiColors.sageGreen
    - 修改确认按钮color为white
    - 修改确认按钮boxShadow为InkWashEffects.softShadow
    - 修改取消按钮background为MorandiColors.warmGray
    - 修改取消按钮color为MorandiColors.charcoal
    - 包括: 新建项目模态框、新建图谱模态框、确认导入模态框
    - _需求: 6.6, 10.3, 10.5_

- [x] 7. 更新加载模态框和动画样式
  - [x] 7.1 更新加载模态框遮罩层
    - 修改遮罩层background为InkWashEffects.loadingOverlay
    - 添加backdropFilter为InkWashEffects.backdropBlur
    - _需求: 6.4, 6.5_

  - [x] 7.2 更新加载动画样式
    - 修改加载动画border(轨道)为MorandiColors.paleGreen
    - 修改加载动画borderTop(旋转部分)为MorandiColors.sageGreen
    - 确保旋转动画保持平滑
    - _需求: 8.1, 8.2, 8.3_

  - [ ]* 7.3 编写加载动画存在性单元测试
    - 创建app/import/__tests__/import-page.loading-animation.test.tsx
    - 测试加载模态框包含旋转动画的CSS定义
    - _需求: 8.3_

  - [x] 7.4 更新加载模态框统计信息卡片样式
    - 修改统计卡片容器background为InkWashEffects.cardGradient
    - 修改统计卡片容器borderRadius为InkWashEffects.mediumRadius
    - 修改统计卡片容器border为MorandiColors.warmGray
    - 修改统计卡片容器boxShadow为InkWashEffects.cardShadow
    - 修改文件节点数卡片background为MorandiColors.softWhite
    - 修改冗余节点卡片background为MorandiColors.paleGreen
    - 修改冗余节点卡片color为MorandiColors.warningAmber
    - 修改导入节点卡片background为MorandiColors.paleGreen
    - 修改导入节点卡片color为MorandiColors.successGreen
    - _需求: 8.4, 10.2, 10.4, 10.5_

- [x] 8. 更新状态提示样式
  - [x] 8.1 更新状态提示消息样式
    - 修改成功状态background为MorandiColors.successGreen
    - 修改成功状态color为MorandiColors.darkGreen
    - 修改警告状态background为MorandiColors.warningAmber
    - 修改警告状态color为MorandiColors.charcoal
    - 修改错误状态background为MorandiColors.errorRose
    - 修改错误状态color为MorandiColors.charcoal
    - 修改borderRadius为InkWashEffects.smallRadius
    - 修改boxShadow为InkWashEffects.softShadow
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 10.4, 10.5_

- [x] 9. 验证功能完整性和样式一致性
  - [x] 9.1 运行现有测试套件
    - 运行所有现有的导入页面测试
    - 确保所有测试通过,功能保持不变
    - _需求: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 9.2 编写功能完整性保持属性测试
    - **属性 2: 功能完整性保持**
    - **验证: 需求 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**
    - 创建app/import/__tests__/import-page.functional-preservation.property.test.tsx
    - 使用fast-check生成随机用户操作序列
    - 验证重新设计后的功能结果与重新设计前完全相同
    - 最小迭代次数: 100次
    - _需求: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 9.3 编写样式常量一致性属性测试
    - **属性 3: 样式常量一致性**
    - **验证: 需求 10.4, 10.5**
    - 创建app/import/__tests__/import-page.style-consistency.property.test.tsx
    - 使用fast-check验证所有UI组件使用InkWashEffects中的圆角半径值
    - 使用fast-check验证所有UI组件使用InkWashEffects中的阴影效果
    - 最小迭代次数: 100次
    - _需求: 10.4, 10.5_

  - [x] 9.4 手动视觉回归测试
    - 将重新设计后的导入页面与创建页面并排对比
    - 使用浏览器开发工具验证实际应用的颜色值
    - 手动测试所有悬停、聚焦、选中状态
    - 在不同屏幕尺寸下验证视觉效果
    - 在主流浏览器中验证视觉一致性
    - _需求: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 10. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过,询问用户是否有问题

## 注意事项

- 任务标记为 `*` 的是可选测试任务,可以跳过以加快MVP交付
- 每个任务引用特定需求以确保可追溯性
- 检查点确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边缘情况
- 所有功能逻辑保持完全不变,仅修改视觉呈现
