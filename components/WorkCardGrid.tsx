import React from 'react'
import styles from './WorkCardGrid.module.css'

interface WorkCardGridProps {
  columns?: number
  gap?: string
  children: React.ReactNode
}

/**
 * WorkCardGrid Component
 * 
 * A responsive grid layout component for displaying work cards.
 * Automatically adjusts column count based on viewport width:
 * - Desktop (1200px+): 6 columns
 * - Tablet (768-1199px): 4 columns
 * - Mobile (<768px): 2 columns
 * 
 * @param columns - Optional custom column count (overrides responsive defaults)
 * @param gap - Optional custom gap spacing (default: 24px)
 * @param children - Work card components to display in the grid
 */
export function WorkCardGrid({ columns, gap, children }: WorkCardGridProps) {
  const style = {
    ...(columns && { '--grid-columns': columns }),
    ...(gap && { '--grid-gap': gap }),
  } as React.CSSProperties

  return (
    <div className={styles.grid} style={style}>
      {children}
    </div>
  )
}
