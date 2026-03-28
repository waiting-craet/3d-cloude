'use client'

import React, { useState } from 'react'
import AdvancedSearch, { SearchFilters, SearchSuggestion } from '../AdvancedSearch'

// Mock search results for demonstration
const mockSearchResults = [
  {
    id: '1',
    title: '人工智能知识图谱',
    author: '张三',
    category: '科技',
    tags: ['AI', 'Machine Learning'],
    likes: 156,
    views: 2340,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: '深度学习算法详解',
    author: '李四',
    category: '教育',
    tags: ['Deep Learning', 'Neural Networks'],
    likes: 89,
    views: 1567,
    createdAt: new Date('2024-01-10')
  },
  {
    id: '3',
    title: '数据科学实践指南',
    author: '王五',
    category: '科技',
    tags: ['Data Science', 'Python'],
    likes: 234,
    views: 3456,
    createdAt: new Date('2024-01-20')
  }
]

const AdvancedSearchExample: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null)

  // 模拟搜索API调用
  const performSearch = async (filters: SearchFilters) => {
    setIsSearching(true)
    setLastSearchFilters(filters)
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 简单的搜索逻辑模拟
    let results = [...mockSearchResults]
    
    // 按查询关键词筛选
    if (filters.query) {
      results = results.filter(item => 
        item.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        item.author.toLowerCase().includes(filters.query.toLowerCase()) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(filters.query.toLowerCase()))
      )
    }
    
    // 按分类筛选
    if (filters.category) {
      results = results.filter(item => item.category === filters.category)
    }
    
    // 按作者筛选
    if (filters.author) {
      results = results.filter(item => 
        item.author.toLowerCase().includes(filters.author.toLowerCase())
      )
    }
    
    // 排序
    results.sort((a, b) => {
      let aValue, bValue
      
      switch (filters.sortBy) {
        case 'newest':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'popular':
        case 'likes':
          aValue = a.likes
          bValue = b.likes
          break
        case 'views':
          aValue = a.views
          bValue = b.views
          break
        default:
          return 0
      }
      
      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
    
    setSearchResults(results)
    setIsSearching(false)
  }

  const handleSearch = (filters: SearchFilters) => {
    console.log('执行搜索:', filters)
    performSearch(filters)
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    console.log('选择建议:', suggestion)
    // 可以在这里添加额外的逻辑，比如统计点击等
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              高级搜索示例
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              体验强大的搜索建议、历史记录和多条件筛选功能
            </p>
          </div>

          {/* 高级搜索组件 */}
          <AdvancedSearch
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            placeholder="搜索知识图谱、作者、标签..."
            className="max-w-4xl mx-auto"
            showFilters={true}
            showHistory={true}
            maxSuggestions={8}
            maxHistory={10}
          />
        </div>
      </div>

      {/* 搜索结果区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索状态显示 */}
        {lastSearchFilters && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                搜索条件
              </h3>
              <div className="flex flex-wrap gap-2">
                {lastSearchFilters.query && (
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                    关键词: {lastSearchFilters.query}
                  </span>
                )}
                {lastSearchFilters.category && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    分类: {lastSearchFilters.category}
                  </span>
                )}
                {lastSearchFilters.author && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    作者: {lastSearchFilters.author}
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  排序: {lastSearchFilters.sortBy === 'newest' ? '最新' : 
                         lastSearchFilters.sortBy === 'popular' ? '最热' :
                         lastSearchFilters.sortBy === 'views' ? '浏览量' : '点赞数'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
              <span className="text-gray-600">搜索中...</span>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {!isSearching && searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                搜索结果 ({searchResults.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {result.title}
                    </h3>
                    <span className="text-2xl ml-2">
                      {getCategoryIcon(result.category)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">
                      作者: {result.author}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {result.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {result.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        ❤️ {result.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        👁️ {result.views}
                      </span>
                    </div>
                    <span>{formatDate(result.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 无结果状态 */}
        {!isSearching && lastSearchFilters && searchResults.length === 0 && (
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
        )}

        {/* 默认状态 */}
        {!isSearching && !lastSearchFilters && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              开始搜索
            </h3>
            <p className="text-gray-600 mb-6">
              在上方搜索框中输入关键词，体验智能搜索功能
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">💡</div>
                <div className="text-sm font-medium text-gray-900">搜索建议</div>
                <div className="text-xs text-gray-500 mt-1">智能提示</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">📝</div>
                <div className="text-sm font-medium text-gray-900">搜索历史</div>
                <div className="text-xs text-gray-500 mt-1">快速重搜</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm font-medium text-gray-900">高级筛选</div>
                <div className="text-xs text-gray-500 mt-1">精确查找</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm font-medium text-gray-900">智能排序</div>
                <div className="text-xs text-gray-500 mt-1">个性化结果</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchExample