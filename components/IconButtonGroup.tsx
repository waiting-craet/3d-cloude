'use client'

import React from 'react'
import styles from './IconButtonGroup.module.css'

interface IconButtonGroupProps {
  onShare?: () => void
  onGraph?: () => void
  onSettings?: () => void
}

/**
 * ShareIcon Component
 * SVG icon for share functionality
 */
const ShareIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

/**
 * GraphIcon Component
 * SVG icon for graph/network functionality
 */
const GraphIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <line x1="10.5" y1="10.5" x2="7.5" y2="7.5" />
    <line x1="13.5" y1="10.5" x2="16.5" y2="7.5" />
    <line x1="10.5" y1="13.5" x2="7.5" y2="16.5" />
    <line x1="13.5" y1="13.5" x2="16.5" y2="16.5" />
  </svg>
)

/**
 * SettingsIcon Component
 * SVG icon for settings functionality
 */
const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m5.196-15.804l-4.242 4.242m-5.908 5.908l-4.242 4.242M23 12h-6m-6 0H1m15.804-5.196l-4.242 4.242m-5.908 5.908l-4.242 4.242" />
  </svg>
)

/**
 * IconButtonGroup Component
 * 
 * A group of three circular icon buttons (share, graph, settings)
 * positioned on the right side of the page.
 * 
 * Features:
 * - Fixed positioning on the right side
 * - Vertical arrangement with consistent spacing
 * - Hover effects with color and scale transitions
 * - Full accessibility support with ARIA labels and titles
 */
const IconButtonGroup = React.memo(function IconButtonGroup({
  onShare,
  onGraph,
  onSettings,
}: IconButtonGroupProps) {
  return (
    <div className={styles.container}>
      <button
        className={styles.iconButton}
        onClick={onShare}
        aria-label="分享"
        title="分享"
        type="button"
      >
        <ShareIcon />
      </button>

      <button
        className={styles.iconButton}
        onClick={onGraph}
        aria-label="图谱"
        title="图谱"
        type="button"
      >
        <GraphIcon />
      </button>

      <button
        className={styles.iconButton}
        onClick={onSettings}
        aria-label="设置"
        title="设置"
        type="button"
      >
        <SettingsIcon />
      </button>
    </div>
  )
})

IconButtonGroup.displayName = 'IconButtonGroup'

export default IconButtonGroup
