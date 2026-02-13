/**
 * 主题配置文件
 * 定义应用的亮色和暗色主题的所有颜色和样式
 */

export interface ThemeConfig {
  // 三维背景
  canvasBackground: string
  
  // 弹窗样式
  panelBackground: string
  panelBorder: string
  panelText: string
  panelShadow: string
  panelHeaderBackground: string
  panelHeaderText: string
  
  // 导航栏样式
  navbarBackground: string
  navbarText: string
  navbarBorder: string
  
  // 按钮样式
  buttonBackground: string
  buttonHoverBackground: string
  buttonText: string
  buttonBorder: string
  
  // 输入框样式
  inputBackground: string
  inputBorder: string
  inputText: string
  inputPlaceholder: string
  
  // 其他元素
  dividerColor: string
  hoverBackground: string
}

export interface WorkflowThemeConfig {
  // 画布背景
  canvasBackground: string
  
  // 节点卡片
  nodeBackground: string
  nodeBackgroundSelected: string
  nodeBorder: string
  nodeBorderSelected: string
  nodeText: string
  nodeTopBar: string
  nodeTopBarSelected: string
  
  // 连接线
  connectionLineColor: string
  connectionLineHoverColor: string
  connectionLabelBackground: string
  connectionLabelText: string
  
  // 按钮和控件
  buttonBackground: string
  buttonHoverBackground: string
  buttonText: string
  inputBackground: string
  inputBorder: string
  inputText: string
  
  // 其他
  dragHandleBackground: string
  dragHandleText: string
}

/**
 * 暗色主题配置
 * 默认主题，三维背景保持暗色，弹窗为暗色调
 */
export const DARK_THEME: ThemeConfig = {
  // 三维背景 - 保持暗色
  canvasBackground: '#1a1a1a',
  
  // 弹窗样式 - 暗色调
  panelBackground: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(25, 25, 25, 0.98) 100%)',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
  panelText: '#ffffff',
  panelShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  panelHeaderBackground: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
  panelHeaderText: '#ffffff',
  
  // 导航栏样式 - 暗色调
  navbarBackground: 'rgba(26, 26, 26, 0.95)',
  navbarText: '#ffffff',
  navbarBorder: 'rgba(255, 255, 255, 0.1)',
  
  // 按钮样式
  buttonBackground: 'rgba(74, 158, 255, 0.15)',
  buttonHoverBackground: 'rgba(255, 255, 255, 0.08)',
  buttonText: '#ffffff',
  buttonBorder: 'rgba(255, 255, 255, 0.15)',
  
  // 输入框样式
  inputBackground: 'rgba(255, 255, 255, 0.08)',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputText: '#ffffff',
  inputPlaceholder: 'rgba(255, 255, 255, 0.4)',
  
  // 其他元素
  dividerColor: 'rgba(255, 255, 255, 0.05)',
  hoverBackground: 'rgba(255, 255, 255, 0.05)',
}

/**
 * 亮色主题配置
 * 三维背景为白色，弹窗为亮色调
 */
export const LIGHT_THEME: ThemeConfig = {
  // 三维背景 - 白色
  canvasBackground: '#ffffff',
  
  // 弹窗样式 - 亮色调（现有样式）
  panelBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)',
  panelBorder: 'rgba(107, 182, 255, 0.2)',
  panelText: '#1a1a1a',
  panelShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
  panelHeaderBackground: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
  panelHeaderText: '#ffffff',
  
  // 导航栏样式 - 亮色调
  navbarBackground: 'rgba(255, 255, 255, 0.95)',
  navbarText: '#1a1a1a',
  navbarBorder: 'rgba(0, 0, 0, 0.1)',
  
  // 按钮样式
  buttonBackground: 'rgba(74, 158, 255, 0.1)',
  buttonHoverBackground: 'rgba(74, 158, 255, 0.15)',
  buttonText: '#1a1a1a',
  buttonBorder: 'rgba(0, 0, 0, 0.1)',
  
  // 输入框样式
  inputBackground: 'rgba(0, 0, 0, 0.05)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputText: '#1a1a1a',
  inputPlaceholder: 'rgba(0, 0, 0, 0.4)',
  
  // 其他元素
  dividerColor: 'rgba(0, 0, 0, 0.05)',
  hoverBackground: 'rgba(0, 0, 0, 0.05)',
}

/**
 * 主题配置映射
 * 根据主题名称获取对应的配置
 */
export const THEME_CONFIGS: Record<'light' | 'dark', ThemeConfig> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
}

/**
 * 获取当前主题配置
 * @param theme - 主题名称 ('light' | 'dark')
 * @returns 主题配置对象
 */
export function getThemeConfig(theme: 'light' | 'dark'): ThemeConfig {
  return THEME_CONFIGS[theme]
}

/**
 * 工作流画布主题配置映射
 */
export const WORKFLOW_THEME_CONFIGS: Record<'light' | 'dark', WorkflowThemeConfig> = {
  light: {
    // 画布背景
    canvasBackground: '#f5f5f5',
    
    // 节点卡片
    nodeBackground: '#ffffff',
    nodeBackgroundSelected: '#e3f2fd',
    nodeBorder: '#e0e0e0',
    nodeBorderSelected: '#2196f3',
    nodeText: '#1a1a1a',
    nodeTopBar: '#f5f5f5',
    nodeTopBarSelected: '#e3f2fd',
    
    // 连接线
    connectionLineColor: '#999999',
    connectionLineHoverColor: '#2196f3',
    connectionLabelBackground: '#ffffff',
    connectionLabelText: '#1a1a1a',
    
    // 按钮和控件
    buttonBackground: '#f0f0f0',
    buttonHoverBackground: '#e0e0e0',
    buttonText: '#1a1a1a',
    inputBackground: '#ffffff',
    inputBorder: '#e0e0e0',
    inputText: '#1a1a1a',
    
    // 其他
    dragHandleBackground: '#f5f5f5',
    dragHandleText: '#1a1a1a',
  },
  dark: {
    // 画布背景
    canvasBackground: '#1a1a1a',
    
    // 节点卡片
    nodeBackground: '#2a2a2a',
    nodeBackgroundSelected: '#1e3a5f',
    nodeBorder: '#404040',
    nodeBorderSelected: '#4a9eff',
    nodeText: '#ffffff',
    nodeTopBar: '#1f1f1f',
    nodeTopBarSelected: '#1e3a5f',
    
    // 连接线
    connectionLineColor: '#666666',
    connectionLineHoverColor: '#4a9eff',
    connectionLabelBackground: '#2a2a2a',
    connectionLabelText: '#ffffff',
    
    // 按钮和控件
    buttonBackground: '#3a3a3a',
    buttonHoverBackground: '#4a4a4a',
    buttonText: '#ffffff',
    inputBackground: '#2a2a2a',
    inputBorder: '#404040',
    inputText: '#ffffff',
    
    // 其他
    dragHandleBackground: '#1f1f1f',
    dragHandleText: '#ffffff',
  },
}

/**
 * 获取工作流画布主题配置
 * @param theme - 主题名称 ('light' | 'dark')
 * @returns 工作流主题配置对象
 */
export function getWorkflowThemeConfig(theme: 'light' | 'dark'): WorkflowThemeConfig {
  return WORKFLOW_THEME_CONFIGS[theme]
}
