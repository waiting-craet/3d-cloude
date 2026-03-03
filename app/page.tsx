'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import LoginModal from '@/components/LoginModal'
import SmartCategoryFilter, { Category } from '@/components/SmartCategoryFilter'
import { useUserStore } from '@/lib/userStore'

export default function LandingPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
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

  // 分类数据配置
  const categories: Category[] = [
    { id: 'all', name: '全部', icon: '📚', color: '#00bfa5' },
    { id: 'tech', name: '科技', icon: '💻', color: '#2196F3' },
    { id: 'education', name: '教育', icon: '🎓', color: '#4CAF50' },
    { id: 'business', name: '商业', icon: '💼', color: '#FF9800' },
    { id: 'art', name: '艺术', icon: '🎨', color: '#E91E63' },
    { id: 'medical', name: '医疗', icon: '⚕️', color: '#009688' },
    { id: 'other', name: '其他', icon: '📋', color: '#607D8B' }
  ]

  // 模拟作品数量数据
  const workCount = {
    all: 120,
    tech: 45,
    education: 32,
    business: 28,
    art: 15,
    medical: 8,
    other: 12
  }

  const categories_old = ['全部', '科技', '教育', '商业', '艺术', '医疗', '其他']

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
        {/* 分类筛选 */}
        <div style={{ marginBottom: '45px' }}>
          <SmartCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            workCount={workCount}
            size="medium"
            variant="pills"
            showCount={true}
            animated={true}
          />
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
                  index % 6 === 0 ? '#00bfa5, #00d4b8' :
                  index % 6 === 1 ? '#667eea, #764ba2' :
                  index % 6 === 2 ? '#56ab2f, #a8e063' :
                  index % 6 === 3 ? '#434343, #000000' :
                  index % 6 === 4 ? '#2c3e50, #bdc3c7' :
                  '#0083b0, #00b4db'
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
