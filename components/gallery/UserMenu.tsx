'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginModal from '../LoginModal'
import RegisterModal from '../RegisterModal'

interface UserMenuProps {
  isLoggedIn: boolean
  currentUser?: any
  theme?: 'light' | 'dark'
}

export default function UserMenu({
  isLoggedIn,
  currentUser,
  theme = 'dark',
}: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const themeConfig = {
    buttonBorder: 'rgba(0, 0, 0, 0.1)',
    buttonText: '#1a1a1a',
    buttonHoverBackground: 'rgba(0, 0, 0, 0.04)',
    menuBackground: 'rgba(255, 255, 255, 0.98)',
    menuBorder: 'rgba(0, 0, 0, 0.08)',
    menuText: '#1a1a1a',
    menuSubtext: 'rgba(0, 0, 0, 0.6)',
    menuItemHover: 'rgba(102, 126, 234, 0.05)',
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

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminUsername')
    window.dispatchEvent(new Event('loginStateChange'))
    setShowMenu(false)
    router.push('/')
  }

  const handleLoginSuccess = () => {
    localStorage.setItem('isAdmin', 'true')
    window.dispatchEvent(new Event('loginStateChange'))
    setShowLoginModal(false)
    setShowRegisterModal(false)
  }

  if (!isLoggedIn) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'
          }}
        >
          登录
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            setShowRegisterModal(true)
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => {
            setShowRegisterModal(false)
            setShowLoginModal(true)
          }}
        />
      </>
    )
  }

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
          fontSize: '16px',
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
        👤
      </button>

      {/* 用户菜单 */}
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
          {/* 用户信息 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${themeConfig.menuBorder}`,
              background: 'rgba(102, 126, 234, 0.05)',
            }}
          >
            <div
              style={{
                color: themeConfig.menuText,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
              }}
            >
              {currentUser?.name || '用户'}
            </div>
            <div
              style={{
                color: themeConfig.menuSubtext,
                fontSize: '12px',
              }}
            >
              已登录
            </div>
          </div>

          {/* 菜单项 */}
          <div
            onClick={() => {
              router.push('/my-works')
              setShowMenu(false)
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${themeConfig.menuBorder}`,
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
            <span style={{ fontSize: '16px' }}>📚</span>
            <span
              style={{
                color: themeConfig.menuText,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              我的作品
            </span>
          </div>

          <div
            onClick={() => {
              router.push('/settings')
              setShowMenu(false)
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${themeConfig.menuBorder}`,
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
            <span style={{ fontSize: '16px' }}>⚙️</span>
            <span
              style={{
                color: themeConfig.menuText,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              账户设置
            </span>
          </div>

          {/* 退出登录 */}
          <div
            onClick={handleLogout}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            <span
              style={{
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              退出登录
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
