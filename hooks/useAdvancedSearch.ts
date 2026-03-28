'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { debounce } from 'lodash'
import { 
  SearchCache, 
  generateSearchSuggestions, 
  highlightSearchFields,
  sortSearchResults,
  type HighlightOptions 
} from '@/lib/searchHighlight'

// TypeScript interfaces
export interface SearchFilters {
  query: string
  category?: string
  author?: string
  tags: string[]
  sortBy: 'newest' | 'popular' | 'views' | 'likes' | 'relevance'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'keyword' | 'author' | 'category' | 'tag'
  count?: number
  icon?: string
  score?: number
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: Date
  results?: number
  filters?: Partial<SearchFilters>
}

export interface SearchResult<T = any> {
  items: T[]
  total: number
  page: number
  hasMore: boolean
  suggestions: SearchSuggestion[]
  searchTime: number
}

export interface UseAdvancedSearchOptions {
  // 搜索配置
  debounceDelay?: number
  minQueryLength?: number
  maxSuggestions?: number
  maxHistory?: number
  cacheSize?: number
  cacheTTL?: number
  
  // 搜索字段配置
  searchFields?: string[]
  suggestionFields?: string[]
  
  // 性能优化
  enableCache?: boolean
  enableVirtualization?: boolean
  prefetchNextPage?: boolean
  
  // 高亮配置
  highlightOptions?: HighlightOptions
  
  // API配置
  searchAPI?: (filters: SearchFilters) => Promise<SearchResult>
  suggestionsAPI?: (query: string) => Promise<SearchSuggestion[]>
}

export interface UseAdvancedSearchReturn<T = any> {
  // 搜索状态
  filters: SearchFilters
  setFilters: (filters: Partial<SearchFilters>) => void
  
  // 搜索结果
  results: T[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  searchTime: number
  
  // 搜索建议
  suggestions: SearchSuggestion[]
  showSuggestions: boolean
  
  // 搜索历史
  history: SearchHistory[]
  showHistory: boolean
  
  // 搜索操作
  search: (newFilters?: Partial<SearchFilters>) => Promise<void>
  loadMore: () => Promise<void>
  clearResults: () => void
  
  // 建议操作
  getSuggestions: (query: string) => Promise<void>
  selectSuggestion: (suggestion: SearchSuggestion) => void
  clearSuggestions: () => void
  
  // 历史操作
  addToHistory: (query: string, results?: number) => void
  selectHistory: (item: SearchHistory) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  
  // 缓存操作
  clearCache: () => void
  
  // 性能指标
  performanceMetrics: {
    searchCount: number
    cacheHitRate: number
    averageSearchTime: number
  }
}

// 默认搜索API（模拟）
const defaultSearchAPI = async (filters: SearchFilters): Promise<SearchResult> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
  
  // 模拟搜索结果
  const mockResults = Array.from({ length: filters.limit }, (_, index) => ({
    id: `${filters.page}-${index}`,
    title: `搜索结果 ${filters.page * filters.limit + index + 1}`,
    description: `这是关于 "${filters.query}" 的搜索结果描述`,
    author: `作者${index + 1}`,
    category: ['科技', '教育', '商业', '艺术'][index % 4],
    tags: [`标签${index + 1}`, `标签${index + 2}`],
    likes: Math.floor(Math.random() * 1000),
    views: Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }))
  
  return {
    items: mockResults,
    total: 1000,
    page: filters.page,
    hasMore: filters.page < 10,
    suggestions: [],
    searchTime: Math.random() * 500 + 100
  }
}

// 默认建议API（模拟）
const defaultSuggestionsAPI = async (query: string): Promise<SearchSuggestion[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: '人工智能', type: 'keyword', count: 156, icon: '🤖' },
    { id: '2', text: '机器学习', type: 'keyword', count: 89, icon: '🧠' },
    { id: '3', text: '深度学习', type: 'keyword', count: 67, icon: '🔬' },
    { id: '4', text: '数据科学', type: 'keyword', count: 134, icon: '📊' },
  ]
  
  return mockSuggestions.filter(s => 
    s.text.toLowerCase().includes(query.toLowerCase())
  )
}

// 高级搜索Hook
export function useAdvancedSearch<T = any>(
  options: UseAdvancedSearchOptions = {}
): UseAdvancedSearchReturn<T> {
  const {
    debounceDelay = 300,
    minQueryLength = 2,
    maxSuggestions = 8,
    maxHistory = 20,
    cacheSize = 100,
    cacheTTL = 5 * 60 * 1000, // 5分钟
    searchFields = ['title', 'description', 'author', 'tags'],
    suggestionFields = ['title', 'author', 'tags'],
    enableCache = true,
    enableVirtualization = false,
    prefetchNextPage = true,
    highlightOptions = {},
    searchAPI = defaultSearchAPI,
    suggestionsAPI = defaultSuggestionsAPI
  } = options

  // 状态管理
  const [filters, setFiltersState] = useState<SearchFilters>({
    query: '',
    category: '',
    author: '',
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  })

  const [results, setResults] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState(0)

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [history, setHistory] = useState<SearchHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 性能指标
  const [performanceMetrics, setPerformanceMetrics] = useState({
    searchCount: 0,
    cacheHitRate: 0,
    averageSearchTime: 0
  })

  // Refs
  const searchCacheRef = useRef<SearchCache>()
  const suggestionsCacheRef = useRef<SearchCache>()
  const searchTimesRef = useRef<number[]>([])
  const cacheHitsRef = useRef(0)
  const cacheMissesRef = useRef(0)

  // 初始化缓存
  useEffect(() => {
    if (enableCache) {
      searchCacheRef.current = new SearchCache(cacheSize, cacheTTL)
      suggestionsCacheRef.current = new SearchCache(cacheSize, cacheTTL)
    }
  }, [enableCache, cacheSize, cacheTTL])

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('advancedSearchHistory')
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

  // 保存搜索历史
  const saveHistory = useCallback((newHistory: SearchHistory[]) => {
    try {
      localStorage.setItem('advancedSearchHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [])

  // 更新性能指标
  const updatePerformanceMetrics = useCallback((searchTime: number, cacheHit: boolean) => {
    searchTimesRef.current.push(searchTime)
    if (searchTimesRef.current.length > 100) {
      searchTimesRef.current = searchTimesRef.current.slice(-100)
    }

    if (cacheHit) {
      cacheHitsRef.current++
    } else {
      cacheMissesRef.current++
    }

    const totalRequests = cacheHitsRef.current + cacheMissesRef.current
    const cacheHitRate = totalRequests > 0 ? cacheHitsRef.current / totalRequests : 0
    const averageSearchTime = searchTimesRef.current.reduce((a, b) => a + b, 0) / searchTimesRef.current.length

    setPerformanceMetrics({
      searchCount: totalRequests,
      cacheHitRate,
      averageSearchTime
    })
  }, [])

  // 搜索函数
  const search = useCallback(async (newFilters?: Partial<SearchFilters>) => {
    const searchFilters = { ...filters, ...newFilters, page: 1 }
    setFiltersState(searchFilters)
    setIsLoading(true)
    setError(null)

    const startTime = Date.now()
    let cacheHit = false

    try {
      // 检查缓存
      const cacheKey = JSON.stringify(searchFilters)
      let result: SearchResult<T> | null = null

      if (enableCache && searchCacheRef.current) {
        result = searchCacheRef.current.get(cacheKey)
        if (result) {
          cacheHit = true
        }
      }

      // 如果缓存未命中，调用API
      if (!result) {
        result = await searchAPI(searchFilters)
        
        // 缓存结果
        if (enableCache && searchCacheRef.current) {
          searchCacheRef.current.set(cacheKey, result)
        }
      }

      // 处理搜索结果高亮
      const highlightedResults = result.items.map(item => 
        highlightSearchFields(item, searchFilters.query, searchFields, highlightOptions)
      )

      setResults(highlightedResults)
      setTotal(result.total)
      setHasMore(result.hasMore)
      setSearchTime(result.searchTime)

      // 预取下一页
      if (prefetchNextPage && result.hasMore && enableCache && searchCacheRef.current) {
        const nextPageFilters = { ...searchFilters, page: searchFilters.page + 1 }
        const nextPageKey = JSON.stringify(nextPageFilters)
        
        if (!searchCacheRef.current.get(nextPageKey)) {
          searchAPI(nextPageFilters).then(nextResult => {
            if (searchCacheRef.current) {
              searchCacheRef.current.set(nextPageKey, nextResult)
            }
          }).catch(() => {
            // 忽略预取错误
          })
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
      setResults([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      const endTime = Date.now()
      updatePerformanceMetrics(endTime - startTime, cacheHit)
    }
  }, [filters, searchAPI, searchFields, highlightOptions, enableCache, prefetchNextPage, updatePerformanceMetrics])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    const nextPageFilters = { ...filters, page: filters.page + 1 }

    try {
      const cacheKey = JSON.stringify(nextPageFilters)
      let result: SearchResult<T> | null = null

      if (enableCache && searchCacheRef.current) {
        result = searchCacheRef.current.get(cacheKey)
      }

      if (!result) {
        result = await searchAPI(nextPageFilters)
        
        if (enableCache && searchCacheRef.current) {
          searchCacheRef.current.set(cacheKey, result)
        }
      }

      const highlightedResults = result.items.map(item => 
        highlightSearchFields(item, filters.query, searchFields, highlightOptions)
      )

      setResults(prev => [...prev, ...highlightedResults])
      setHasMore(result.hasMore)
      setFiltersState(nextPageFilters)

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载更多失败')
    } finally {
      setIsLoadingMore(false)
    }
  }, [filters, hasMore, isLoadingMore, searchAPI, searchFields, highlightOptions, enableCache])

  // 防抖搜索建议
  const debouncedGetSuggestions = useMemo(
    () => debounce(async (query: string) => {
      if (query.length < minQueryLength) {
        setSuggestions([])
        return
      }

      try {
        const cacheKey = `suggestions:${query}`
        let suggestions: SearchSuggestion[] | null = null

        if (enableCache && suggestionsCacheRef.current) {
          suggestions = suggestionsCacheRef.current.get(cacheKey)
        }

        if (!suggestions) {
          suggestions = await suggestionsAPI(query)
          
          if (enableCache && suggestionsCacheRef.current) {
            suggestionsCacheRef.current.set(cacheKey, suggestions)
          }
        }

        setSuggestions(suggestions.slice(0, maxSuggestions))
      } catch (err) {
        console.error('Failed to get suggestions:', err)
        setSuggestions([])
      }
    }, debounceDelay),
    [debounceDelay, minQueryLength, maxSuggestions, suggestionsAPI, enableCache]
  )

  // 获取搜索建议
  const getSuggestions = useCallback(async (query: string) => {
    debouncedGetSuggestions(query)
  }, [debouncedGetSuggestions])

  // 选择建议
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    const newFilters = { ...filters, query: suggestion.text }
    search(newFilters)
    setShowSuggestions(false)
    addToHistory(suggestion.text)
  }, [filters, search])

  // 清除建议
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setShowSuggestions(false)
  }, [])

  // 添加到历史
  const addToHistory = useCallback((query: string, results?: number) => {
    if (!query.trim()) return

    const newItem: SearchHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      results,
      filters: { ...filters }
    }

    const newHistory = [
      newItem,
      ...history.filter(item => item.query !== query.trim())
    ].slice(0, maxHistory)

    setHistory(newHistory)
    saveHistory(newHistory)
  }, [history, filters, maxHistory, saveHistory])

  // 选择历史
  const selectHistory = useCallback((item: SearchHistory) => {
    const newFilters = { ...filters, ...item.filters, query: item.query }
    search(newFilters)
    setShowHistory(false)
  }, [filters, search])

  // 从历史中删除
  const removeFromHistory = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    saveHistory(newHistory)
  }, [history, saveHistory])

  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('advancedSearchHistory')
  }, [])

  // 清除结果
  const clearResults = useCallback(() => {
    setResults([])
    setTotal(0)
    setHasMore(false)
    setError(null)
  }, [])

  // 清除缓存
  const clearCache = useCallback(() => {
    if (searchCacheRef.current) {
      searchCacheRef.current.clear()
    }
    if (suggestionsCacheRef.current) {
      suggestionsCacheRef.current.clear()
    }
    cacheHitsRef.current = 0
    cacheMissesRef.current = 0
  }, [])

  // 设置筛选器
  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedGetSuggestions.cancel()
    }
  }, [debouncedGetSuggestions])

  return {
    // 搜索状态
    filters,
    setFilters,
    
    // 搜索结果
    results,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    searchTime,
    
    // 搜索建议
    suggestions,
    showSuggestions,
    
    // 搜索历史
    history,
    showHistory,
    
    // 搜索操作
    search,
    loadMore,
    clearResults,
    
    // 建议操作
    getSuggestions,
    selectSuggestion,
    clearSuggestions,
    
    // 历史操作
    addToHistory,
    selectHistory,
    removeFromHistory,
    clearHistory,
    
    // 缓存操作
    clearCache,
    
    // 性能指标
    performanceMetrics
  }
}