'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginModal from '@/components/LoginModal'
import ProjectList from '@/components/ProjectList'
import { useUserStore } from '@/lib/userStore'

export default function LandingPage() {
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

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
  }

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

  // 示例作品数据 - 已替换为ProjectList组件
  // const sampleWorks = [...]

  return (
    <main style={{
      minHeight: '100vh',
      background: '#fafafa',
      color: '#333'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo/标题 */}
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#00bfa5'
          }}>
            知识图谱
          </div>

          {/* 右侧按钮组 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleStartCreating}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #00bfa5, #00d4b8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 191, 165, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  开始创作
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00bfa5'
                    e.currentTarget.style.color = '#00bfa5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#666'
                  }}
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #00bfa5, #00d4b8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 191, 165, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  登录/注册
                </button>
                <button
                  onClick={handleStartCreating}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00bfa5'
                    e.currentTarget.style.color = '#00bfa5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#666'
                  }}
                >
                  开始创作
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 标题区域 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #00bfa5 50%, #00d4b8 75%, #4facfe 100%)',
        padding: '40px 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 30px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 12px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            知识图谱作品广场
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.95)',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            发现、创建和分享知识的无限可能
          </p>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '50px 30px 100px 30px'
      }} data-works-section>
        {/* 项目列表 */}
        <ProjectList maxItems={12} columns={6} />
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  )
}
