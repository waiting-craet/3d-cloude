'use client'

import React from 'react'
import styles from './PaperWorkCard.module.css'

interface Project {
  id: string
  name: string
  description?: string
  graphCount: number
  createdAt: string
  updatedAt: string
  userId: string
}

interface PaperWorkCardProps {
  project: Project
  onClick: (projectId: string) => void
}

/**
 * PaperWorkCard Component
 * 
 * Card with icon placeholder (stacked layers) and metadata.
 * Features warm paper-white aesthetic with sky-blue accent.
 */
const PaperWorkCard = React.memo(function PaperWorkCard({
  project,
  onClick,
}: PaperWorkCardProps) {
  const handleClick = () => {
    onClick(project.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(project.id)
    }
  }

  return (
    <article
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`查看项目: ${project.name}`}
    >
      {/* Icon Placeholder */}
      <div className={styles.iconContainer}>
        <svg 
          className={styles.icon}
          width="64" 
          height="64" 
          viewBox="0 0 64 64" 
          fill="none"
          aria-hidden="true"
        >
          {/* Stacked layers icon */}
          <rect x="8" y="24" width="48" height="8" rx="2" fill="#E0E0E0" />
          <rect x="8" y="16" width="48" height="8" rx="2" fill="#CCCCCC" />
          <rect x="8" y="32" width="48" height="8" rx="2" fill="#F0F0F0" />
        </svg>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{project.name}</h3>
        
        <div className={styles.metadata}>
          <span className={styles.metadataItem}>
            已建立 {project.graphCount} 个图谱
          </span>
        </div>
      </div>
    </article>
  )
})

PaperWorkCard.displayName = 'PaperWorkCard'

export default PaperWorkCard
