'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from './gallery/SearchBar'
import NotificationBell from './gallery/NotificationBell'
import UserMenu from './gallery/UserMenu'
import HelpMenu from './gallery/HelpMenu'
import UIIcon from './UIIcon'

interface GalleryTopNavbarProps {
  currentTheme?: 'light' | 'dark'
  onThemeToggle?: () => void
  onCreateClick?: () => void
  onCommunityClick?: () => void
}

export default function GalleryTopNavbar({
  currentTheme = 'light',
  onThemeToggle,
  onCreateClick,
  onCommunityClick,
}: GalleryTopNavbarProps) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      const username = localStorage.getItem('adminUsername')
      
      if (isAdmin && username) {
        setIsLoggedIn(true)
        setCurrentUser({ name: username })
      }
    }

    checkLoginStatus()

    // 监听登录状态变化
    const handleLoginStateChange = () => {
      checkLoginStatus()
    }

    window.addEventListener('loginStateChange', handleLoginStateChange)
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
    }
  }, [])

  // 检查是否为移动设备
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      // 显示登录提示（在实际应用中应该显示登录模态框）
      console.warn('用户未登录，需要显示登录界面')
      return
    }
    onCreateClick?.()
  }

  const handleCommunityClick = () => {
    router.push('/community')
    onCommunityClick?.()
  }

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'graph') {
      router.push(`/graph?graphId=${suggestion.id}`)
    } else if (suggestion.type === 'user') {
      router.push(`/user/${suggestion.id}`)
    }
  }

  const themeConfig = {
    navbarBackground: 'rgba(255, 255, 255, 0.98)',
    navbarBorder: 'rgba(0, 0, 0, 0.08)',
    textColor: '#1a1a1a',
    buttonHoverBackground: 'rgba(0, 0, 0, 0.04)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: themeConfig.navbarBackground,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${themeConfig.navbarBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 16px' : '0 30px',
          gap: isMobile ? '12px' : '20px',
          zIndex: 1000,
          boxShadow: `0 2px 12px ${themeConfig.shadowColor}`,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => router.push('/')}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ display: 'inline-flex' }}><UIIcon name="chart" size={20} /></span>
          {!isMobile && <span>知识图谱</span>}
        </div>

        {/* 桌面版导航 */}
        {!isMobile && (
          <>
            {/* 搜索框 */}
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <SearchBar
                onSearch={handleSearch}
                onSuggestionClick={handleSuggestionClick}
                theme={currentTheme}
              />
            </div>

            {/* 中间按钮 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* 开始创作按钮 */}
              <button
                onClick={handleCreateClick}
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
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UIIcon name="spark" size={14} />
                  开始创作
                </span>
              </button>

              {/* 社区按钮 */}
              <button
                onClick={handleCommunityClick}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${themeConfig.navbarBorder}`,
                  borderRadius: '8px',
                  color: themeConfig.textColor,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = themeConfig.buttonHoverBackground
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UIIcon name="user" size={14} />
                  社区
                </span>
              </button>
            </div>

            {/* 右侧功能区 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
              {/* 通知 */}
              {isLoggedIn && (
                <NotificationBell theme={currentTheme} />
              )}

              {/* 帮助菜单 */}
              <HelpMenu theme={currentTheme} />

              {/* 用户菜单 */}
              <UserMenu
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                theme={currentTheme}
              />
            </div>
          </>
        )}

        {/* 移动版菜单按钮 */}
        {isMobile && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: `1px solid ${themeConfig.navbarBorder}`,
                borderRadius: '8px',
                color: themeConfig.textColor,
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ☰
            </button>
          </div>
        )}
      </nav>

      {/* 移动版菜单 */}
      {isMobile && showMobileMenu && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            background: themeConfig.navbarBackground,
            borderBottom: `1px solid ${themeConfig.navbarBorder}`,
            zIndex: 999,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <SearchBar
            onSearch={handleSearch}
            onSuggestionClick={handleSuggestionClick}
            theme={currentTheme}
          />
          <button
            onClick={handleCreateClick}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <UIIcon name="spark" size={14} />
              开始创作
            </span>
          </button>
          <button
            onClick={handleCommunityClick}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: `1px solid ${themeConfig.navbarBorder}`,
              borderRadius: '8px',
              color: themeConfig.textColor,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <UIIcon name="user" size={14} />
              社区
            </span>
          </button>
          {isLoggedIn && (
            <NotificationBell theme={currentTheme} />
          )}
          <HelpMenu theme={currentTheme} />
          <UserMenu
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            theme={currentTheme}
          />
        </div>
      )}
    </>
  )
}
