import { useState, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { SearchSuggestion } from '@/lib/types/homepage-gallery'

interface UseGallerySearchOptions {
  debounceMs?: number
  limit?: number
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('搜索失败')
  return res.json()
})

export function useGallerySearch(options: UseGallerySearchOptions = {}) {
  const { debounceMs = 300, limit = 10 } = options

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 使用 SWR 进行搜索结果缓存
  const { data, error, isLoading, mutate } = useSWR<{ data: SearchSuggestion[] }>(
    debouncedQuery ? `/api/gallery/search?q=${encodeURIComponent(debouncedQuery)}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 秒内不重复请求
      errorRetryCount: 2,
      errorRetryInterval: 3000,
    }
  )

  const search = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery)

      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // 如果查询为空，清空建议
      if (!searchQuery.trim()) {
        setDebouncedQuery('')
        return
      }

      // 设置新的定时器
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery)
      }, debounceMs)
    },
    [debounceMs]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return {
    query,
    suggestions: data?.data || [],
    isLoading,
    error: error?.message || null,
    search,
    clearSearch,
    mutate,
  }
}
