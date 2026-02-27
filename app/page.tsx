'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginModal from '@/components/LoginModal'
import { useUserStore } from '@/lib/userStore'

export default function LandingPage() {
  const router = useRouter()
  const [loginHovered, setLoginHovered] = useState(false)
  const [createHovered, setCreateHovered] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [userMenuHovered, setUserMenuHovered] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { user, isLoggedIn, logout, initializeFromStorage } = useUserStore()

  // 页面加载时恢复登录状态
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  // 监听登录状态变化
  useEffect(() => {
    const handleLoginStateChange = () => {
      initializeFromStorage()
    }

    window.addEventListener('loginStateChange', handleLoginStateChange)
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
    }
  }, [initializeFromStorage])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const categories = ['全部', '科技', '教育', '商业', '艺术', '医疗', '其他']

  const handleStartCreating = () => {
    if (!isLoggedIn) {
      // 未登录时提示用户先登录
      alert('请先登录后再开始创作')
      setIsLoginModalOpen(true)
      return
    }
    
    try {
      router.push('/creation')
    } catch (error) {
      console.error('Navigation failed:', error)
      window.location.href = '/creation'
    }
  }

  // 示例作品数据
  const sampleWorks = [
    { id: 1, title: '知识图谱作品谱', author: '作者', image: '🌲' },
    { id: 2, title: '知识图谱作品谱', author: '作者', image: '🌀' },
    { id: 3, title: '知识图谱作品谱', author: '作者', image: '🌳' },
    { id: 4, title: '知识图谱作品谱', author: '作者', image: '❌' },
    { id: 5, title: '知识图谱作品谱', author: '作者', image: '🌫️' },
    { id: 6, title: '知识图谱作品谱', author: '作者', image: '🌲' },
    { id: 7, title: '知识图谱作品谱', author: '作者', image: '🌳' },
    { id: 8, title: '知识图谱作品谱', author: '作者', image: '❌' },
    { id: 9, title: '知识图谱作品谱', author: '作者', image: '🌫️' },
    { id: 10, title: '知识图谱作品谱', author: '作者', image: '🌲' },
    { id: 11, title: '知识图谱作品谱', author: '作者', image: '🌊' },
    { id: 12, title: '知识图谱作品图谱', author: '作者', image: '🌊' },
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: '#fafafa',
      color: '#333'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #e5e5e5'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#00bfa5'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#00bfa5',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            📊
          </div>
          知识图谱
        </div>

        {/* 右侧按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          {!isLoggedIn ? (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              onMouseEnter={() => setLoginHovered(true)}
              onMouseLeave={() => setLoginHovered(false)}
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
                transform: loginHovered ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              登录
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onMouseEnter={() => setUserMenuHovered(true)}
                onMouseLeave={() => setUserMenuHovered(false)}
                style={{
                  padding: '10px 20px',
                  background: userMenuHovered ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '8px',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>👤</span>
                <span>{user?.username || '用户'}</span>
              </button>

              {/* 用户菜单下拉框 */}
              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    minWidth: '180px',
                    background: 'white',
                    border: '1px solid #e5e5e5',
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
                      borderBottom: '1px solid #e5e5e5',
                      background: 'rgba(102, 126, 234, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        color: '#2c2c2c',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                    >
                      {user?.username || '用户'}
                    </div>
                    <div
                      style={{
                        color: '#999',
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
                      setShowUserMenu(false)
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e5e5',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>📚</span>
                    <span
                      style={{
                        color: '#2c2c2c',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      我的作品
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
                    onMouseEnter={(e) => {
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
          )}
          <button
            onClick={handleStartCreating}
            onMouseEnter={() => isLoggedIn && setCreateHovered(true)}
            onMouseLeave={() => setCreateHovered(false)}
            style={{
              padding: '10px 24px',
              background: !isLoggedIn 
                ? '#e0e0e0' 
                : (createHovered ? '#00d4b8' : '#00bfa5'),
              border: 'none',
              borderRadius: '24px',
              color: !isLoggedIn ? '#999' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: !isLoggedIn ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              transform: (isLoggedIn && createHovered) ? 'scale(1.05)' : 'scale(1)',
              opacity: !isLoggedIn ? 0.6 : 1,
            }}
          >
            开始创作
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '50px 30px 100px 30px'
      }}>
        {/* 标题 */}
        <h1 style={{
          fontSize: '38px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '35px',
          color: '#2c2c2c',
          letterSpacing: '-0.3px'
        }}>
          知识图谱作品广场
        </h1>

        {/* 搜索框 */}
        <div style={{
          maxWidth: '650px',
          margin: '0 auto 28px auto',
          display: 'flex',
          gap: '0',
          background: 'white',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e0e0e0'
        }}>
          <input
            type="text"
            placeholder="搜索知识图谱"
            style={{
              flex: 1,
              padding: '15px 26px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              background: 'transparent',
              color: '#333'
            }}
          />
          <button
            style={{
              padding: '15px 30px',
              background: '#00bfa5',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00d4b8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#00bfa5'
            }}
          >
            🔍
          </button>
        </div>

        {/* 分类筛选 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '45px',
          flexWrap: 'wrap'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '9px 22px',
                background: selectedCategory === category ? '#00bfa5' : 'white',
                border: `1px solid ${selectedCategory === category ? '#00bfa5' : '#d8d8d8'}`,
                borderRadius: '22px',
                color: selectedCategory === category ? 'white' : '#555',
                fontSize: '13px',
                fontWeight: selectedCategory === category ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === category ? '0 2px 6px rgba(0, 191, 165, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category) {
                  e.currentTarget.style.borderColor = '#00bfa5'
                  e.currentTarget.style.color = '#00bfa5'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category) {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                  e.currentTarget.style.color = '#666'
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 作品网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '20px'
        }}>
          {sampleWorks.map((work, index) => (
            <div
              key={work.id}
              style={{
                background: 'white',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                border: index === 0 || index === 3 || index === 11 ? '3px solid #00bfa5' : '1px solid #ebebeb',
                boxShadow: index === 0 || index === 3 || index === 11 
                  ? '0 3px 12px rgba(0, 191, 165, 0.18)' 
                  : '0 1px 4px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = index === 0 || index === 3 || index === 11 
                  ? '0 3px 12px rgba(0, 191, 165, 0.18)' 
                  : '0 1px 4px rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* 作品缩略图 */}
              <div style={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                background: `linear-gradient(135deg, ${
                  index % 6 === 0 ? '#667eea, #764ba2' :
                  index % 6 === 1 ? '#0f2027, #203a43, #2c5364' :
                  index % 6 === 2 ? '#56ab2f, #a8e063' :
                  index % 6 === 3 ? '#000000, #434343' :
                  index % 6 === 4 ? '#bdc3c7, #2c3e50' :
                  '#00b4db, #0083b0'
                })`
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  {work.image}
                </div>
              </div>
              
              {/* 作品信息 */}
              <div style={{
                padding: '14px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c2c2c',
                  marginBottom: '5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {work.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ fontSize: '11px' }}>👤</span>
                  <span>{work.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  )
}
