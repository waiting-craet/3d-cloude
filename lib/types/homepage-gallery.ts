/**
 * 首页广场相关的类型定义
 */

// 用户类型
export interface User {
  id: string
  name: string
  email: string
  avatar: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

// 图谱卡片类型
export interface GraphCard {
  id: string
  title: string
  description: string
  thumbnail: string
  type: '2d' | '3d'
  isTemplate: boolean
  creator: User
  createdAt: Date
  updatedAt: Date
  likes: number
  views: number
  tags: string[]
  nodeCount: number
  edgeCount: number
}

// 通知类型
export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  actor: User
  targetGraphId?: string
  targetUserId?: string
  message: string
  createdAt: Date
  isRead: boolean
}

// 搜索建议类型
export interface SearchSuggestion {
  id: string
  type: 'graph' | 'user' | 'tag'
  title: string
  icon: string
  description?: string
}

// 筛选类型
export type FilterType = '3d' | '2d' | 'template'

// 主题类型
export type Theme = 'light' | 'dark'

// 页面状态类型
export interface GalleryState {
  graphs: GraphCard[]
  isLoading: boolean
  error: string | null
  filters: FilterType[]
  searchQuery: string
  currentPage: number
  totalPages: number
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
