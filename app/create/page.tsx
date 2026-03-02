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
      background: '#fafafa',
      padding: '0'
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
      </nav>

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
          marginBottom: '50px',
          color: '#2c2c2c',
          letterSpacing: '-0.3px'
        }}>
          选择创作方式
        </h1>

        {/* 模块容器 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {/* 创建知识图谱模块 */}
          <div style={{
            position: 'relative'
          }}>
            <div
              onClick={() => setShowGraphDropdown(!showGraphDropdown)}
              style={{
                background: 'white',
                borderRadius: '14px',
                padding: '40px 30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #ebebeb',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>
                📊
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2c2c2c',
                marginBottom: '8px'
              }}>
                创建知识图谱
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                从零开始创建你的知识图谱
              </p>
              <div style={{
                marginTop: '8px',
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
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
              borderRadius: '14px',
              padding: '40px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid #ebebeb',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              📁
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c2c2c',
              marginBottom: '8px'
            }}>
              导入数据
            </h2>
            <p style={{
              fontSize: '13px',
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
              borderRadius: '14px',
              padding: '40px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid #ebebeb',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              🤖
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c2c2c',
              marginBottom: '8px'
            }}>
              AI生成知识图谱
            </h2>
            <p style={{
              fontSize: '13px',
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
          marginTop: '40px'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 24px',
              background: 'white',
              border: '1px solid #e5e5e5',
              borderRadius: '24px',
              color: '#666',
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
              e.currentTarget.style.borderColor = '#e5e5e5'
              e.currentTarget.style.color = '#666'
            }}
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </main>
  )
}
