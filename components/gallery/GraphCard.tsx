'use client'

import { useState } from 'react'
import { GraphCard as GraphCardType } from '@/lib/types/homepage-gallery'
import UIIcon from '../UIIcon'

interface GraphCardProps {
  graph: GraphCardType
  onClick: () => void
  theme?: 'light' | 'dark'
}

export default function GraphCard({
  graph,
  onClick,
  theme = 'dark',
}: GraphCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const themeConfig = {
    cardBackground: theme === 'dark'
      ? 'rgba(30, 30, 30, 0.8)'
      : 'rgba(255, 255, 255, 0.8)',
    cardBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',
    cardHoverBackground: theme === 'dark'
      ? 'rgba(40, 40, 40, 0.9)'
      : 'rgba(245, 245, 245, 0.9)',
    text: theme === 'dark' ? '#ffffff' : '#000000',
    subtext: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(0, 0, 0, 0.6)',
    tagBackground: theme === 'dark'
      ? 'rgba(74, 158, 255, 0.15)'
      : 'rgba(74, 158, 255, 0.1)',
    tagText: '#4A9EFF',
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? themeConfig.cardHoverBackground : themeConfig.cardBackground,
        border: `1px solid ${themeConfig.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 12px 24px rgba(74, 158, 255, 0.2)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 缩略图 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '66.67%', // 3:2 宽高比
          background: 'linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(74, 158, 255, 0.05) 100%)',
          overflow: 'hidden',
        }}
      >
        {graph.thumbnail ? (
          <img
            src={graph.thumbnail}
            alt={graph.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div
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
            }}
          >
            {graph.type === '3d' ? <UIIcon name="target" size={48} /> : <UIIcon name="chart" size={48} />}
          </div>
        )}

        {/* 类型标签 */}
        <div
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
            gap: '6px',
          }}
        >
          <span style={{ display: 'inline-flex' }}>
            {graph.type === '3d' ? <UIIcon name="target" size={14} /> : <UIIcon name="chart" size={14} />}
          </span>
          <span>{graph.type === '3d' ? '3D' : '2D'}</span>
        </div>

        {/* 模板标签 */}
        {graph.isTemplate && (
          <div
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
              gap: '6px',
            }}
          >
            <span style={{ display: 'inline-flex' }}><UIIcon name="star" size={14} /></span>
            <span>模板</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* 标题 */}
        <div
          style={{
            color: themeConfig.text,
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {graph.title}
        </div>

        {/* 描述 */}
        <div
          style={{
            color: themeConfig.subtext,
            fontSize: '13px',
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            flex: 1,
          }}
        >
          {graph.description || '暂无描述'}
        </div>

        {/* 标签 */}
        {graph.tags && graph.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            {graph.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  background: themeConfig.tagBackground,
                  color: themeConfig.tagText,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                #{tag}
              </span>
            ))}
            {graph.tags.length > 3 && (
              <span
                style={{
                  color: themeConfig.subtext,
                  fontSize: '11px',
                  fontWeight: '500',
                }}
              >
                +{graph.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: `1px solid ${themeConfig.cardBorder}`,
            color: themeConfig.subtext,
            fontSize: '12px',
          }}
        >
          {/* 创建者信息 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {graph.creator.avatar && (
              <img
                src={graph.creator.avatar}
                alt={graph.creator.name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            )}
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {graph.creator.name}
            </div>
          </div>

          {/* 点赞数 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex' }}><UIIcon name="thumbUp" size={12} /></span>
            <span>{graph.likes}</span>
          </div>
        </div>

        {/* 统计信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${themeConfig.cardBorder}`,
            color: themeConfig.subtext,
            fontSize: '11px',
          }}
        >
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UIIcon name="pin" size={12} />{graph.nodeCount} 节点</span>
          </div>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UIIcon name="link" size={12} />{graph.edgeCount} 关系</span>
          </div>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UIIcon name="eye" size={12} />{graph.views} 浏览</span>
          </div>
        </div>

        {/* 创建时间 */}
        <div
          style={{
            marginTop: '8px',
            color: themeConfig.subtext,
            fontSize: '11px',
            textAlign: 'right',
          }}
        >
          {new Date(graph.createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  )
}
