'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './ProjectCard.module.css' // 复用ProjectCard的样式

// 图谱数据类型
export interface Graph {
  id: string
  name: string
  description: string | null
  nodeCount: number      // 节点数量（非负整数）
  edgeCount: number      // 边数量（非负整数）
  coverUrl?: string      // 新增封面图片URL
  createdAt: Date
  updatedAt: Date
  projectId: string
}

// 图谱卡片组件属性
export interface GraphCardProps {
  graph: Graph
  onClick: (graphId: string) => void
}

/**
 * GraphCard - 图谱卡片组件
 * 
 * 显示单个图谱的卡片，包含图标、名称和统计信息。
 * 统计信息格式为"包括X个节点，Y个关系"。
 * 
 * @param {GraphCardProps} props - 组件属性
 * @param {Graph} props.graph - 图谱数据对象
 * @param {Function} props.onClick - 点击卡片时的回调函数
 * @returns {JSX.Element} 图谱卡片组件
 * 
 * @example
 * <GraphCard 
 *   graph={graphData} 
 *   onClick={(id) => router.push(`/3d-editor?graphId=${id}`)}
 * />
 */

export default function GraphCard({ graph, onClick }: GraphCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    onClick(graph.id)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div 
      className={styles.projectCard}
      onClick={handleClick}
    >
      {/* 图谱图标/封面区域 */}
      <div className={styles.iconContainer} style={graph.coverUrl ? { padding: 0, overflow: 'hidden' } : {}}>
        {!imageError ? (
          graph.coverUrl ? (
            <img
              src={graph.coverUrl}
              alt={graph.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={handleImageError}
            />
          ) : (
            <Image
              src="/知识图谱-图谱管理.png"
              alt="图谱图标"
              width={48}
              height={48}
              className={styles.projectIcon}
              onError={handleImageError}
            />
          )
        ) : (
          <div className={styles.placeholderIcon}>
            🗺️
          </div>
        )}
      </div>
      
      {/* 图谱信息区域 */}
      <div className={styles.cardContent}>
        <h3 className={styles.projectName} title={graph.name}>
          {graph.name}
        </h3>
        <div className={styles.stats}>
          包括{Math.max(0, graph.nodeCount)}个节点，{Math.max(0, graph.edgeCount)}个关系
        </div>
      </div>
    </div>
  )
}