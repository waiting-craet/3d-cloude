'use client'

import React from 'react'
import styles from './InkWashNavbar.module.css'

interface InkWashNavbarProps {
  isLoggedIn: boolean
  onStartCreating: () => void
  onLogin: () => void
  onLogout: () => void
}

/**
 * InkWashNavbar Component
 * 
 * Fixed navigation bar with ink-wash aesthetic styling.
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
const InkWashNavbar = React.memo(function InkWashNavbar({
  isLoggedIn,
  onStartCreating,
  onLogin,
  onLogout,
}: InkWashNavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo/Brand */}
        <div className={styles.logo}>知识图谱</div>

        {/* Button Group */}
        <div className={styles.buttonGroup}>
          <button
            onClick={onStartCreating}
            className={styles.primaryButton}
            aria-label="开始创作"
          >
            开始创作
          </button>

          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className={styles.secondaryButton}
              aria-label="退出登录"
            >
              退出登录
            </button>
          ) : (
            <button
              onClick={onLogin}
              className={styles.secondaryButton}
              aria-label="登录"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </nav>
  )
})

InkWashNavbar.displayName = 'InkWashNavbar'

export default InkWashNavbar
