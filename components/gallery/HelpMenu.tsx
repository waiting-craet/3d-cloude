'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface HelpMenuProps {
  theme?: 'light' | 'dark'
}

export default function HelpMenu({ theme = 'dark' }: HelpMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const themeConfig = {
    buttonBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    buttonText: theme === 'dark' ? '#ffffff' : '#000000',
    buttonHoverBackground: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    menuBackground: theme === 'dark'
      ? 'rgba(30, 30, 30, 0.98)'
      : 'rgba(255, 255, 255, 0.98)',
    menuBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    menuText: theme === 'dark' ? '#ffffff' : '#000000',
    menuSubtext: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(0, 0, 0, 0.6)',
    menuItemHover: theme === 'dark'
      ? 'rgba(74, 158, 255, 0.1)'
      : 'rgba(74, 158, 255, 0.05)',
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const menuItems = [
    {
      label: '快速入门',
      icon: '🚀',
      action: () => {
        alert('快速入门教程')
        setShowMenu(false)
      },
    },
    {
      label: '文档',
      icon: '📖',
      action: () => {
        window.open('/docs', '_blank')
        setShowMenu(false)
      },
    },
    {
      label: '常见问题',
      icon: '❓',
      action: () => {
        window.open('/faq', '_blank')
        setShowMenu(false)
      },
    },
    {
      label: '联系支持',
      icon: '💬',
      action: () => {
        window.open('mailto:support@example.com')
        setShowMenu(false)
      },
    },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
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
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ❓
      </button>

      {/* 帮助菜单 */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            minWidth: '200px',
            background: themeConfig.menuBackground,
            border: `1px solid ${themeConfig.menuBorder}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
            overflow: 'hidden',
          }}
        >
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.action}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < menuItems.length - 1 
                  ? `1px solid ${themeConfig.menuBorder}` 
                  : 'none',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = themeConfig.menuItemHover
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span
                style={{
                  color: themeConfig.menuText,
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
