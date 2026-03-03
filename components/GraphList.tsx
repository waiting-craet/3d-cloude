'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GraphCard, { Graph } from './GraphCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import styles from './ProjectList.module.css' // 复用ProjectList的样式

// API响应类型
interface GraphsResponse {
  graphs: Graph[]
}

// 图谱列表组件属性
export interface GraphListProps {
  projectId: string
  projectName: string
  maxItems?: number      // 最大显示数量，默认12
  columns?: number       // 列数，默认6
  onBack: () => void     // 返回按钮回调
  onGraphClick?: (graphId: string) => void
}

export default function GraphList({ 
  projectId,
  projectName,
  maxItems = 12, 
  columns = 6,
  onBack,
  onGraphClick 
}: GraphListProps) {
  const router = useRouter()
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取图谱数据
  const fetchGraphs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/graphs`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: GraphsResponse = await response.json()
      
      // 验证数据并过滤无效图谱
      const validGraphs = data.graphs.filter(graph => 
        graph && 
        graph.id && 
        graph.name && 
        typeof graph.nodeCount === 'number' && 
        typeof graph.edgeCount === 'number'
      )
      
      // 如果指定了最大数量，截取数组
      const limitedGraphs = maxItems > 0 
        ? validGraphs.slice(0, maxItems)
        : validGraphs
      
      setGraphs(limitedGraphs)
    } catch (error) {
      console.error('获取图谱列表失败:', error)
      setError(error instanceof Error ? error.message : '获取图谱列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理图谱点击
  const handleGraphClick = (graphId: string) => {
    if (onGraphClick) {
      onGraphClick(graphId)
    } else {
      // 默认导航到3D编辑器页面
      router.push(`/3d-editor?projectId=${projectId}&graphId=${graphId}`)
    }
  }

  // 重试加载
  const handleRetry = () => {
    fetchGraphs()
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchGraphs()
  }, [projectId, maxItems])

  // 渲染加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← 返回项目列表
          </button>
          <h2 className={styles.title}>{projectName} - 图谱列表</h2>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← 返回项目列表
          </button>
          <h2 className={styles.title}>{projectName} - 图谱列表</h2>
        </div>
        <ErrorMessage 
          message={error}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  // 渲染空状态
  if (graphs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← 返回项目列表
          </button>
          <h2 className={styles.title}>{projectName} - 图谱列表</h2>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺️</div>
          <h3 className={styles.emptyTitle}>暂无图谱</h3>
          <p className={styles.emptyDescription}>
            该项目还没有创建任何图谱，点击"开始创作"来创建你的第一个图谱吧！
          </p>
        </div>
      </div>
    )
  }

  // 渲染图谱网格
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 返回项目列表
        </button>
        <h2 className={styles.title}>{projectName} - 图谱列表</h2>
      </div>
      <div 
        className={styles.projectGrid}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`
        }}
      >
        {graphs.map(graph => (
          <GraphCard
            key={graph.id}
            graph={graph}
            onClick={handleGraphClick}
          />
        ))}
      </div>
    </div>
  )
}