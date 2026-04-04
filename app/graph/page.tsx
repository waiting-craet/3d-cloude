'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGraphStore } from '@/lib/store'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'

function LoadingHourglassIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h10v3.1c0 1.2-.48 2.35-1.35 3.2L13.6 12l2.05 2.2c.87.85 1.35 2 1.35 3.2v3.1H7v-3.1c0-1.2.48-2.35 1.35-3.2L10.4 12 8.35 9.8A4.5 4.5 0 0 1 7 6.6V3.5Z" stroke="#4A9EFF" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 5.5h6M9 18.5h6" stroke="#4A9EFF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.2 16.2h5.6L12 13.4l-2.8 2.8Z" fill="rgba(74,158,255,0.25)" />
      <path d="M9.2 7.8h5.6L12 10.6 9.2 7.8Z" fill="rgba(74,158,255,0.25)" />
    </svg>
  )
}

function WarningCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.8" />
      <path d="M12 7.4v5.8M12 16.6h.01" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// 根据来源确定导航模式
function determineNavigationMode(referrer: string | undefined): 'full' | 'readonly' {
  // 如果没有referrer，默认使用完整模式（可能是刷新页面或直接访问）
  if (!referrer) {
    return 'full'
  }
  
  // 检查是否来自首页相关页面（只读模式）
  const isFromHomepage = 
    referrer === '/' || 
    (referrer.endsWith('/') && referrer.split('/').filter(Boolean).length === 0) ||
    referrer.includes('/homepage') ||
    referrer.includes('/gallery')
  
  // 检查是否来自Creation页面（完整模式）
  const isFromCreation = referrer.includes('/creation')
  
  // Creation页面优先级更高
  if (isFromCreation) {
    return 'full'
  }
  
  return isFromHomepage ? 'readonly' : 'full'
}

export default function GraphPage() {
  const searchParams = useSearchParams()
  const graphId = searchParams.get('graphId')
  const fromParam = searchParams.get('from')
  
  const { theme, setTheme, loadGraphById, currentGraph, navigationMode, setNavigationMode } = useGraphStore()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 检测导航来源并设置模式
  useEffect(() => {
    // 优先检查URL参数
    if (fromParam === 'homepage') {
      setNavigationMode('readonly')
      return
    }
    
    // 获取referrer（来源页面）
    const referrer = document.referrer
    const mode = determineNavigationMode(referrer)
    setNavigationMode(mode)
  }, [fromParam])

  // 强制使用明亮主题
  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light')
    }
  }, [theme, setTheme])

  // 初始化：加载图谱数据
  useEffect(() => {
    const initializeGraph = async () => {
      // 如果没有 graphId，显示错误
      if (!graphId) {
        setError('请从项目列表选择一个图谱')
        setIsInitializing(false)
        return
      }

      try {
        // 每次进入页面或重新获得焦点时，强制重新加载数据
        await loadGraphById(graphId)
        setError(null)
      } catch (err) {
        console.error('❌ [GraphPage] 图谱加载失败:', err)
        setError(err instanceof Error ? err.message : '加载图谱失败')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeGraph()

    // 添加窗口焦点监听器，实现从其他页面返回时的自动刷新
    const handleFocus = () => {
      console.log('🔄 [GraphPage] Window focused, refreshing graph data...')
      initializeGraph()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [graphId, loadGraphById])

  // 如果正在初始化，显示加载状态
  if (isInitializing) {
    return (
      <main>
        <TopNavbar mode={navigationMode} />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 60px)',
          marginTop: '60px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }} aria-label="loading icon">
              <LoadingHourglassIcon />
            </div>
            <div style={{ fontSize: '18px', color: '#666' }}>加载图谱中...</div>
          </div>
        </div>
      </main>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <main>
        <TopNavbar mode={navigationMode} />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 60px)',
          marginTop: '60px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
            <div style={{ marginBottom: '20px' }} aria-label="warning icon">
              <WarningCircleIcon />
            </div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>{error}</div>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '10px 20px',
                background: '#4A9EFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              返回项目列表
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <TopNavbar mode={navigationMode} />
      <KnowledgeGraph />
      <NodeDetailPanel />
      {/* 只在完整模式下显示添加按钮 */}
      {navigationMode === 'full' && <FloatingAddButton />}
    </main>
  )
}
