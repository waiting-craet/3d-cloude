import React, { useState, useCallback, useRef, useEffect } from 'react'
import styles from './HeroSection.module.css'

export interface HeroSectionProps {
  title: string
  subtitle: string
  onSearch?: (query: string) => void
}

/**
 * HeroSection Component
 * 
 * The primary content area displaying the main title, subtitle, and search functionality.
 * Features a subtle gradient background and centered layout with generous spacing.
 * 
 * Performance optimizations:
 * - Debounced search input (300ms delay) to reduce unnecessary function calls
 * - Memoized event handlers with useCallback
 * - Component memoization to prevent re-renders when props don't change
 * 
 * @param title - Main heading text
 * @param subtitle - Descriptive subtitle text
 * @param onSearch - Optional callback when search is triggered (debounced)
 */
const HeroSectionComponent = ({ title, subtitle, onSearch }: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Debounce search callback
    if (onSearch) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        if (value.trim()) {
          onSearch(value.trim())
        }
      }, 300) // 300ms debounce delay
    }
  }, [onSearch])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any pending debounced calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Immediately trigger search on form submit
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }, [onSearch, searchQuery])

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
          <svg 
            className={styles.searchIcon} 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
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
            type="text"
            placeholder="搜索知识图谱..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="搜索知识图谱"
          />
        </form>
      </div>
    </section>
  )
}

// Memoize component to prevent unnecessary re-renders
const HeroSection = React.memo(HeroSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle
    // Note: onSearch is intentionally not compared as it's typically a stable callback
  )
})

HeroSection.displayName = 'HeroSection'

export default HeroSection
