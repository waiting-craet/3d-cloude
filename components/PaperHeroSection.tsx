'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import styles from './PaperHeroSection.module.css'

interface SearchSuggestion {
  id: string
  type: 'project' | 'graph'
  name: string
  description?: string | null
  projectName?: string
  projectId?: string
  nodeCount: number
  edgeCount: number
}

interface PaperHeroSectionProps {
  title: string
  subtitle: string
  onSearch?: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

const PaperHeroSection = React.memo(function PaperHeroSection({
  title,
  subtitle,
  onSearch,
  onSuggestionSelect,
}: PaperHeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [listboxId] = useState('search-suggestions-listbox')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=6`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(data.suggestions?.length > 0)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceQuery.trim().length >= 1) {
      fetchSuggestions(debounceQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debounceQuery, fetchSuggestions])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    if (onSearch) {
      onSearch(newValue)
    }
  }, [onSearch])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery && onSearch) {
      setShowSuggestions(false)
      onSearch(trimmedQuery)
    }
  }, [searchQuery, onSearch])

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setShowSuggestions(false)
    setSearchQuery(suggestion.name)
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    }
  }, [onSuggestionSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearchSubmit(e)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick, handleSearchSubmit])

  const handleInputFocus = useCallback(() => {
    if (searchQuery.trim().length >= 1 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [searchQuery, suggestions])

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    )
  }, [])

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        
        <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
          <svg 
            className={styles.searchIcon}
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="搜索智构红图 能够生成文档的工具"
            className={styles.searchInput}
            aria-label="搜索智构红图"
            aria-expanded={showSuggestions}
            aria-autocomplete="list"
            aria-controls={listboxId}
            role="combobox"
          />
          <button
            type="submit"
            className={styles.searchButton}
            aria-label="搜索"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="rotate(-90 10 10)"
              />
            </svg>
          </button>

          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              id={listboxId}
              className={styles.suggestionsDropdown}
              role="listbox"
            >
              {isLoading ? (
                <div className={styles.suggestionLoading}>
                  <span className={styles.loadingSpinner}></span>
                  搜索中...
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    className={`${styles.suggestionItem} ${index === selectedIndex ? styles.suggestionItemActive : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <div className={styles.suggestionIcon}>
                      {suggestion.type === 'project' ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                            stroke="#6B8E85"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 20H20"
                            stroke="#8BA69A"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <rect x="6" y="11" width="3" height="7" rx="1" fill="#8BA69A" />
                          <rect x="11" y="8" width="3" height="10" rx="1" fill="#6B8E85" />
                          <rect x="16" y="5" width="3" height="13" rx="1" fill="#3D5A50" />
                        </svg>
                      )}
                    </div>
                    <div className={styles.suggestionContent}>
                      <div className={styles.suggestionTitle}>
                        {highlightMatch(suggestion.name, searchQuery)}
                        <span className={styles.suggestionType}>
                          {suggestion.type === 'project' ? '项目' : '图谱'}
                        </span>
                      </div>
                      {suggestion.projectName && suggestion.type === 'graph' && (
                        <div className={styles.suggestionProject}>
                          {highlightMatch(suggestion.projectName, searchQuery)}
                        </div>
                      )}
                      {suggestion.description && (
                        <div className={styles.suggestionDescription}>
                          {highlightMatch(suggestion.description.slice(0, 50), searchQuery)}
                          {suggestion.description.length > 50 ? '...' : ''}
                        </div>
                      )}
                      <div className={styles.suggestionStats}>
                        <span>{suggestion.nodeCount} 节点</span>
                        <span className={styles.statsSeparator}>•</span>
                        <span>{suggestion.edgeCount} 关系</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  )
})

PaperHeroSection.displayName = 'PaperHeroSection'

export default PaperHeroSection
