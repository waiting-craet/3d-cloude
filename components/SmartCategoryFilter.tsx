'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './SmartCategoryFilter.module.css'

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface SmartCategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  workCount: Record<string, number>
  loading?: boolean
  showCount?: boolean
  animated?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'pills' | 'tabs'
}

export default function SmartCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  workCount,
  loading = false,
  showCount = true,
  animated = true,
  size = 'medium',
  variant = 'pills'
}: SmartCategoryFilterProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 键盘导航处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          setFocusedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : categories.length - 1
            buttonRefs.current[newIndex]?.focus()
            return newIndex
          })
          break
        case 'ArrowRight':
          event.preventDefault()
          setFocusedIndex(prev => {
            const newIndex = prev < categories.length - 1 ? prev + 1 : 0
            buttonRefs.current[newIndex]?.focus()
            return newIndex
          })
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0) {
            onCategoryChange(categories[focusedIndex].id)
          }
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          buttonRefs.current[0]?.focus()
          break
        case 'End':
          event.preventDefault()
          const lastIndex = categories.length - 1
          setFocusedIndex(lastIndex)
          buttonRefs.current[lastIndex]?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [categories, focusedIndex, onCategoryChange])

  const handleCategoryClick = (categoryId: string, index: number) => {
    onCategoryChange(categoryId)
    setFocusedIndex(index)
  }

  const handleButtonFocus = (index: number) => {
    setFocusedIndex(index)
  }

  const getButtonClassName = (categoryId: string) => {
    const baseClasses = [
      styles.categoryButton,
      styles[`size-${size}`],
      styles[`variant-${variant}`]
    ]

    if (selectedCategory === categoryId) {
      baseClasses.push(styles.selected)
    }

    if (animated) {
      baseClasses.push(styles.animated)
    }

    if (loading) {
      baseClasses.push(styles.loading)
    }

    return baseClasses.join(' ')
  }

  const getWorkCount = (categoryId: string) => {
    return workCount[categoryId] || 0
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${styles[`variant-${variant}`]}`}
      role="tablist"
      aria-label="分类筛选器"
    >
      {categories.map((category, index) => (
        <button
          key={category.id}
          ref={el => buttonRefs.current[index] = el}
          className={getButtonClassName(category.id)}
          onClick={() => handleCategoryClick(category.id, index)}
          onFocus={() => handleButtonFocus(index)}
          role="tab"
          aria-selected={selectedCategory === category.id}
          aria-controls={`category-panel-${category.id}`}
          tabIndex={selectedCategory === category.id ? 0 : -1}
          disabled={loading}
          style={{
            '--category-color': category.color || '#00bfa5'
          } as React.CSSProperties}
        >
          {category.icon && (
            <span className={styles.icon} aria-hidden="true">
              {category.icon}
            </span>
          )}
          
          <span className={styles.name}>
            {category.name}
          </span>
          
          {showCount && (
            <span 
              className={styles.count}
              aria-label={`${getWorkCount(category.id)} 个作品`}
            >
              {loading ? (
                <span className={styles.countSkeleton} />
              ) : (
                getWorkCount(category.id)
              )}
            </span>
          )}
          
          {selectedCategory === category.id && animated && (
            <span className={styles.activeIndicator} aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  )
}