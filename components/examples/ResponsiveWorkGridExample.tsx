'use client'

import React, { useState, useEffect } from 'react'
import ResponsiveWorkGrid from '../ResponsiveWorkGrid'
import { GraphCard } from '@/lib/types/homepage-gallery'

// 示例数据
const generateMockWorks = (count: number): GraphCard[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `work-${index + 1}`,
    title: `知识图谱作品 ${index + 1}`,
    description: `这是第 ${index + 1} 个知识图谱作品的详细描述，展示了复杂的数据关系和可视化效果。`,
    thumbnail: `https://picsum.photos/400/300?random=${index + 1}`,
    type: Math.random() > 0.5 ? '3d' : '2d',
    isTemplate: Math.random() > 0.7,
    creator: {
      id: `user-${index + 1}`,
      name: `创作者${index + 1}`,
      email: `creator${index + 1}@example.com`,
      avatar: `https://picsum.photos/64/64?random=${index + 100}`,
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
      updatedAt: new Date()
    },
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    updatedAt: new Date(),
    likes: Math.floor(Math.random() * 100),
    views: Math.floor(Math.random() * 1000),
    tags: [
      '知识图谱',
      ['科技', '教育', '商业', '艺术', '医疗'][Math.floor(Math.random() * 5)],
      ['数据可视化', '机器学习', '人工智能', '大数据'][Math.floor(Math.random() * 4)]
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    nodeCount: Math.floor(Math.random() * 50) + 5,
    edgeCount: Math.floor(Math.random() * 100) + 10
  }))
}

const ResponsiveWorkGridExample: React.FC = () => {
  const [works, setWorks] = useState<GraphCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [spacing, setSpacing] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  const [loadingType, setLoadingType] = useState<'skeleton' | 'spinner' | 'pulse' | 'shimmer'>('skeleton')
  const [aspectRatio, setAspectRatio] = useState<'auto' | 'square' | '4:3' | '16:9' | '3:2'>('auto')

  // 模拟数据加载
  const loadWorks = async (count: number = 12) => {
    setLoading(true)
    setError(null)
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟随机错误
      if (Math.random() < 0.1) {
        throw new Error('网络连接超时，请稍后重试')
      }
      
      const mockWorks = generateMockWorks(count)
      setWorks(mockWorks)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadWorks()
  }, [])

  // 事件处理
  const handleWorkClick = (work: GraphCard) => {
    console.log('点击作品:', work)
    alert(`点击了作品: ${work.title}`)
  }

  const handleWorkLike = (workId: string) => {
    console.log('点赞作品:', workId)
    setWorks(prev => prev.map(work => 
      work.id === workId 
        ? { ...work, likes: work.likes + 1 }
        : work
    ))
  }

  const handleWorkShare = (work: GraphCard) => {
    console.log('分享作品:', work)
    if (navigator.share) {
      navigator.share({
        title: work.title,
        text: work.description,
        url: window.location.href
      })
    } else {
      // 回退到复制链接
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  const handleRetry = () => {
    loadWorks()
  }

  const handleCreateWork = () => {
    alert('跳转到创作页面')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      padding: '20px 0'
    }}>
      {/* 控制面板 */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          color: theme === 'dark' ? '#fff' : '#000',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          响应式作品网格系统示例
        </h1>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {/* 主题切换 */}
          <div>
            <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
              主题:
            </label>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              style={{ padding: '5px' }}
            >
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </div>

          {/* 间距设置 */}
          <div>
            <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
              间距:
            </label>
            <select 
              value={spacing} 
              onChange={(e) => setSpacing(e.target.value as any)}
              style={{ padding: '5px' }}
            >
              <option value="compact">紧凑</option>
              <option value="comfortable">舒适</option>
              <option value="spacious">宽松</option>
            </select>
          </div>

          {/* 加载类型 */}
          <div>
            <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
              加载样式:
            </label>
            <select 
              value={loadingType} 
              onChange={(e) => setLoadingType(e.target.value as any)}
              style={{ padding: '5px' }}
            >
              <option value="skeleton">骨架屏</option>
              <option value="spinner">旋转器</option>
              <option value="pulse">脉冲</option>
              <option value="shimmer">闪烁</option>
            </select>
          </div>

          {/* 宽高比 */}
          <div>
            <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
              宽高比:
            </label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value as any)}
              style={{ padding: '5px' }}
            >
              <option value="auto">自动 (4:3)</option>
              <option value="square">正方形 (1:1)</option>
              <option value="4:3">标准 (4:3)</option>
              <option value="16:9">宽屏 (16:9)</option>
              <option value="3:2">经典 (3:2)</option>
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => loadWorks(6)}
            style={{ 
              padding: '10px 20px', 
              background: '#4A9EFF', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            加载6个作品
          </button>
          <button 
            onClick={() => loadWorks(12)}
            style={{ 
              padding: '10px 20px', 
              background: '#4A9EFF', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            加载12个作品
          </button>
          <button 
            onClick={() => loadWorks(24)}
            style={{ 
              padding: '10px 20px', 
              background: '#4A9EFF', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            加载24个作品
          </button>
          <button 
            onClick={() => setWorks([])}
            style={{ 
              padding: '10px 20px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            清空作品
          </button>
          <button 
            onClick={() => setError('模拟网络错误')}
            style={{ 
              padding: '10px 20px', 
              background: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            模拟错误
          </button>
        </div>
      </div>

      {/* 作品网格 */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <ResponsiveWorkGrid
          works={works}
          loading={loading}
          error={error}
          onWorkClick={handleWorkClick}
          onWorkLike={handleWorkLike}
          onWorkShare={handleWorkShare}
          onRetry={handleRetry}
          theme={theme}
          spacing={spacing}
          loadingType={loadingType}
          aspectRatio={aspectRatio}
          emptyStateConfig={{
            title: '还没有作品',
            description: '成为第一个创建知识图谱作品的用户吧！',
            icon: '🎨',
            actionText: '开始创作',
            onAction: handleCreateWork
          }}
          gridColumns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            wide: 4,
            ultraWide: 5
          }}
        />
      </div>
    </div>
  )
}

export default ResponsiveWorkGridExample