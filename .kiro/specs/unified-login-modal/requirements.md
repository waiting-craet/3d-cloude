# Requirements Document

## Introduction

本规格文档定义了统一登录弹窗功能的需求。目标是让首页(Landing Page)的登录按钮和3D编辑页面的登录按钮都能触发相同的登录弹窗组件,提供一致的用户体验。

## Glossary

- **Landing_Page**: 应用的首页,展示知识图谱作品广场
- **3D_Editor_Page**: 3D知识图谱编辑页面
- **Login_Modal**: 登录弹窗组件,包含登录和注册功能
- **Gallery_Navbar**: 首页顶部导航栏组件(GalleryTopNavbar)
- **Editor_Navbar**: 3D编辑页面顶部导航栏组件(TopNavbar)
- **User_Menu**: 用户菜单组件,包含登录按钮

## Requirements

### Requirement 1: 首页登录按钮触发弹窗

**User Story:** 作为一个访客,我想在首页点击登录按钮时看到登录弹窗,以便我可以登录系统。

#### Acceptance Criteria

1. WHEN 用户在首页点击导航栏中的"登录"按钮 THEN THE System SHALL 显示登录弹窗
2. WHEN 登录弹窗显示时 THEN THE System SHALL 显示半透明背景遮罩
3. WHEN 用户点击弹窗外部区域 THEN THE System SHALL 关闭登录弹窗
4. WHEN 用户点击弹窗内的"取消"按钮 THEN THE System SHALL 关闭登录弹窗

### Requirement 2: 登录弹窗组件复用

**User Story:** 作为开发者,我想在不同页面复用同一个登录弹窗组件,以便保持代码一致性和维护性。

#### Acceptance Criteria

1. THE Login_Modal SHALL 是一个独立的可复用组件
2. THE Login_Modal SHALL 接受 isOpen 和 onClose 作为必需属性
3. WHEN Login_Modal 在不同页面使用时 THEN THE System SHALL 显示相同的UI和行为
4. THE Login_Modal SHALL 支持登录和注册两种模式切换

### Requirement 3: 登录状态同步

**User Story:** 作为用户,我想在任何页面登录后,所有页面的登录状态都能同步更新,以便我不需要重复登录。

#### Acceptance Criteria

1. WHEN 用户在首页登录成功 THEN THE System SHALL 更新全局登录状态
2. WHEN 用户在3D编辑页面登录成功 THEN THE System SHALL 更新全局登录状态
3. WHEN 登录状态改变时 THEN THE System SHALL 触发 loginStateChange 事件
4. WHEN loginStateChange 事件触发时 THEN THE System SHALL 更新所有监听该事件的组件

### Requirement 4: 首页登录按钮样式一致性

**User Story:** 作为用户,我想看到首页和3D编辑页面的登录按钮有一致的视觉风格,以便获得统一的用户体验。

#### Acceptance Criteria

1. THE Landing_Page 登录按钮 SHALL 使用与 Gallery_Navbar 相同的样式
2. WHEN 用户悬停在登录按钮上 THEN THE System SHALL 显示悬停效果
3. THE 登录按钮 SHALL 使用渐变背景色(#667eea 到 #764ba2)
4. THE 登录按钮 SHALL 在点击时保持响应式反馈

### Requirement 5: 登录成功后的导航

**User Story:** 作为用户,我想在首页登录成功后能够继续浏览或开始创作,以便快速进入工作流程。

#### Acceptance Criteria

1. WHEN 用户在首页登录成功 THEN THE System SHALL 关闭登录弹窗
2. WHEN 用户在首页登录成功 THEN THE System SHALL 保持在当前页面
3. WHEN 用户在首页登录成功 THEN THE System SHALL 更新导航栏显示用户信息
4. WHEN 用户在首页登录成功后点击"开始创作" THEN THE System SHALL 导航到创作页面

### Requirement 6: 错误处理和用户反馈

**User Story:** 作为用户,我想在登录失败时看到清晰的错误提示,以便我知道如何解决问题。

#### Acceptance Criteria

1. WHEN 用户输入错误的用户名或密码 THEN THE System SHALL 显示错误提示信息
2. WHEN 网络请求失败 THEN THE System SHALL 显示"网络错误,请稍后重试"
3. WHEN 登录请求处理中 THEN THE System SHALL 显示加载状态并禁用提交按钮
4. THE 错误提示 SHALL 使用红色背景和边框以引起注意

### Requirement 7: 可访问性支持

**User Story:** 作为使用辅助技术的用户,我想能够通过键盘操作登录弹窗,以便我可以无障碍地使用系统。

#### Acceptance Criteria

1. WHEN 登录弹窗打开时 THEN THE System SHALL 将焦点设置到第一个输入框
2. WHEN 用户按下 ESC 键 THEN THE System SHALL 关闭登录弹窗
3. WHEN 用户在表单中按下 Enter 键 THEN THE System SHALL 提交登录表单
4. THE 登录弹窗 SHALL 具有适当的 ARIA 标签和角色属性
