'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGraphStore } from '@/lib/store'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'

// 导航模式类型
type NavigationMode = 'full' | 'readonly'

// 根据来源确定导航模式
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  console.log('🔍 [determineNavigationMode] Full referrer:', referrer)
  
  // 如果没有referrer，默认使用完整模式（可能是刷新页面或直接访问）
  if (!referrer) {
    console.log('🔍 [determineNavigationMode] No referrer, using full mode')
    return 'full'
  }
  
  // 检查是否来自首页相关页面（只读模式）
  const isFromHomepage = 
    referrer === '/' || 
    referrer.endsWith('/') && !referrer.includes('/creation') ||
    referrer.includes('/homepage') ||
    referrer.includes('/gallery')
  
  // 检查是否来自Creation页面（完整模式）
  const isFromCreation = referrer.includes('/creation')
  
  console.log('🔍 [determineNavigationMode] isFromHomepage:', isFromHomepage)
  console.log('🔍 [determineNavigationMode] isFromCreation:', isFromCreation)
  
  // Creation页面优先级更高
  if (isFromCreation) {
    return 'full'
  }
  
  return isFromHomepage ? 'readonly' : 'full'
}

export default function GraphPage() {
  const searchParams = useSearchParams()
  const graphId = searchParams.get('graphId')
  
  const { theme, setTheme, loadGraphById, currentGraph } = useGraphStore()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('full')

  // 检测导航来源并设置模式
  useEffect(() => {
    // 获取referrer（来源页面）
    const referrer = document.referrer
    const mode = determineNavigationMode(referrer)
    setNavigationMode(mode)
    
    console.log('🔍 [GraphPage] Referrer:', referrer)
    console.log('🔍 [GraphPage] Navigation Mode:', mode)
  }, [])

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

      // 如果当前已经加载了这个图谱，跳过
      if (currentGraph?.id === graphId) {
        setIsInitializing(false)
        return
      }

      try {
        console.log('🔄 [GraphPage] 开始加载图谱:', graphId)
        await loadGraphById(graphId)
        setError(null)
        console.log('✅ [GraphPage] 图谱加载成功')
      } catch (err) {
        console.error('❌ [GraphPage] 图谱加载失败:', err)
        setError(err instanceof Error ? err.message : '加载图谱失败')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeGraph()
  }, [graphId, loadGraphById, currentGraph])

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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
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
