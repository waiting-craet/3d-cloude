'use client'

import styles from './ErrorMessage.module.css'

export interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>⚠️</div>
      <h3 className={styles.title}>出现错误</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button 
          className={styles.retryButton}
          onClick={onRetry}
        >
          重试
        </button>
      )}
    </div>
  )
}