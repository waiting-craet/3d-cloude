import React from 'react'
import styles from './PaperGallerySection.module.css'

interface PaperGallerySectionProps {
  heading: string
  viewAllText?: string
  onViewAll?: () => void
  children: React.ReactNode
}

/**
 * PaperGallerySection Component
 * 
 * Gallery container with heading and "view all" link.
 * Features warm paper-white aesthetic.
 */
export function PaperGallerySection({ 
  heading, 
  viewAllText = '查看全部记录',
  onViewAll,
  children 
}: PaperGallerySectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.heading}>{heading}</h2>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className={styles.viewAllLink}
              aria-label={viewAllText}
            >
              {viewAllText}
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}
