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
      background: 'linear-gradient(135deg, #e8f0ed 0%, #d4e4df 100%)',
      padding: '0'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 166, 154, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#5a7a6e'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #7fa99b 0%, #5a7a6e 100%)',
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
          color: '#3d5a50',
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
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '14px',
                padding: '40px 30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(139, 166, 154, 0.25)',
                boxShadow: '0 4px 12px rgba(90, 122, 110, 0.12)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 122, 110, 0.2)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 122, 110, 0.12)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
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
                color: '#3d5a50',
                marginBottom: '8px'
              }}>
                创建知识图谱
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#6b8578',
                lineHeight: '1.6'
              }}>
                从零开始创建你的知识图谱
              </p>
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#8ba69a'
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
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 166, 154, 0.3)',
                boxShadow: '0 8px 32px rgba(90, 122, 110, 0.2)',
                overflow: 'hidden',
                zIndex: 10
              }}>
                <div
                  onClick={handleCreate3DGraph}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    borderBottom: '1px solid rgba(139, 166, 154, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 228, 223, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#3d5a50',
                    marginBottom: '4px'
                  }}>
                    🌐 创建3D知识图谱
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b8578'
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
                    e.currentTarget.style.background = 'rgba(212, 228, 223, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#3d5a50',
                    marginBottom: '4px'
                  }}>
                    📈 创建2D知识图谱
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b8578'
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
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '14px',
              padding: '40px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(139, 166, 154, 0.25)',
              boxShadow: '0 4px 12px rgba(90, 122, 110, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 122, 110, 0.2)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 122, 110, 0.12)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
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
              color: '#3d5a50',
              marginBottom: '8px'
            }}>
              导入数据
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#6b8578',
              lineHeight: '1.6'
            }}>
              从文件或数据库导入现有数据
            </p>
          </div>

          {/* AI生成知识图谱模块 */}
          <div
            onClick={handleAIGenerate}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '14px',
              padding: '40px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(139, 166, 154, 0.25)',
              boxShadow: '0 4px 12px rgba(90, 122, 110, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 122, 110, 0.2)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 122, 110, 0.12)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
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
              color: '#3d5a50',
              marginBottom: '8px'
            }}>
              AI生成知识图谱
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#6b8578',
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
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(139, 166, 154, 0.3)',
              borderRadius: '24px',
              color: '#6b8578',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7fa99b'
              e.currentTarget.style.color = '#5a7a6e'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 166, 154, 0.3)'
              e.currentTarget.style.color = '#6b8578'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
            }}
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </main>
  )
}
