/**
 * 创建工作流页面的类型定义
 */

export type NavigationItemType = 
  | 'my-projects' 
  | 'new-project' 
  | 'ai-create' 
  | 'import-file' 
  | 'ai-prompt' 
  | 'long-text' 
  | 'document-analysis' 
  | 'structured-analysis';

export interface NavigationItem {
  id: NavigationItemType;
  label: string;
  icon?: string;
  isSelected: boolean;
  hasSubmenu?: boolean;
  submenu?: NavigationItem[];
  onClick?: () => void;
}

export interface PageState {
  selectedNavItem: NavigationItemType;
  expandedMenus: Set<string>;
  contentData?: any;
}

export interface AICreationOption {
  id: string;
  label: string;
  description?: string;
}

export const AI_CREATION_OPTIONS: AICreationOption[] = [
  { id: 'ai-prompt', label: 'AI提示词' },
  { id: 'long-text', label: '长文本分析' },
  { id: 'document-analysis', label: '文档分析' },
  { id: 'structured-analysis', label: '结构化语言分析' },
];
