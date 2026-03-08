'use client'

import React, { useState, useCallback } from 'react'
import styles from './PaperHeroSection.module.css'

interface PaperHeroSectionProps {
  title: string
  subtitle: string
  onSearch?: (query: string) => void
}

/**
 * PaperHeroSection Component
 * 
 * Hero section with warm paper-white aesthetic.
 * Features centered layout with title, subtitle, and search.
 */
const PaperHeroSection = React.memo(function PaperHeroSection({
  title,
  subtitle,
  onSearch,
}: PaperHeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery && onSearch) {
      onSearch(trimmedQuery)
    }
  }, [searchQuery, onSearch])

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
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索知识图谱 能够生成文档的工具"
            className={styles.searchInput}
            aria-label="搜索知识图谱"
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
        </form>
      </div>
    </section>
  )
})

PaperHeroSection.displayName = 'PaperHeroSection'

export default PaperHeroSection
