# 三维页面导航栏返回按钮添加完成

## 功能描述
在三维页面的导航栏中，在"现有图谱"下拉菜单的左侧添加了一个返回按钮，支持主题颜色切换。

## 修改内容

### 1. 修改的文件
- `components/TopNavbar.tsx`

### 2. 新增功能

#### 返回按钮
- **位置**: 导航栏最左侧，"现有图谱"下拉菜单的左边
- **功能**: 点击返回上一页（使用 `window.history.back()`）
- **图标**: 左箭头 (←) + "返回"文字
- **提示**: 鼠标悬停显示"返回上一页"

#### 主题支持
- **文字颜色**: 使用 `themeConfig.navbarText`
  - 暗色主题: 白色 (#ffffff)
  - 亮色主题: 黑色 (#1a1a1a)
  
- **边框颜色**: 使用 `themeConfig.buttonBorder`
  - 暗色主题: rgba(255, 255, 255, 0.15)
  - 亮色主题: rgba(0, 0, 0, 0.1)
  
- **悬停背景**: 使用 `themeConfig.buttonHoverBackground`
  - 暗色主题: rgba(255, 255, 255, 0.08)
  - 亮色主题: rgba(74, 158, 255, 0.15)
  
- **悬停边框**: rgba(74, 158, 255, 0.5) (蓝色高亮)

#### 样式特性
- 圆角设计 (8px borderRadius)
- 平滑过渡动画 (0.2s transition)
- 悬停时背景和边框颜色变化
- 与"现有图谱"按钮样式保持一致
- 响应式设计，文字不换行

## 技术细节

### 按钮样式
```typescript
{
  padding: '8px 12px',
  background: 'transparent',
  border: `1px solid ${themeConfig.buttonBorder}`,
  borderRadius: '8px',
  color: themeConfig.navbarText,
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
}
```

### 悬停效果
- 背景变为 `themeConfig.buttonHoverBackground`
- 边框变为蓝色高亮 `rgba(74, 158, 255, 0.5)`
- 鼠标移出时恢复原始样式

### 主题配置来源
使用 `lib/theme.ts` 中的 `getThemeConfig(theme)` 函数获取当前主题配置：
- `navbarText`: 导航栏文字颜色
- `buttonBorder`: 按钮边框颜色
- `buttonHoverBackground`: 按钮悬停背景色

## 使用场景
1. 从首页进入三维页面后，可以点击返回按钮回到首页
2. 从其他页面导航到三维页面后，可以返回上一页
3. 支持浏览器的历史记录导航

## 测试建议
1. 在暗色主题下测试按钮的可见性和交互
2. 切换到亮色主题，验证按钮颜色正确显示
3. 测试悬停效果在两种主题下的表现
4. 点击按钮验证返回功能正常工作
5. 测试按钮与"现有图谱"按钮的间距和对齐

## 视觉效果
- 按钮与"现有图谱"按钮样式统一
- 左箭头图标清晰可见
- 悬停时有明显的视觉反馈
- 在两种主题下都清晰可见
- 与整体导航栏设计风格一致

## 注意事项
- 按钮使用 `window.history.back()` 实现返回功能
- 如果没有历史记录，按钮可能不会有效果
- 按钮样式与主题系统完全集成
- 所有颜色都根据当前主题动态调整
