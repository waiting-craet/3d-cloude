'use client'

import React, { useState, useEffect } from 'react'
import { GraphCard } from '@/lib/types/homepage-gallery'
import EnhancedWorkCard from './EnhancedWorkCard'
import styles from './ResponsiveWorkGrid.module.css'

interface ResponsiveWorkGridProps {
  works: GraphCard[]
  loading: boolean
  onWorkClick: (work: GraphCard) => void
  onWorkLike?: (workId: string) => void
  onWorkShare?: (work: GraphCard) => void
  gridColumns?: {
    mobile: number
    tablet: number
    desktop: number
    wide: number
    ultraWide?: number
  }
  className?: string
  theme?: 'light' | 'dark'
  spacing?: 'compact' | 'comfortable' | 'spacious'
  alignment?: 'start' | 'center' | 'end' | 'stretch'
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
  maxColumns?: number
  minCardWidth?: number
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9' | '3:2'
  loadingType?: 'skeleton' | 'spinner' | 'pulse' | 'shimmer'
  skeletonCount?: number
  loadingText?: string
  error?: string | null
  onRetry?: () => void
  emptyStateConfig?: {
    title?: string
    description?: string
    icon?: string
    actionText?: string
    onAction?: () => void
  }
}

interface GridConfig {
  columns: number
  gap: number
  minCardWidth: number
  maxColumns: number
}

// 响应式断点配置
const BREAKPOINTS = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  wide: { min: 1440, max: 1919 },
  ultraWide: { min: 1920, max: Infinity }
} as const

type BreakpointKey = keyof typeof BREAKPOINTS

const defaultGridColumns = {
  mobile: 1,
  tablet: 3,
  desktop: 4,
  wide: 6,
  ultraWide: 8
}

const ResponsiveWorkGrid: React.FC<ResponsiveWorkGridProps> = ({
  works,
  loading,
  onWorkClick,
  onWorkLike,
  onWorkShare,
  gridColumns = defaultGridColumns,
  className = '',
  theme = 'dark',
  spacing = 'comfortable',
  alignment = 'stretch',
  justifyContent = 'start',
  maxColumns = 8,
  minCardWidth = 280,
  aspectRatio = 'auto',
  loadingType = 'skeleton',
  skeletonCount,
  loadingText = '加载中...',
  error = null,
  onRetry,
  emptyStateConfig = {}
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('desktop')
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [isOnline, setIsOnline] = useState<boolean>(true)

  // 网络状态检测
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 响应式断点检测
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      setContainerWidth(width)
      
      // 根据断点配置确定当前断点
      for (const [breakpoint, config] of Object.entries(BREAKPOINTS)) {
        if (width >= config.min && width <= config.max) {
          setCurrentBreakpoint(breakpoint as BreakpointKey)
          break
        }
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  // 网格间距配置
  const getGridGap = () => {
    const spacingMap = {
      compact: { mobile: 12, tablet: 16, desktop: 20, wide: 24, ultraWide: 28 },
      comfortable: { mobile: 16, tablet: 20, desktop: 24, wide: 28, ultraWide: 32 },
      spacious: { mobile: 20, tablet: 24, desktop: 28, wide: 32, ultraWide: 36 }
    }
    
    return spacingMap[spacing][currentBreakpoint] || spacingMap[spacing].desktop
  }

  // 获取当前断点的网格配置
  const getGridConfig = (): GridConfig => {
    const baseColumns = gridColumns[currentBreakpoint] || gridColumns.desktop
    
    // 根据容器宽度动态调整列数
    const dynamicColumns = Math.min(
      Math.max(1, Math.floor(containerWidth / minCardWidth)),
      maxColumns,
      baseColumns
    )
    
    const gap = getGridGap()
    
    return {
      columns: dynamicColumns,
      gap,
      minCardWidth,
      maxColumns
    }
  }

  const gridConfig = getGridConfig()

  // 动态计算网格列数
  const getGridTemplateColumns = () => {
    const { columns } = gridConfig
    
    // 移动端特殊处理
    if (currentBreakpoint === 'mobile') {
      return '1fr'
    }
    
    // 使用固定列数或自适应
    if (containerWidth > 0) {
      // 计算每列的最小宽度，考虑间距
      const totalGap = (columns - 1) * gridConfig.gap
      const availableWidth = containerWidth - totalGap - 32 // 减去容器padding
      const columnWidth = Math.max(minCardWidth, availableWidth / columns)
      
      return `repeat(${columns}, minmax(${minCardWidth}px, ${columnWidth}px))`
    }
    
    // 回退到自适应布局
    return `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`
  }

  // 计算最优列数（基于容器宽度）
  const getOptimalColumns = () => {
    if (containerWidth === 0) return gridConfig.columns
    
    const gap = getGridGap()
    const containerPadding = 32 // 左右各16px
    const availableWidth = containerWidth - containerPadding
    
    // 计算可以容纳的最大列数
    const maxPossibleColumns = Math.floor((availableWidth + gap) / (minCardWidth + gap))
    
    // 限制在配置的范围内
    return Math.min(maxPossibleColumns, gridConfig.columns, maxColumns)
  }

  // 获取对齐样式
  const getAlignmentStyles = () => {
    const alignmentMap = {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      stretch: { justifyContent: 'stretch' }
    }
    
    const justifyMap = {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      'space-between': { justifyContent: 'space-between' },
      'space-around': { justifyContent: 'space-around' },
      'space-evenly': { justifyContent: 'space-evenly' }
    }
    
    return {
      ...alignmentMap[alignment] || alignmentMap.stretch,
      ...justifyMap[justifyContent] || justifyMap.start
    }
  }

  // 获取网格容器样式
  const getGridContainerStyles = () => {
    const alignmentStyles = getAlignmentStyles()
    
    return {
      gridTemplateColumns: getGridTemplateColumns(),
      gap: `${getGridGap()}px`,
      ...alignmentStyles,
      // 确保网格项目正确对齐
      justifyItems: alignment === 'stretch' ? 'stretch' : 'center',
      alignItems: alignment === 'stretch' ? 'stretch' : alignment
    }
  }

  // 主题配置
  const themeConfig = {
    background: theme === 'dark' ? '#2a2a2a' : '#ffffff',
    cardBackground: theme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: theme === 'dark' ? '#ffffff' : '#000000',
    subtext: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    skeleton: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  }

  // 调试信息（开发环境）
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null
    
    return (
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        <div>断点: {currentBreakpoint}</div>
        <div>宽度: {containerWidth}px</div>
        <div>列数: {getOptimalColumns()}</div>
        <div>间距: {getGridGap()}px</div>
        <div>最小宽度: {minCardWidth}px</div>
      </div>
    )
  }

  // 加载状态骨架屏
  const renderSkeletonCards = () => {
    const optimalColumns = getOptimalColumns()
    const count = skeletonCount || optimalColumns * 2 // 默认显示两行骨架屏
    
    return Array.from({ length: count }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className={styles['grid-item']}
        style={{
          animationDelay: `${index * 0.1}s`
        }}
      >
        <SkeletonCard theme={theme} aspectRatio={aspectRatio} loadingType={loadingType} />
      </div>
    ))
  }

  // 加载状态 - 旋转器
  const renderSpinnerLoading = () => (
    <div
      style={{
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 16px',
        minHeight: '400px'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: `4px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderTop: `4px solid #4A9EFF`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}
      />
      <p
        style={{
          color: themeConfig.subtext,
          fontSize: '14px'
        }}
      >
        {loadingText}
      </p>
    </div>
  )

  // 加载状态 - 脉冲
  const renderPulseLoading = () => (
    <div
      style={{
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 16px',
        minHeight: '400px'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#4A9EFF',
              borderRadius: '50%',
              animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </div>
      <p
        style={{
          color: themeConfig.subtext,
          fontSize: '14px'
        }}
      >
        {loadingText}
      </p>
    </div>
  )

  // 渲染加载状态
  const renderLoadingState = () => {
    switch (loadingType) {
      case 'spinner':
        return renderSpinnerLoading()
      case 'pulse':
        return renderPulseLoading()
      case 'shimmer':
      case 'skeleton':
      default:
        return renderSkeletonCards()
    }
  }

  // 空状态
  const renderEmptyState = () => {
    const {
      title = '暂无作品',
      description = '还没有找到符合条件的作品，试试调整筛选条件或创建第一个作品吧！',
      icon = '📊',
      actionText = '创建作品',
      onAction
    } = emptyStateConfig

    return (
      <div
        className={styles['empty-state']}
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 16px',
          textAlign: 'center',
          minHeight: '400px'
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: themeConfig.text,
            marginBottom: '8px'
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: themeConfig.subtext,
            maxWidth: '400px',
            lineHeight: '1.5',
            marginBottom: onAction ? '24px' : '0'
          }}
        >
          {description}
        </p>
        {onAction && (
          <button
            onClick={onAction}
            style={{
              background: '#4A9EFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b82f6'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4A9EFF'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {actionText}
          </button>
        )}
      </div>
    )
  }

  // 错误状态
  const renderErrorState = () => {
    const isNetworkError = !isOnline || (error && error.includes('网络'))
    const errorIcon = isNetworkError ? '📡' : '⚠️'
    const errorTitle = isNetworkError ? '网络连接异常' : '加载失败'
    const errorMessage = isNetworkError 
      ? '请检查网络连接后重试' 
      : (error || '发生了未知错误，请稍后重试')

    return (
      <div
        className={styles['error-state']}
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 16px',
          textAlign: 'center',
          minHeight: '400px'
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{errorIcon}</div>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '8px'
          }}
        >
          {errorTitle}
        </h3>
        <p
          style={{
            color: themeConfig.subtext,
            maxWidth: '400px',
            lineHeight: '1.5',
            marginBottom: '16px'
          }}
        >
          {errorMessage}
        </p>
        
        {/* 网络状态指示器 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: onRetry ? '24px' : '0',
            padding: '8px 16px',
            borderRadius: '20px',
            background: isOnline 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            color: isOnline ? '#22c55e' : '#ef4444',
            fontSize: '14px'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isOnline ? '#22c55e' : '#ef4444'
            }}
          />
          <span>{isOnline ? '网络已连接' : '网络已断开'}</span>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={!isOnline}
            style={{
              background: isOnline ? '#ef4444' : 'rgba(239, 68, 68, 0.5)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isOnline ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: isOnline ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (isOnline) {
                e.currentTarget.style.background = '#dc2626'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (isOnline) {
                e.currentTarget.style.background = '#ef4444'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {isOnline ? '重试' : '等待网络连接'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {renderDebugInfo()}
      <div
        className={`${styles['responsive-work-grid']} ${className}`}
        style={{
          width: '100%'
        }}
      >
        <div
          className={`${styles['work-grid']} ${styles[spacing]} ${styles[`align-${alignment}`]} ${styles[`justify-${justifyContent}`]}`}
          style={getGridContainerStyles()}
        >
          {loading ? (
            <div className={styles['loading-grid']}>
              {renderLoadingState()}
            </div>
          ) : error ? (
            <div className={styles['error-grid']}>
              {renderErrorState()}
            </div>
          ) : works.length === 0 ? (
            <div className={styles['empty-grid']}>
              {renderEmptyState()}
            </div>
          ) : (
            works.map((work, index) => (
              <div
                key={work.id}
                className={styles['grid-item']}
                style={{
                  // 添加交错动画延迟
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <EnhancedWorkCard
                  work={work}
                  onClick={() => onWorkClick(work)}
                  onLike={onWorkLike ? () => onWorkLike(work.id) : undefined}
                  onShare={onWorkShare ? () => onWorkShare(work) : undefined}
                  theme={theme}
                  aspectRatio={aspectRatio}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// 骨架屏卡片
interface SkeletonCardProps {
  theme?: 'light' | 'dark'
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9' | '3:2'
  loadingType?: 'skeleton' | 'spinner' | 'pulse' | 'shimmer'
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  theme = 'dark', 
  aspectRatio = 'auto',
  loadingType = 'skeleton'
}) => {
  const themeConfig = {
    cardBackground: theme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    skeleton: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shimmer: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  }

  // 获取缩略图宽高比
  const getThumbnailAspectRatio = () => {
    const ratioMap = {
      auto: '75%', // 默认 4:3
      square: '100%', // 1:1
      '4:3': '75%', // 4:3
      '16:9': '56.25%', // 16:9
      '3:2': '66.67%' // 3:2
    }
    
    return ratioMap[aspectRatio] || ratioMap.auto
  }

  // 创建骨架屏元素
  const createSkeletonElement = (width: string = '100%', height: string = '16px', marginBottom: string = '8px') => (
    <div
      style={{
        width,
        height,
        background: themeConfig.skeleton,
        borderRadius: '4px',
        marginBottom,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {loadingType === 'shimmer' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${themeConfig.shimmer}, transparent)`,
            animation: 'shimmer 2s infinite'
          }}
        />
      )}
    </div>
  )

  return (
    <div
      style={{
        background: themeConfig.cardBackground,
        border: `1px solid ${themeConfig.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* 缩略图骨架屏 */}
      <div
        style={{
          width: '100%',
          paddingBottom: getThumbnailAspectRatio(),
          background: themeConfig.skeleton,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {loadingType === 'shimmer' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${themeConfig.shimmer}, transparent)`,
              animation: 'shimmer 2s infinite'
            }}
          />
        )}
        {loadingType === 'pulse' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: themeConfig.skeleton,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>
      
      {/* 内容骨架屏 */}
      <div style={{ padding: '16px' }}>
        {/* 标题 */}
        {createSkeletonElement('100%', '20px', '8px')}
        
        {/* 描述 */}
        {createSkeletonElement('100%', '16px', '8px')}
        {createSkeletonElement('75%', '16px', '12px')}
        
        {/* 标签 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {createSkeletonElement('48px', '24px', '0')}
          {createSkeletonElement('64px', '24px', '0')}
        </div>
        
        {/* 创建者信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                background: themeConfig.skeleton,
                borderRadius: '50%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {loadingType === 'shimmer' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(90deg, transparent, ${themeConfig.shimmer}, transparent)`,
                    animation: 'shimmer 2s infinite'
                  }}
                />
              )}
            </div>
            {createSkeletonElement('80px', '16px', '0')}
          </div>
          {createSkeletonElement('32px', '16px', '0')}
        </div>
        
        {/* 统计信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${themeConfig.cardBorder}` }}>
          {createSkeletonElement('60px', '12px', '0')}
          {createSkeletonElement('60px', '12px', '0')}
          {createSkeletonElement('60px', '12px', '0')}
        </div>
      </div>
    </div>
  )
}

// 图片骨架屏
interface ImageSkeletonProps {
  theme?: 'light' | 'dark'
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ theme = 'dark' }) => {
  const themeConfig = {
    skeleton: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: themeConfig.skeleton,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)`,
          animation: 'shimmer 2s infinite'
        }}
      />
      <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '32px' }}>📷</div>
    </div>
  )
}

export default ResponsiveWorkGrid