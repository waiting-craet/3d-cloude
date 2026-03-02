'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/userStore'
import styles from './HeroSection.module.css'

// TypeScript interfaces for the component
export interface HeroSectionProps {
  title?: string
  subtitle?: string
  primaryAction?: {
    text: string
    onClick: () => void
    disabled?: boolean
  }
  secondaryAction?: {
    text: string
    onClick: () => void
  }
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onSearchSubmit?: () => void
  backgroundType?: 'gradient' | 'image' | 'pattern' | 'solid'
  backgroundImage?: string
  theme?: 'light' | 'dark'
  className?: string
  showSearch?: boolean
  animated?: boolean
}

interface SearchBarProps {
  query: string
  onChange: (query: string) => void
  onSubmit: () => void
  placeholder?: string
  theme?: 'light' | 'dark'
}

// 搜索栏组件
const SearchBar: React.FC<SearchBarProps> = ({ 
  query, 
  onChange, 
  onSubmit, 
  placeholder = "搜索知识图谱",
  theme = 'light'
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={styles.searchWrapper}>
      <div
        className={`
          ${styles.searchBox} 
          ${theme === 'dark' ? styles.searchBoxDark : styles.searchBoxLight}
          ${isFocused ? styles.searchBoxFocused : ''}
          ${isFocused && theme === 'dark' ? styles.searchBoxFocusedDark : ''}
          ${isFocused && theme === 'light' ? styles.searchBoxFocusedLight : ''}
        `}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            ${styles.searchInput} 
            ${theme === 'dark' ? styles.searchInputDark : styles.searchInputLight}
          `}
        />
        <button
          onClick={onSubmit}
          className={styles.searchButton}
          aria-label="搜索"
        >
          🔍
        </button>
      </div>
    </div>
  )
}

// 主要 HeroSection 组件
const HeroSection: React.FC<HeroSectionProps> = ({
  title = "知识图谱作品广场",
  subtitle = "发现、创建和分享知识的无限可能",
  primaryAction,
  secondaryAction,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  backgroundType = 'gradient',
  backgroundImage,
  theme = 'light',
  className = '',
  showSearch = true,
  animated = true
}) => {
  const router = useRouter()
  const { isLoggedIn } = useUserStore()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [isVisible, setIsVisible] = useState(false)

  // 动画效果
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [animated])

  // 更新本地搜索查询
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query)
    onSearchChange?.(query)
  }

  const handleSearchSubmit = () => {
    onSearchSubmit?.()
  }

  // 默认主要操作
  const defaultPrimaryAction = {
    text: "开始创作",
    onClick: () => {
      if (!isLoggedIn) {
        alert('请先登录后再开始创作')
        return
      }
      router.push('/creation')
    },
    disabled: !isLoggedIn
  }

  // 默认次要操作
  const defaultSecondaryAction = secondaryAction !== null ? {
    text: "浏览作品",
    onClick: () => {
      // 滚动到作品区域
      const worksSection = document.querySelector('[data-works-section]')
      if (worksSection) {
        worksSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  } : null

  const finalPrimaryAction = primaryAction || defaultPrimaryAction
  const finalSecondaryAction = secondaryAction || defaultSecondaryAction

  // 背景样式配置
  const getBackgroundClasses = () => {
    const baseClass = styles.heroSection
    
    switch (backgroundType) {
      case 'gradient':
        return `${baseClass} ${theme === 'dark' ? styles.backgroundGradientDark : styles.backgroundGradient}`
      case 'pattern':
        return `${baseClass} ${theme === 'dark' ? styles.backgroundPatternDark : styles.backgroundPattern}`
      case 'solid':
      default:
        return `${baseClass} ${theme === 'dark' ? styles.backgroundSolidDark : styles.backgroundSolid}`
    }
  }

  const getBackgroundStyle = () => {
    if (backgroundType === 'image' && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return {}
  }

  return (
    <section
      className={`${getBackgroundClasses()} ${className}`}
      style={getBackgroundStyle()}
    >
      {/* 背景装饰元素 */}
      {backgroundType === 'gradient' && animated && (
        <>
          <div className={styles.floatingElement1} />
          <div className={styles.floatingElement2} />
          <div className={styles.floatingElement3} />
        </>
      )}

      {/* 主要内容 */}
      <div
        className={`
          ${styles.heroContent} 
          ${isVisible ? styles.heroContentVisible : styles.heroContentHidden}
        `}
      >
        {/* 主标题 */}
        <h1
          className={`
            ${styles.heroTitle}
            ${backgroundType === 'gradient' ? styles.heroTitleGradient : ''}
            ${theme === 'dark' ? styles.heroTitleDark : styles.heroTitleLight}
          `}
        >
          {title}
        </h1>

        {/* 副标题 */}
        <p
          className={`
            ${styles.heroSubtitle}
            ${theme === 'dark' ? styles.heroSubtitleDark : styles.heroSubtitleLight}
          `}
        >
          {subtitle}
        </p>

        {/* 搜索栏 */}
        {showSearch && (
          <div className={styles.searchContainer}>
            <SearchBar
              query={localSearchQuery}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              theme={theme}
            />
          </div>
        )}

        {/* 行动按钮 */}
        <div className={styles.buttonContainer}>
          {/* 主要按钮 */}
          <button
            onClick={finalPrimaryAction.onClick}
            disabled={finalPrimaryAction.disabled}
            className={`
              ${styles.primaryButton}
              ${finalPrimaryAction.disabled ? styles.primaryButtonDisabled : ''}
            `}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {finalPrimaryAction.text}
            </span>
            {/* 按钮光效 */}
            {!finalPrimaryAction.disabled && (
              <div className={styles.buttonShimmer} />
            )}
          </button>

          {/* 次要按钮 */}
          {finalSecondaryAction && finalSecondaryAction.text && (
            <button
              onClick={finalSecondaryAction.onClick}
              className={styles.secondaryButton}
            >
              {finalSecondaryAction.text}
            </button>
          )}
        </div>

        {/* 特性标签 */}
        <div className={styles.featuresContainer}>
          {[
            { icon: '🎯', text: '3D可视化' },
            { icon: '🚀', text: '快速创建' },
            { icon: '🤝', text: '协作分享' },
            { icon: '📊', text: '数据驱动' }
          ].map((feature, index) => (
            <div
              key={index}
              className={`
                ${styles.featureItem}
                ${theme === 'dark' ? styles.featureItemDark : styles.featureItemLight}
              `}
            >
              <span className={styles.featureIcon}>{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection