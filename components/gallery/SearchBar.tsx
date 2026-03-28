'use client'

import { useState, useRef, useEffect } from 'react'
import { useGallerySearch } from '@/lib/hooks/useGallerySearch'
import { SearchSuggestion } from '@/lib/types/homepage-gallery'

interface SearchBarProps {
  onSearch: (query: string) => void
  onSuggestionClick: (suggestion: SearchSuggestion) => void
  theme?: 'light' | 'dark'
}

export default function SearchBar({
  onSearch,
  onSuggestionClick,
  theme = 'dark',
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { query, suggestions, isLoading, search, clearSearch } = useGallerySearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const themeConfig = {
    inputBackground: theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.05)',
    inputBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    inputText: theme === 'dark' ? '#ffffff' : '#000000',
    inputPlaceholder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(0, 0, 0, 0.5)',
    suggestionsBackground: theme === 'dark'
      ? 'rgba(30, 30, 30, 0.98)'
      : 'rgba(255, 255, 255, 0.98)',
    suggestionsBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    suggestionHover: theme === 'dark'
      ? 'rgba(74, 158, 255, 0.15)'
      : 'rgba(74, 158, 255, 0.1)',
  }

  // 点击外部关闭建议
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    search(value)
    setShowSuggestions(true)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      clearSearch()
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion)
    clearSearch()
    setShowSuggestions(false)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索图谱、用户、标签..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => query && setShowSuggestions(true)}
          style={{
            width: '100%',
            padding: '10px 16px 10px 40px',
            background: themeConfig.inputBackground,
            border: `1px solid ${themeConfig.inputBorder}`,
            borderRadius: '8px',
            color: themeConfig.inputText,
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = theme === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = themeConfig.inputBackground
            e.currentTarget.style.borderColor = themeConfig.inputBorder
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: themeConfig.inputPlaceholder,
          }}
        >
          🔍
        </span>
      </div>

      {/* 搜索建议下拉框 */}
      {showSuggestions && query && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: themeConfig.suggestionsBackground,
            border: `1px solid ${themeConfig.suggestionsBorder}`,
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: themeConfig.inputPlaceholder,
              }}
            >
              加载中...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${themeConfig.suggestionsBorder}`,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = themeConfig.suggestionHover
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{suggestion.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: themeConfig.inputText,
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px',
                      }}
                    >
                      {suggestion.title}
                    </div>
                    {suggestion.description && (
                      <div
                        style={{
                          color: themeConfig.inputPlaceholder,
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: themeConfig.inputPlaceholder,
              }}
            >
              未找到相关结果
            </div>
          )}
        </div>
      )}
    </div>
  )
}
