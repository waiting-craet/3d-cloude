// 创建工作流页面类型定义

export interface PageState {
  searchQuery: string;
  selectedFilter: 'all' | 'graph' | 'document';
  sortBy: 'updateTime' | 'title';
}

export interface Project {
  id: string;
  name: string;
  type: 'graph' | 'document';
  updatedAt: Date;
  createdAt: Date;
  thumbnail?: string;
}

export interface SideNavigationProps {
  onNewProject: () => void;
  onImport: () => void;
  onAICreate: () => void;
}

export interface MainContentProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}
