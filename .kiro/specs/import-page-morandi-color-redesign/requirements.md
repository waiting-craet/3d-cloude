# 需求文档 - 导入页面莫兰蒂色彩重新设计

## 简介

本功能旨在重新设计导入数据页面(app/import/page.tsx)的颜色配置和UI,参考创建页面(app/create/page.tsx)的莫兰蒂绿色风格,使用天青色和黛绿色作为主要配色。此次重新设计仅涉及视觉呈现层面,不修改任何现有功能逻辑。

## 术语表

- **Import_Page**: 导入数据页面组件(app/import/page.tsx)
- **Creation_Page**: 创建页面组件(app/create/page.tsx),作为设计参考
- **Morandi_Color_Palette**: 莫兰蒂色系调色板,包含天青色、黛绿色等柔和色调
- **Sky_Blue**: 天青色(#7FDBDA),主要强调色
- **Dark_Green**: 黛绿色(#426666),次要强调色
- **UI_Component**: 用户界面组件,包括按钮、卡片、模态框等
- **Color_Configuration**: 颜色配置对象,定义页面使用的所有颜色值
- **Functional_Logic**: 功能逻辑,包括数据处理、API调用、状态管理等

## 需求

### 需求 1: 应用莫兰蒂色系调色板

**用户故事:** 作为用户,我希望导入页面使用柔和的莫兰蒂色系,以便获得更舒适的视觉体验。

#### 验收标准

1. THE Import_Page SHALL 使用天青色(#7FDBDA)作为主要强调色
2. THE Import_Page SHALL 使用黛绿色(#426666)作为次要强调色
3. THE Import_Page SHALL 定义完整的Morandi_Color_Palette对象,包含所有必需的颜色值
4. THE Morandi_Color_Palette SHALL 包含背景色、边框色、文本色和状态色
5. THE Import_Page SHALL 保持与Creation_Page一致的色彩风格和视觉语言

### 需求 2: 更新导航栏样式

**用户故事:** 作为用户,我希望导航栏采用莫兰蒂风格,以便与整体页面风格保持一致。

#### 验收标准

1. WHEN 页面加载时, THE Import_Page SHALL 显示使用莫兰蒂色系的导航栏
2. THE 导航栏 SHALL 使用渐变背景,从白色到柔和的米色
3. THE 导航栏 SHALL 使用黛绿色或相近的莫兰蒂绿色作为品牌标识颜色
4. THE 导航栏 SHALL 应用柔和的阴影效果,增强层次感
5. THE 导航栏 SHALL 使用与Creation_Page相同的视觉处理方式

### 需求 3: 重新设计选择器和按钮

**用户故事:** 作为用户,我希望所有交互元素使用莫兰蒂色系,以便获得统一的视觉体验。

#### 验收标准

1. THE 项目选择器 SHALL 使用莫兰蒂色系的背景和边框
2. THE 图谱选择器 SHALL 使用莫兰蒂色系的背景和边框
3. THE 新建按钮 SHALL 使用黛绿色或莫兰蒂绿色作为背景色
4. WHEN 用户悬停在按钮上时, THE 按钮 SHALL 显示稍浅的莫兰蒂色调
5. THE 生成图谱按钮 SHALL 使用莫兰蒂绿色作为主要背景色
6. THE 所有按钮 SHALL 应用柔和的圆角和阴影效果

### 需求 4: 更新文件类型卡片样式

**用户故事:** 作为用户,我希望文件类型选择卡片使用莫兰蒂色系,以便与整体设计协调。

#### 验收标准

1. THE 文件类型卡片 SHALL 使用渐变背景,从米白色到浅灰色
2. THE 文件类型卡片 SHALL 使用莫兰蒂色系的边框
3. WHEN 文件被选中时, THE 卡片 SHALL 显示黛绿色或莫兰蒂绿色的边框
4. WHEN 用户悬停在卡片上时, THE 卡片 SHALL 显示莫兰蒂色系的边框高亮
5. THE 文件类型卡片 SHALL 应用柔和的阴影效果

### 需求 5: 重新设计模板下载区域

**用户故事:** 作为用户,我希望模板下载按钮使用莫兰蒂色系,以便与页面整体风格一致。

#### 验收标准

1. THE 模板下载按钮 SHALL 使用莫兰蒂绿色作为背景色
2. THE 模板下载按钮 SHALL 使用白色文本
3. WHEN 用户悬停在下载按钮上时, THE 按钮 SHALL 显示稍浅的莫兰蒂绿色
4. THE 模板下载区域容器 SHALL 使用与主内容区一致的白色背景和边框样式
5. THE 模板下载按钮 SHALL 应用柔和的阴影效果

### 需求 6: 更新模态框样式

**用户故事:** 作为用户,我希望所有模态框使用莫兰蒂色系,以便获得一致的视觉体验。

#### 验收标准

1. THE 新建项目模态框 SHALL 使用莫兰蒂色系的背景渐变
2. THE 新建图谱模态框 SHALL 使用莫兰蒂色系的背景渐变
3. THE 确认导入模态框 SHALL 使用莫兰蒂色系的背景渐变
4. THE 加载模态框 SHALL 使用莫兰蒂色系的背景渐变
5. THE 模态框遮罩层 SHALL 使用黛绿色的半透明背景
6. THE 模态框中的按钮 SHALL 使用莫兰蒂色系
7. THE 模态框中的输入框 SHALL 在聚焦时显示莫兰蒂绿色的边框高亮

### 需求 7: 更新状态提示样式

**用户故事:** 作为用户,我希望状态提示使用柔和的莫兰蒂色系,以便减少视觉冲击。

#### 验收标准

1. THE 成功状态提示 SHALL 使用柔和的莫兰蒂绿色背景
2. THE 警告状态提示 SHALL 使用柔和的琥珀色背景
3. THE 错误状态提示 SHALL 使用柔和的玫瑰色背景
4. THE 所有状态提示 SHALL 使用深色文本以确保可读性
5. THE 状态提示 SHALL 应用柔和的圆角和阴影效果

### 需求 8: 更新加载动画样式

**用户故事:** 作为用户,我希望加载动画使用莫兰蒂色系,以便与整体设计协调。

#### 验收标准

1. THE 加载动画 SHALL 使用莫兰蒂绿色作为主要颜色
2. THE 加载动画 SHALL 使用浅绿色作为背景轨道颜色
3. THE 加载动画 SHALL 保持平滑的旋转效果
4. THE 加载模态框 SHALL 显示使用莫兰蒂色系的统计信息卡片

### 需求 9: 保持功能完整性

**用户故事:** 作为开发者,我需要确保颜色重新设计不影响任何现有功能,以便用户可以正常使用所有导入功能。

#### 验收标准

1. THE Import_Page SHALL 保持所有现有的Functional_Logic不变
2. THE Import_Page SHALL 保持所有事件处理函数不变
3. THE Import_Page SHALL 保持所有状态管理逻辑不变
4. THE Import_Page SHALL 保持所有API调用逻辑不变
5. THE Import_Page SHALL 保持所有数据验证逻辑不变
6. WHEN 用户执行任何操作时, THE Import_Page SHALL 产生与重新设计前相同的功能结果

### 需求 10: 确保视觉一致性

**用户故事:** 作为用户,我希望导入页面与创建页面具有一致的视觉风格,以便获得统一的产品体验。

#### 验收标准

1. THE Import_Page SHALL 使用与Creation_Page相同的渐变背景样式
2. THE Import_Page SHALL 使用与Creation_Page相同的卡片样式
3. THE Import_Page SHALL 使用与Creation_Page相同的按钮样式
4. THE Import_Page SHALL 使用与Creation_Page相同的圆角半径值
5. THE Import_Page SHALL 使用与Creation_Page相同的阴影效果
6. FOR ALL UI_Component, 视觉处理方式 SHALL 与Creation_Page保持一致
