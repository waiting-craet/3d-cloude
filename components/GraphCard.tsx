'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './ProjectCard.module.css' // 复用ProjectCard的样式

// 图谱数据类型
export interface Graph {
  id: string
  name: string
  description: string | null
  nodeCount: number
  edgeCount: number
  createdAt: Date
  updatedAt: Date
  projectId: string
}

// 图谱卡片组件属性
export interface GraphCardProps {
  graph: Graph
  onClick: (graphId: string) => void
}

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
      {/* 图谱图标区域 */}
      <div className={styles.iconContainer}>
        {!imageError ? (
          <Image
            src="/知识图谱-图谱管理.png"
            alt="图谱图标"
            width={48}
            height={48}
            className={styles.projectIcon}
            onError={handleImageError}
          />
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
          <span className={styles.statItem}>
            <span className={styles.statIcon}>🔵</span>
            {graph.nodeCount} 节点
          </span>
          <span className={styles.statItem}>
            <span className={styles.statIcon}>🔗</span>
            {graph.edgeCount} 边
          </span>
        </div>
      </div>
    </div>
  )
}