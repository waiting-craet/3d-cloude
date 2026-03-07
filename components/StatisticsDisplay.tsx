/**
 * StatisticsDisplay Component
 * 
 * Displays platform metrics in a clean, horizontal layout with ink-wash aesthetic.
 * Numbers are formatted using the formatNumber utility for readability.
 * 
 * Performance optimizations:
 * - Memoized to prevent unnecessary re-renders when counts don't change
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React from 'react'
import styles from './StatisticsDisplay.module.css'
import { formatNumber } from '@/lib/utils/formatNumber'

export interface StatisticsDisplayProps {
  projectsCount: number
  knowledgeGraphsCount: number
  totalGraphsCount: number
}

const StatisticsDisplayComponent: React.FC<StatisticsDisplayProps> = ({
  projectsCount,
  knowledgeGraphsCount,
  totalGraphsCount,
}) => {
  return (
    <section className={styles.statistics} aria-label="平台统计数据">
      <div className={styles.container}>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{formatNumber(projectsCount)}</div>
          <div className={styles.statLabel}>项目</div>
        </div>
        
        <div className={styles.divider} aria-hidden="true" />
        
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{formatNumber(knowledgeGraphsCount)}</div>
          <div className={styles.statLabel}>知识图谱</div>
        </div>
        
        <div className={styles.divider} aria-hidden="true" />
        
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{formatNumber(totalGraphsCount)}</div>
          <div className={styles.statLabel}>总图谱数</div>
        </div>
      </div>
    </section>
  )
}

// Memoize component to prevent unnecessary re-renders
export const StatisticsDisplay = React.memo(StatisticsDisplayComponent, (prevProps, nextProps) => {
  return (
    prevProps.projectsCount === nextProps.projectsCount &&
    prevProps.knowledgeGraphsCount === nextProps.knowledgeGraphsCount &&
    prevProps.totalGraphsCount === nextProps.totalGraphsCount
  )
})

StatisticsDisplay.displayName = 'StatisticsDisplay'

export default StatisticsDisplay
