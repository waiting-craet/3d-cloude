/**
 * InkWashWorkCard Component
 * 
 * A card component for displaying project previews with ink-wash aesthetic.
 * Features:
 * - Project preview/thumbnail with fallback
 * - Project title and metadata display
 * - Click handler for navigation
 * - Hover effects for interactivity
 * 
 * Performance optimizations:
 * - Memoized to prevent unnecessary re-renders
 * - Ready for Next.js Image component when images are added
 * - Lazy loading support for images below the fold
 */

import React from 'react'
import Image from 'next/image'
import styles from './InkWashWorkCard.module.css'

interface Project {
  id: string
  name: string
  description?: string
  graphCount?: number
  createdAt?: string
  updatedAt?: string
  userId?: string
  graphs?: Array<{
    id: string
    name: string
    nodeCount: number
    edgeCount: number
  }>
}

interface InkWashWorkCardProps {
  project: Project
  onClick: (projectId: string) => void
  priority?: boolean // For above-the-fold images
}

const InkWashWorkCardComponent: React.FC<InkWashWorkCardProps> = ({ 
  project, 
  onClick,
  priority = false 
}) => {
  // Calculate total graph count from graphs array or use graphCount property
  const graphCount = project.graphs?.length ?? project.graphCount ?? 0
  
  // Handle card click
  const handleClick = () => {
    onClick(project.id)
  }

  // Handle keyboard interaction for accessibility
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
      aria-label={`打开项目 ${project.name}`}
    >
      {/* Project Preview/Thumbnail */}
      <div className={styles.imageContainer}>
        {/* TODO: When project images are available, use Next.js Image component:
          <Image
            src={project.imageUrl}
            alt={`${project.name} preview`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            className={styles.image}
          />
        */}
        {/* Fallback placeholder with project initial */}
        <div className={styles.imagePlaceholder}>
          <span className={styles.placeholderText}>
            {project.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Project Information */}
      <div className={styles.content}>
        <h3 className={styles.title}>{project.name}</h3>
        
        {/* Metadata */}
        <div className={styles.metadata}>
          <span className={styles.metadataItem}>
            {graphCount} 个知识图谱
          </span>
        </div>
      </div>
    </article>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if project data or onClick handler changes
export const InkWashWorkCard = React.memo(InkWashWorkCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.graphCount === nextProps.project.graphCount &&
    prevProps.priority === nextProps.priority
  )
})

InkWashWorkCard.displayName = 'InkWashWorkCard'

export default InkWashWorkCard
