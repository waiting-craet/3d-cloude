'use client'

import React, { useState, useCallback } from 'react'
import { GraphCard } from '@/lib/types/homepage-gallery'
import styles from './EnhancedWorkCard.module.css'

export interface EnhancedWorkCardProps {
  work: GraphCard
  onClick: () => void
  onLike?: () => void
  onShare?: () => void
  featured?: boolean
  size?: 'small' | 'medium' | 'large'
  theme?: 'light' | 'dark'
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9' | '3:2'
  className?: string
  showStats?: boolean
  showTags?: boolean
  maxTags?: number
  lazyLoad?: boolean
  placeholder?: string
}

const EnhancedWorkCard: React.FC<EnhancedWorkCardProps> = ({
  work,
  onClick,
  onLike,
  onShare,
  featured = false,
  size = 'medium',
  theme = 'dark',
  aspectRatio = 'auto',
  className = '',
  showStats = true,
  showTags = true,
  maxTags = 3,
  lazyLoad = true,
  placeholder
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
    setImageLoaded(true)
  }, [])

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    onLike?.()
  }, [isLiked, onLike])

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.()
  }, [onShare])

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

  // 主题配置
  const themeConfig = {
    cardBackground: theme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    cardHoverBackground: theme === 'dark' ? 'rgba(50, 50, 50, 0.95)' : 'rgba(248, 248, 248, 0.95)',
    text: theme === 'dark' ? '#ffffff' : '#000000',
    subtext: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    tagBackground: theme === 'dark' ? 'rgba(74, 158, 255, 0.15)' : 'rgba(74, 158, 255, 0.1)',
    tagText: '#4A9EFF',
    imagePlaceholder: theme === 'dark' 
      ? 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(74, 158, 255, 0.05) 100%)' 
      : 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(74, 158, 255, 0.05) 100%)'
  }

  // 尺寸配置
  const sizeConfig = {
    small: { padding: '12px', titleSize: '14px', descSize: '12px', tagSize: '10px' },
    medium: { padding: '16px', titleSize: '16px', descSize: '13px', tagSize: '11px' },
    large: { padding: '20px', titleSize: '18px', descSize: '14px', tagSize: '12px' }
  }

  const currentSize = sizeConfig[size]

  return (
    <div
      className={`${styles.enhancedWorkCard} ${className}`}
      style={{
        background: isHovered ? themeConfig.cardHoverBackground : themeConfig.cardBackground,
        border: `1px solid ${themeConfig.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 12px 24px rgba(74, 158, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...(featured && {
          border: '2px solid rgba(74, 158, 255, 0.5)',
          boxShadow: isHovered
            ? '0 16px 32px rgba(74, 158, 255, 0.3), 0 8px 16px rgba(0, 0, 0, 0.15)'
            : '0 0 20px rgba(74, 158, 255, 0.3)'
        })
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`查看作品: ${work.title}`}
    >
      {/* 缩略图区域 */}
      <div
        className={styles.thumbnailContainer}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: getThumbnailAspectRatio(),
          background: themeConfig.imagePlaceholder,
          overflow: 'hidden'
        }}
      >
        {!imageError && work.thumbnail ? (
          <>
            {!imageLoaded && (
              <div className={styles.imageSkeleton}>
                <div className={styles.shimmer} />
                <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '32px' }}>📷</div>
              </div>
            )}
            <img
              src={work.thumbnail}
              alt={work.title}
              className={styles.thumbnailImage}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all 0.3s ease',
                opacity: imageLoaded ? 1 : 0,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={lazyLoad ? 'lazy' : 'eager'}
            />
          </>
        ) : (
          <div
            className={styles.placeholderIcon}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: themeConfig.subtext
            }}
          >
            {placeholder || (work.type === '3d' ? '🎯' : '📊')}
          </div>
        )}

        {/* 类型标签 */}
        <div
          className={styles.typeLabel}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{work.type === '3d' ? '🎯' : '📊'}</span>
          <span>{work.type.toUpperCase()}</span>
        </div>

        {/* 特色标签 */}
        {featured && (
          <div
            className={styles.featuredLabel}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(255, 193, 7, 0.9)',
              padding: '6px 12px',
              borderRadius: '6px',
              color: '#000',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⭐</span>
            <span>特色</span>
          </div>
        )}

        {/* 模板标签 */}
        {work.isTemplate && (
          <div
            className={styles.templateLabel}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(34, 197, 94, 0.9)',
              padding: '6px 12px',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span>
            <span>模板</span>
          </div>
        )}

        {/* 悬停时的操作按钮 */}
        {isHovered && (
          <div
            className={styles.actionButtons}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px'
            }}
          >
            {onLike && (
              <button
                onClick={handleLike}
                className={styles.actionButton}
                style={{
                  background: isLiked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={isLiked ? '取消点赞' : '点赞'}
              >
                <span style={{ fontSize: '16px' }}>{isLiked ? '❤️' : '🤍'}</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={handleShare}
                className={styles.actionButton}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="分享作品"
              >
                <span style={{ fontSize: '16px' }}>🔗</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div 
        className={styles.contentArea}
        style={{ 
          padding: currentSize.padding, 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1 
        }}
      >
        {/* 标题 */}
        <h3
          className={styles.title}
          style={{
            color: themeConfig.text,
            fontSize: currentSize.titleSize,
            fontWeight: '600',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={work.title}
        >
          {work.title}
        </h3>

        {/* 描述 */}
        <p
          className={styles.description}
          style={{
            color: themeConfig.subtext,
            fontSize: currentSize.descSize,
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            flex: 1,
            lineHeight: '1.4'
          }}
          title={work.description}
        >
          {work.description || '暂无描述'}
        </p>

        {/* 标签 */}
        {showTags && work.tags && work.tags.length > 0 && (
          <div
            className={styles.tagsContainer}
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}
          >
            {work.tags.slice(0, maxTags).map((tag, index) => (
              <span
                key={index}
                className={styles.tag}
                style={{
                  background: themeConfig.tagBackground,
                  color: themeConfig.tagText,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: currentSize.tagSize,
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={tag}
              >
                #{tag}
              </span>
            ))}
            {work.tags.length > maxTags && (
              <span
                className={styles.moreTagsIndicator}
                style={{
                  color: themeConfig.subtext,
                  fontSize: currentSize.tagSize,
                  fontWeight: '500'
                }}
              >
                +{work.tags.length - maxTags}
              </span>
            )}
          </div>
        )}

        {/* 创建者信息 */}
        <div
          className={styles.creatorInfo}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: `1px solid ${themeConfig.cardBorder}`,
            color: themeConfig.subtext,
            fontSize: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden',
              flex: 1
            }}
          >
            {work.creator.avatar ? (
              <img
                src={work.creator.avatar}
                alt={work.creator.name}
                className={styles.creatorAvatar}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div
                className={styles.defaultAvatar}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: themeConfig.cardBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                👤
              </div>
            )}
            <div
              className={styles.creatorName}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={work.creator.name}
            >
              {work.creator.name}
            </div>
          </div>

          {/* 点赞数 */}
          <div
            className={styles.likesCount}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>👍</span>
            <span>{work.likes}</span>
          </div>
        </div>

        {/* 统计信息 */}
        {showStats && (
          <div
            className={styles.statsInfo}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: `1px solid ${themeConfig.cardBorder}`,
              color: themeConfig.subtext,
              fontSize: '11px'
            }}
          >
            <div>
              <span>📍 {work.nodeCount} 节点</span>
            </div>
            <div>
              <span>🔗 {work.edgeCount} 关系</span>
            </div>
            <div>
              <span>👁️ {work.views} 浏览</span>
            </div>
          </div>
        )}

        {/* 创建时间 */}
        <div
          className={styles.createdTime}
          style={{
            marginTop: '8px',
            color: themeConfig.subtext,
            fontSize: '11px',
            textAlign: 'right'
          }}
        >
          {new Date(work.createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  )
}

export default EnhancedWorkCard