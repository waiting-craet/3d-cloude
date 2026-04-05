'use client'

import { useEffect, useState } from 'react'
import UIIcon from '../UIIcon'

interface ThemeToggleProps {
  currentTheme?: 'light' | 'dark'
  onToggle?: () => void
}

export default function ThemeToggle({
  currentTheme = 'dark',
  onToggle,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme)

  // 从 localStorage 恢复主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // 触发主题变化事件
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }))
    
    onToggle?.()
  }

  const themeConfig = {
    buttonBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    buttonText: theme === 'dark' ? '#ffffff' : '#000000',
    buttonHoverBackground: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
  }

  return (
    <button
      onClick={handleToggle}
      title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
      style={{
        padding: '8px 12px',
        background: 'transparent',
        border: `1px solid ${themeConfig.buttonBorder}`,
        borderRadius: '8px',
        color: themeConfig.buttonText,
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = themeConfig.buttonHoverBackground
        e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = themeConfig.buttonBorder
      }}
    >
      {theme === 'dark' ? <UIIcon name="sun" size={18} /> : <UIIcon name="moon" size={18} />}
    </button>
  )
}
