'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './ProjectCard.module.css'

// 项目数据类型
export interface Project {
  id: string
  name: string
  description: string | null
  nodeCount: number
  edgeCount: number
  graphCount: number  // 新增图谱数量字段
  createdAt: Date
  updatedAt: Date
}

// 项目卡片组件属性
export interface ProjectCardProps {
  project: Project
  onClick: (projectId: string) => void
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    onClick(project.id)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div 
      className={styles.projectCard}
      onClick={handleClick}
    >
      {/* 项目图标区域 */}
      <div className={styles.iconContainer}>
        {!imageError ? (
          <Image
            src="/项目1.png"
            alt="项目图标"
            width={48}
            height={48}
            className={styles.projectIcon}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.placeholderIcon}>
            📊
          </div>
        )}
      </div>
      
      {/* 项目信息区域 */}
      <div className={styles.cardContent}>
        <h3 className={styles.projectName} title={project.name}>
          {project.name}
        </h3>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span className={styles.statIcon}>🗺️</span>
            包含 {project.graphCount} 个图谱
          </span>
        </div>
      </div>
    </div>
  )
}