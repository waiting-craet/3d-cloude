'use client'

import React from 'react'
import Link from 'next/link'
import styles from './PaperFooter.module.css'

/**
 * Navigation link configuration
 */
interface NavigationLink {
  label: string
  href: string
  ariaLabel: string
}

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
 * Navigation links configuration
 */
const NAVIGATION_LINKS: ReadonlyArray<NavigationLink> = [
  { label: '首页', href: '/', ariaLabel: '返回首页' },
  { label: '开始创作', href: '/creation', ariaLabel: '前往创作页面' },
  { label: '关于我们', href: '/about', ariaLabel: '了解关于我们' },
  { label: '帮助中心', href: '/help', ariaLabel: '访问帮助中心' }
] as const

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

        {/* Navigation Section */}
        <nav className={styles.navSection} aria-label="页脚导航">
          <ul className={styles.navList}>
            {NAVIGATION_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={styles.navLink}
                  aria-label={link.ariaLabel}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

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
