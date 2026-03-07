/**
 * StatisticsDisplay Component
 * 
 * Displays platform metrics in a clean, horizontal layout with ink-wash aesthetic.
 * 
 * Performance optimizations:
 * - Memoized to prevent unnecessary re-renders when statistics don't change
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import React from 'react'
import styles from './StatisticsDisplay.module.css'

export interface Statistic {
  value: string
  label: string
}

export interface StatisticsDisplayProps {
  statistics: Statistic[]
}

const StatisticsDisplayComponent: React.FC<StatisticsDisplayProps> = ({
  statistics,
}) => {
  return (
    <section className={styles.statistics} aria-label="平台统计数据">
      <div className={styles.container}>
        {statistics.map((stat, index) => (
          <React.Fragment key={index}>
            {index > 0 && <div className={styles.divider} aria-hidden="true" />}
            <div className={styles.statItem} data-testid="statistic">
              <div className={styles.statNumber}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}

// Memoize component to prevent unnecessary re-renders
export const StatisticsDisplay = React.memo(StatisticsDisplayComponent, (prevProps, nextProps) => {
  // Deep comparison of statistics array
  if (prevProps.statistics.length !== nextProps.statistics.length) {
    return false
  }
  
  return prevProps.statistics.every((stat, index) => 
    stat.value === nextProps.statistics[index].value &&
    stat.label === nextProps.statistics[index].label
  )
})

StatisticsDisplay.displayName = 'StatisticsDisplay'

export default StatisticsDisplay
