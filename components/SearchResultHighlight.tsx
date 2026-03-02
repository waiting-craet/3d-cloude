'use client'

import React from 'react'

// TypeScript interfaces
export interface SearchResultHighlightProps {
  text: string
  searchQuery: string
  className?: string
  highlightClassName?: string
  caseSensitive?: boolean
  wholeWords?: boolean
}

export interface HighlightedWorkCardProps {
  work: {
    id: string
    title: string
    description?: string
    author: string
    category: string
    tags: string[]
    likes: number
    views: number
    createdAt: Date
    thumbnail?: string
  }
  searchQuery: string
  onClick?: () => void
  onLike?: () => void
  onShare?: () => void
}

// 文本高亮组件
const SearchResultHighlight: React.FC<SearchResultHighlightProps> = ({
  text,
  searchQuery,
  className = '',
  highlightClassName = 'bg-yellow-200 text-yellow-800 font-medium px-1 rounded',
  caseSensitive = false,
  wholeWords = false
}) => {
  // 如果没有搜索查询，直接返回原文本
  if (!searchQuery || !searchQuery.trim()) {
    return <span className={className}>{text}</span>
  }

  // 构建正则表达式
  const buildRegex = (query: string) => {
    // 转义特殊字符
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 分割查询词（支持多个关键词）
    const keywords = escapedQuery.split(/\s+/).filter(Boolean)
    
    if (keywords.length === 0) return null
    
    // 构建正则表达式模式
    let pattern = keywords.join('|')
    
    if (wholeWords) {
      pattern = `\\b(${pattern})\\b`
    } else {
      pattern = `(${pattern})`
    }
    
    const flags = caseSensitive ? 'g' : 'gi'
    return new RegExp(pattern, flags)
  }

  const regex = buildRegex(searchQuery.trim())
  
  if (!regex) {
    return <span className={className}>{text}</span>
  }

  // 分割文本并高亮匹配部分
  const parts = text.split(regex)
  const matches = text.match(regex) || []
  
  let matchIndex = 0
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // 偶数索引是非匹配部分，奇数索引是匹配部分
        if (index % 2 === 0) {
          return part
        } else {
          const match = matches[matchIndex++]
          return (
            <mark key={`${index}-${match}`} className={highlightClassName}>
              {match}
            </mark>
          )
        }
      })}
    </span>
  )
}

// 高亮作品卡片组件
const HighlightedWorkCard: React.FC<HighlightedWorkCardProps> = ({
  work,
  searchQuery,
  onClick,
  onLike,
  onShare
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '科技': return '💻'
      case '教育': return '📚'
      case '商业': return '💼'
      case '艺术': return '🎨'
      case '医疗': return '🏥'
      default: return '📦'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '科技': return 'bg-blue-100 text-blue-700'
      case '教育': return 'bg-green-100 text-green-700'
      case '商业': return 'bg-purple-100 text-purple-700'
      case '艺术': return 'bg-pink-100 text-pink-700'
      case '医疗': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer">
      {/* 缩略图区域 */}
      <div className="relative h-48 bg-gradient-to-br from-teal-50 to-blue-50 overflow-hidden">
        {work.thumbnail ? (
          <img
            src={work.thumbnail}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl text-teal-400">
              {getCategoryIcon(work.category)}
            </div>
          </div>
        )}
        
        {/* 分类标签 */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(work.category)}`}>
            {getCategoryIcon(work.category)} {work.category}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike()
              }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-red-500 hover:text-red-600 transition-colors shadow-sm"
              title="点赞"
            >
              ❤️
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors shadow-sm"
              title="分享"
            >
              📤
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6" onClick={onClick}>
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
          <SearchResultHighlight
            text={work.title}
            searchQuery={searchQuery}
            highlightClassName="bg-yellow-200 text-yellow-800 font-bold px-1 rounded"
          />
        </h3>

        {/* 描述 */}
        {work.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            <SearchResultHighlight
              text={work.description}
              searchQuery={searchQuery}
              highlightClassName="bg-yellow-200 text-yellow-800 font-medium px-1 rounded"
            />
          </p>
        )}

        {/* 作者 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-xs text-teal-600">👤</span>
          </div>
          <span className="text-sm text-gray-700">
            <SearchResultHighlight
              text={work.author}
              searchQuery={searchQuery}
              highlightClassName="bg-yellow-200 text-yellow-800 font-medium px-1 rounded"
            />
          </span>
        </div>

        {/* 标签 */}
        {work.tags && work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {work.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-medium"
              >
                #<SearchResultHighlight
                  text={tag}
                  searchQuery={searchQuery}
                  highlightClassName="bg-yellow-300 text-yellow-900 font-bold"
                />
              </span>
            ))}
            {work.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{work.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-red-500">❤️</span>
              {work.likes}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-500">👁️</span>
              {work.views}
            </span>
          </div>
          <span>{formatDate(work.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

// 搜索结果列表组件
export interface SearchResultsListProps {
  works: HighlightedWorkCardProps['work'][]
  searchQuery: string
  onWorkClick?: (work: HighlightedWorkCardProps['work']) => void
  onWorkLike?: (workId: string) => void
  onWorkShare?: (work: HighlightedWorkCardProps['work']) => void
  loading?: boolean
  className?: string
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  works,
  searchQuery,
  onWorkClick,
  onWorkLike,
  onWorkShare,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          没有找到相关结果
        </h3>
        <p className="text-gray-600 mb-6">
          尝试调整搜索条件或使用不同的关键词
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• 检查拼写是否正确</p>
          <p>• 尝试使用更通用的关键词</p>
          <p>• 减少筛选条件</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {works.map((work) => (
        <HighlightedWorkCard
          key={work.id}
          work={work}
          searchQuery={searchQuery}
          onClick={() => onWorkClick?.(work)}
          onLike={() => onWorkLike?.(work.id)}
          onShare={() => onWorkShare?.(work)}
        />
      ))}
    </div>
  )
}

// 导出组件
export default SearchResultHighlight
export { HighlightedWorkCard, SearchResultsList }