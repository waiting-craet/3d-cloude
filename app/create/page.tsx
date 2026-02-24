'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreatePage() {
  const router = useRouter()
  const [showGraphDropdown, setShowGraphDropdown] = useState(false)

  const handleCreate3DGraph = () => {
    router.push('/graph')
  }

  const handleCreate2DGraph = () => {
    // 跳转到2D知识图谱页面（暂时也跳转到graph）
    router.push('/graph')
  }

  const handleImportData = () => {
    // 跳转到导入数据页面
    router.push('/import')
  }

  const handleAIGenerate = () => {
    // 跳转到AI生成页面
    router.push('/text-page')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%'
      }}>
        {/* 标题 */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '60px',
          color: 'white',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}>
          选择创作方式
        </h1>

        {/* 模块容器 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '30px',
          padding: '0 20px'
        }}>
          {/* 创建知识图谱模块 */}
          <div style={{
            position: 'relative'
          }}>
            <div
              onClick={() => setShowGraphDropdown(!showGraphDropdown)}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '50px 30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>
                📊
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px'
              }}>
                创建知识图谱
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                从零开始创建你的知识图谱
              </p>
              <div style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#999'
              }}>
                点击选择 ▼
              </div>
            </div>

            {/* 下拉菜单 */}
            {showGraphDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '10px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                zIndex: 10
              }}>
                <div
                  onClick={handleCreate3DGraph}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f8f8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '4px'
                  }}>
                    🌐 创建3D知识图谱
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    立体可视化，交互性强
                  </div>
                </div>
                <div
                  onClick={handleCreate2DGraph}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f8f8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '4px'
                  }}>
                    📈 创建2D知识图谱
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    平面展示，简洁清晰
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 导入数据模块 */}
          <div
            onClick={handleImportData}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '50px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              📁
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              导入数据
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.6'
            }}>
              从文件或数据库导入现有数据
            </p>
          </div>

          {/* AI生成知识图谱模块 */}
          <div
            onClick={handleAIGenerate}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '50px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              🤖
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              AI生成知识图谱
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.6'
            }}>
              使用AI智能分析文本生成图谱
            </p>
          </div>
        </div>

        {/* 返回按钮 */}
        <div style={{
          textAlign: 'center',
          marginTop: '50px'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 30px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white',
              borderRadius: '30px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </main>
  )
}
