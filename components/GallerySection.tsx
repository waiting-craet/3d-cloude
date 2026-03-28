import React from 'react'
import styles from './GallerySection.module.css'

interface GallerySectionProps {
  heading: string
  children: React.ReactNode
}

/**
 * GallerySection Component
 * 
 * A container component for the work card gallery with a section heading.
 * Provides consistent spacing and max-width constraint for the gallery content.
 * 
 * @param heading - The section heading text (e.g., "推荐广场")
 * @param children - The WorkCardGrid and work cards to display
 */
export function GallerySection({ heading, children }: GallerySectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>{heading}</h2>
        {children}
      </div>
    </section>
  )
}
