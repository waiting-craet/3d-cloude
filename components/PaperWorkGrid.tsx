import React from 'react'
import styles from './PaperWorkGrid.module.css'

interface PaperWorkGridProps {
  columns?: number
  gap?: string
  children: React.ReactNode
}

/**
 * PaperWorkGrid Component
 * 
 * Responsive grid layout for work cards.
 * 4 columns (desktop), 3 columns (tablet), 2 columns (mobile).
 */
export function PaperWorkGrid({ columns = 4, gap = '20px', children }: PaperWorkGridProps) {
  return (
    <div 
      className={styles.grid}
      style={{
        '--grid-columns': columns,
        '--grid-gap': gap,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
