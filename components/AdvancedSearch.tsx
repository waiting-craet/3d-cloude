'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { debounce } from 'lodash'
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch'

// TypeScript interfaces
export interface SearchSuggestion {
  id: string
  text: string
  type: 'keyword' | 'author' | 'category' | 'tag'
  count?: number
  icon?: string
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: Date
  results?: number
}

export interface SearchFilters {
  query: string
  category?: string
  author?: string
  tags: string[]
  sortBy: 'newest' | 'popular' | 'views' | 'likes'
  sortOrder: 'asc' | 'desc'
}

export interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  showHistory?: boolean
  maxSuggestions?: number
  maxHistory?: number
}

// Mock data for suggestions - in real app, this would come from API
const mockSuggestions: SearchSuggestion[] = [
  { id: '1', text: '人工智能', type: 'keyword', count: 156, icon: '🤖' },
  { id: '2', text: '机器学习', type: 'keyword', count: 89, icon: '🧠' },
  { id: '3', text: '深度学习', type: 'keyword', count: 67, icon: '🔬' },
  { id: '4', text: '数据科学', type: 'keyword', count: 134, icon: '📊' },
  { id: '5', text: '张三', type: 'author', count: 23, icon: '👤' },
  { id: '6', text: '李四', type: 'author', count: 18, icon: '👤' },
  { id: '7', text: '科技', type: 'category', count: 245, icon: '💻' },
  { id: '8', text: '教育', type: 'category', count: 189, icon: '📚' },
  { id: '9', text: 'Python', type: 'tag', count: 78, icon: '🏷️' },
  { id: '10', text: 'JavaScript', type: 'tag', count: 92, icon: '🏷️' },
]

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'tech', name: '科技', icon: '💻' },
  { id: 'education', name: '教育', icon: '📚' },
  { id: 'business', name: '商业', icon: '💼' },
  { id: 'art', name: '艺术', icon: '🎨' },
  { id: 'medical', name: '医疗', icon: '🏥' },
  { id: 'other', name: '其他', icon: '📦' },
]

const sortOptions = [
  { value: 'newest', label: '最新发布', icon: '🕒' },
  { value: 'popular', label: '最受欢迎', icon: '🔥' },
  { value: 'views', label: '浏览量', icon: '👁️' },
  { value: 'likes', label: '点赞数', icon: '❤️' },
]

// Search suggestions dropdown component
const SearchSuggestions: React.FC<{
  suggestions: SearchSuggestion[]
  onSelect: (suggestion: SearchSuggestion) => void
  onClose: () => void
  query: string
}> = ({ suggestions, onSelect, onClose, query }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }, [suggestions, selectedIndex, onSelect, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword': return '关键词'
      case 'author': return '作者'
      case 'category': return '分类'
      case 'tag': return '标签'
      default: return ''
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return 'bg-blue-100 text-blue-700'
      case 'author': return 'bg-green-100 text-green-700'
      case 'category': return 'bg-purple-100 text-purple-700'
      case 'tag': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-800 font-medium">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
      {suggestions.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm">没有找到相关建议</div>
        </div>
      ) : (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-teal-50 border-r-2 border-teal-500' : ''
              }`}
            >
              <div className="text-lg">{suggestion.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {highlightMatch(suggestion.text, query)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(suggestion.type)}`}>
                    {getTypeLabel(suggestion.type)}
                  </span>
                </div>
                {suggestion.count && (
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.count} 个相关结果
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400">
                ↵
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Search history dropdown component
const SearchHistory: React.FC<{
  history: SearchHistory[]
  onSelect: (query: string) => void
  onClear: () => void
  onRemove: (id: string) => void
}> = ({ history, onSelect, onClear, onRemove }) => {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">搜索历史</span>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            清空
          </button>
        )}
      </div>
      
      {history.length === 0 ? (
        <div className="px-4 py-6 text-center text-gray-500">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm">暂无搜索历史</div>
        </div>
      ) : (
        <div className="py-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="text-gray-400">🕒</div>
              <button
                onClick={() => onSelect(item.query)}
                className="flex-1 text-left"
              >
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.query}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                  {item.results && ` • ${item.results} 个结果`}
                </div>
              </button>
              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main AdvancedSearch component
const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = "搜索知识图谱、作者、标签...",
  className = '',
  showFilters = true,
  showHistory = true,
  maxSuggestions = 8,
  maxHistory = 10
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    author: '',
    tags: [],
    sortBy: 'newest',
    sortOrder: 'desc'
  })
  
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setHistory(parsed.slice(0, maxHistory))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [maxHistory])

  // Save search history to localStorage
  const saveHistory = useCallback((newHistory: SearchHistory[]) => {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [])

  // Debounced search suggestions
  const debouncedGetSuggestions = useCallback(
    debounce((query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      // Filter suggestions based on query
      const filtered = mockSuggestions
        .filter(suggestion => 
          suggestion.text.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxSuggestions)
      
      setSuggestions(filtered)
    }, 300),
    [maxSuggestions]
  )

  // Handle input change
  const handleInputChange = (value: string) => {
    setFilters(prev => ({ ...prev, query: value }))
    debouncedGetSuggestions(value)
    
    if (value.length > 0) {
      setShowSuggestions(true)
      setShowHistoryDropdown(false)
    } else {
      setShowSuggestions(false)
      if (showHistory && isFocused) {
        setShowHistoryDropdown(true)
      }
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true)
    if (filters.query.length === 0 && showHistory && history.length > 0) {
      setShowHistoryDropdown(true)
    } else if (filters.query.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Delay to allow clicks on suggestions/history
    setTimeout(() => {
      setIsFocused(false)
      setShowSuggestions(false)
      setShowHistoryDropdown(false)
    }, 200)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const newFilters = { ...filters, query: suggestion.text }
    setFilters(newFilters)
    setShowSuggestions(false)
    onSuggestionSelect?.(suggestion)
    onSearch(newFilters)
    addToHistory(suggestion.text)
  }

  // Handle history selection
  const handleHistorySelect = (query: string) => {
    const newFilters = { ...filters, query }
    setFilters(newFilters)
    setShowHistoryDropdown(false)
    onSearch(newFilters)
  }

  // Add to search history
  const addToHistory = (query: string) => {
    if (!query.trim()) return
    
    const newItem: SearchHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date()
    }
    
    const newHistory = [
      newItem,
      ...history.filter(item => item.query !== query.trim())
    ].slice(0, maxHistory)
    
    setHistory(newHistory)
    saveHistory(newHistory)
  }

  // Clear search history
  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('searchHistory')
  }

  // Remove history item
  const removeHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    saveHistory(newHistory)
  }

  // Handle search submit
  const handleSearch = () => {
    if (filters.query.trim()) {
      addToHistory(filters.query)
    }
    onSearch(filters)
    setShowSuggestions(false)
    setShowHistoryDropdown(false)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showSuggestions) {
      handleSearch()
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowHistoryDropdown(false)
        setShowFiltersPanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main search input */}
      <div className="relative">
        <div className={`flex bg-white rounded-xl border-2 transition-all duration-200 ${
          isFocused ? 'border-teal-500 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={filters.query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-6 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
          />
          
          {/* Search actions */}
          <div className="flex items-center gap-2 pr-2">
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showFiltersPanel ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="高级筛选"
              >
                ⚙️
              </button>
            )}
            
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <SearchSuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
            query={filters.query}
          />
        )}

        {/* Search history */}
        {showHistoryDropdown && (
          <SearchHistory
            history={history}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
            onRemove={removeHistoryItem}
          />
        )}
      </div>

      {/* Advanced filters panel */}
      {showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-40 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作者
              </label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                placeholder="输入作者名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Sort options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方式
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilters({
                  query: filters.query,
                  category: '',
                  author: '',
                  tags: [],
                  sortBy: 'newest',
                  sortOrder: 'desc'
                })
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              重置筛选
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFiltersPanel(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleSearch()
                  setShowFiltersPanel(false)
                }}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearch