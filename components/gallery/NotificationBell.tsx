'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/lib/hooks/useNotifications'

interface NotificationBellProps {
  theme?: 'light' | 'dark'
}

export default function NotificationBell({ theme = 'dark' }: NotificationBellProps) {
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 获取当前用户 ID（从 localStorage）
  const userId = typeof window !== 'undefined' 
    ? localStorage.getItem('adminUsername') || undefined
    : undefined

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    userId,
    limit: 10,
  })

  const themeConfig = {
    buttonBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    buttonText: theme === 'dark' ? '#ffffff' : '#000000',
    buttonHoverBackground: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    panelBackground: theme === 'dark'
      ? 'rgba(30, 30, 30, 0.98)'
      : 'rgba(255, 255, 255, 0.98)',
    panelBorder: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.1)',
    panelText: theme === 'dark' ? '#ffffff' : '#000000',
    panelSubtext: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(0, 0, 0, 0.6)',
    notificationHover: theme === 'dark'
      ? 'rgba(74, 158, 255, 0.1)'
      : 'rgba(74, 158, 255, 0.05)',
  }

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPanel(false)
      }
    }

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel])

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
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
          position: 'relative',
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
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {showPanel && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '350px',
            background: themeConfig.panelBackground,
            border: `1px solid ${themeConfig.panelBorder}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1001,
          }}
        >
          {/* 面板头部 */}
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${themeConfig.panelBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: themeConfig.panelText,
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              通知
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${themeConfig.panelBorder}`,
                  borderRadius: '6px',
                  color: '#4A9EFF',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 158, 255, 0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                标记全部已读
              </button>
            )}
          </div>

          {/* 通知列表 */}
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${themeConfig.panelBorder}`,
                    cursor: 'pointer',
                    background: !notification.isRead
                      ? 'rgba(74, 158, 255, 0.05)'
                      : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = themeConfig.notificationHover
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = !notification.isRead
                      ? 'rgba(74, 158, 255, 0.05)'
                      : 'transparent'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '16px', marginTop: '2px' }}>
                      {notification.type === 'like' && '👍'}
                      {notification.type === 'comment' && '💬'}
                      {notification.type === 'follow' && '👤'}
                      {notification.type === 'mention' && '@'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: themeConfig.panelText,
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '4px',
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          color: themeConfig.panelSubtext,
                          fontSize: '12px',
                        }}
                      >
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#4A9EFF',
                          marginTop: '6px',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: themeConfig.panelSubtext,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
              <div>暂无通知</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
