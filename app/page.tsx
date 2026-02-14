'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const [loginHovered, setLoginHovered] = useState(false)
  const [createHovered, setCreateHovered] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const categories = ['全部', '科技', '教育', '商业', '艺术', '医疗', '其他']

  const handleStartCreating = () => {
    try {
      router.push('/graph')
    } catch (error) {
      console.error('Navigation failed:', error)
      window.location.href = '/graph'
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
          <button
            onMouseEnter={() => setLoginHovered(true)}
            onMouseLeave={() => setLoginHovered(false)}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              border: `2px solid ${loginHovered ? '#00bfa5' : '#e5e5e5'}`,
              borderRadius: '24px',
              color: loginHovered ? '#00bfa5' : '#666',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            登录
          </button>
          <button
            onClick={handleStartCreating}
            onMouseEnter={() => setCreateHovered(true)}
            onMouseLeave={() => setCreateHovered(false)}
            style={{
              padding: '10px 24px',
              background: createHovered ? '#00d4b8' : '#00bfa5',
              border: 'none',
              borderRadius: '24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: createHovered ? 'scale(1.05)' : 'scale(1)'
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
    </main>
  )
}
