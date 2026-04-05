'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGalleryGraphs } from '@/lib/hooks/useGalleryGraphs'
import type { FilterType } from '@/lib/types/homepage-gallery'
import GraphCard from './GraphCard'
import UIIcon from '../UIIcon'

interface GalleryGridProps {
  filters?: FilterType[]
  theme?: 'light' | 'dark'
}

function GalleryGridContent({
  filters = [],
  theme = 'dark',
}: GalleryGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [mounted, setMounted] = useState(false)

  // 获取图谱列表
  const { data, isLoading, error } = useGalleryGraphs({
    page,
    pageSize,
    filters,
    sort: 'latest',
  })

  const themeConfig = {
    background: 'rgba(248, 249, 250, 0.5)',
    text: '#1a1a1a',
    subtext: 'rgba(0, 0, 0, 0.6)',
  }

  // 从 URL 恢复页码
  useEffect(() => {
    setMounted(true)
    const pageParam = searchParams.get('page')
    if (pageParam) {
      setPage(parseInt(pageParam))
    } else {
      setPage(1)
    }
  }, [searchParams])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGraphClick = (graphId: string) => {
    router.push(`/graph?graphId=${graphId}`)
  }

  return (
    <div
      style={{
        padding: '30px',
        minHeight: 'calc(100vh - 140px)',
        background: themeConfig.background,
      }}
    >
      {/* 加载状态 */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              animation: 'spin 1s linear infinite',
            }}
          >
            <UIIcon name="hourglass" size={48} />
          </div>
          <div
            style={{
              color: themeConfig.subtext,
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            加载中...
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '20px',
          }}
        >
          <div style={{ color: themeConfig.text }}><UIIcon name="error" size={48} /></div>
          <div
            style={{
              color: themeConfig.text,
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '10px',
            }}
          >
            加载失败
          </div>
          <div
            style={{
              color: themeConfig.subtext,
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            重新加载
          </button>
        </div>
      )}

      {/* 无结果状态 */}
      {!isLoading && !error && data && data.items.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '20px',
          }}
        >
          <div style={{ color: themeConfig.text }}><UIIcon name="empty" size={64} /></div>
          <div
            style={{
              color: themeConfig.text,
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '10px',
            }}
          >
            暂无相关内容
          </div>
          <div
            style={{
              color: themeConfig.subtext,
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
              maxWidth: '300px',
            }}
          >
            没有找到匹配的图谱。请尝试调整筛选条件或搜索其他关键词。
          </div>
          <button
            onClick={() => {
              router.push('/')
            }}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${themeConfig.subtext}`,
              borderRadius: '8px',
              color: themeConfig.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
              e.currentTarget.style.borderColor = '#667eea'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = themeConfig.subtext
            }}
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 图谱网格 */}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px',
            }}
          >
            {data.items.map((graph) => (
              <GraphCard
                key={graph.id}
                graph={graph}
                onClick={() => handleGraphClick(graph.id)}
                theme={theme}
              />
            ))}
          </div>

          {/* 分页控件 */}
          {data.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '40px',
              }}
            >
              {/* 上一页按钮 */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{
                  padding: '10px 16px',
                  background: page === 1
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(102, 126, 234, 0.1)',
                  border: `1px solid ${page === 1 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(102, 126, 234, 0.3)'}`,
                  borderRadius: '8px',
                  color: page === 1 ? 'rgba(0, 0, 0, 0.4)' : '#667eea',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'
                  }
                }}
                onMouseOut={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                ← 上一页
              </button>

              {/* 页码显示 */}
              <div
                style={{
                  color: themeConfig.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '0 16px',
                }}
              >
                第 {page} / {data.totalPages} 页
              </div>

              {/* 下一页按钮 */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.totalPages}
                style={{
                  padding: '10px 16px',
                  background: page === data.totalPages
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(102, 126, 234, 0.1)',
                  border: `1px solid ${page === data.totalPages ? 'rgba(0, 0, 0, 0.08)' : 'rgba(102, 126, 234, 0.3)'}`,
                  borderRadius: '8px',
                  color: page === data.totalPages ? 'rgba(0, 0, 0, 0.4)' : '#667eea',
                  cursor: page === data.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (page !== data.totalPages) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'
                  }
                }}
                onMouseOut={(e) => {
                  if (page !== data.totalPages) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                下一页 →
              </button>
            </div>
          )}

          {/* 结果统计 */}
          <div
            style={{
              textAlign: 'center',
              color: themeConfig.subtext,
              fontSize: '12px',
              marginTop: '20px',
            }}
          >
            共 {data.total} 个结果，显示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} 个
          </div>
        </>
      )}
    </div>
  )
}

export default function GalleryGrid(props: GalleryGridProps) {
  return (
    <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>加载中...</div>}>
      <GalleryGridContent {...props} />
    </Suspense>
  )
}
