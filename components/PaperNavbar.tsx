'use client'

import React from 'react'
import styles from './PaperNavbar.module.css'

interface PaperNavbarProps {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  onStartCreating: () => void
}

/**
 * PaperNavbar Component
 * 
 * Fixed navigation bar with warm paper-white aesthetic.
 * Features sky-blue/jade-green accent color (#6b8e85).
 */
const PaperNavbar = React.memo(function PaperNavbar({
  isLoggedIn,
  onLogin,
  onLogout,
  onStartCreating,
}: PaperNavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo/Brand */}
        <div className={styles.logo}>知识图谱</div>

        {/* Button Group */}
        <div className={styles.buttonGroup}>
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

          <button
            onClick={onStartCreating}
            className={styles.primaryButton}
            aria-label="开始创作"
          >
            开始创作
          </button>
        </div>
      </div>
    </nav>
  )
})

PaperNavbar.displayName = 'PaperNavbar'

export default PaperNavbar
