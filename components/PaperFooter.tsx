'use client'

import React from 'react'
import styles from './PaperFooter.module.css'



/**
 * Site information constants
 */
const SITE_INFO = {
  name: '知识图谱平台',
  description: '构建与发现知识的无尽脉络'
} as const

/**
 * Copyright information constants
 */
const COPYRIGHT_INFO = {
  symbol: '©',
  year: new Date().getFullYear(),
  owner: '知识图谱平台'
} as const



/**
 * PaperFooter Component
 * 
 * Footer component with paper-white aesthetic and Morandi color scheme.
 * Features three main sections: brand info, navigation links, and copyright.
 */
const PaperFooter = React.memo(function PaperFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.brandSection}>
          <div className={styles.siteName}>{SITE_INFO.name}</div>
          <div className={styles.siteDescription}>{SITE_INFO.description}</div>
        </div>

        {/* Copyright Section */}
        <div className={styles.copyrightSection}>
          <p className={styles.copyrightText}>
            {COPYRIGHT_INFO.symbol} {COPYRIGHT_INFO.year} {COPYRIGHT_INFO.owner}
          </p>
        </div>
      </div>
    </footer>
  )
})

PaperFooter.displayName = 'PaperFooter'

export default PaperFooter
