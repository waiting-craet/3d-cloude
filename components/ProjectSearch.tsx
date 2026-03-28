'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './ProjectSearch.module.css'

export interface SearchResult {
  type: 'project' | 'graph'
  projectId: string
  projectName: string
  graphId?: string
  graphName?: string
  matchedText: string
}

export interface ProjectSearchProps {
  onSearchResults: (results: SearchResult[]) => void
  onClear: () => void
}

// 简单的防抖函数实现
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function ProjectSearch({ onSearchResults, onClear }: ProjectSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // 搜索函数
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      onClear()
      return
    }

    try {
      setIsSearching(true)
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}&type=projects`)
      if (!response.ok) {
        throw new Error('搜索失败')
      }
      
      const data = await response.json()
      onSearchResults(data.results || [])
    } catch (error) {
      console.error('搜索错误:', error)
      onSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      performSearch(term)
    }, 300),
    [onSearchResults, onClear]
  )

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // 清除搜索
  const handleClear = () => {
    setSearchTerm('')
    onClear()
  }

  // 清理防抖函数
  useEffect(() => {
    return () => {
      // 清理函数在组件卸载时调用
    }
  }, [])

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper}>
        <div className={styles.searchIcon}>
          {isSearching ? (
            <div className={styles.searchSpinner}></div>
          ) : (
            <span>🔍</span>
          )}
        </div>
        <input
          type="text"
          placeholder="搜索项目或图谱..."
          value={searchTerm}
          onChange={handleInputChange}
          className={styles.searchInput}
          autoComplete="off"
          spellCheck="false"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="清除搜索"
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}