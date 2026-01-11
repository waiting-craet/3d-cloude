'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'
import LoginModal from './LoginModal'

export default function TopNavbar() {
  const { nodes, addNode } = useGraphStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')

  // 实时搜索节点
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = nodes.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery, nodes])

  const handleLogin = (username: string, password: string) => {
    // 设置管理员状态
    setIsAdmin(true)
    setAdminUsername(username)
    // 可以在这里保存到 localStorage
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminUsername', username)
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setAdminUsername('')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminUsername')
  }

  const handleCreateNew = async () => {
    // 创建新节点
    await addNode({
      name: `新节点 ${Date.now()}`,
      type: 'entity',
      x: Math.random() * 20 - 10,
      y: Math.random() * 15,
      z: Math.random() * 20 - 10,
      color: '#4A9EFF',
      size: 1.5,
    })
  }

  // 页面加载时检查登录状态
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    const savedUsername = localStorage.getItem('adminUsername')
    if (savedIsAdmin === 'true' && savedUsername) {
      setIsAdmin(true)
      setAdminUsername(savedUsername)
    }
  }, [])

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px',
        gap: '20px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      }}>
        {/* 左侧：现有图谱标签 */}
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}>
          现有图谱
        </div>

        {/* 搜索框 */}
        <div style={{ position: 'relative', flex: '0 0 400px' }}>
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          />
          
          {/* 搜索结果下拉框 */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: 'rgba(40, 40, 40, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
            }}>
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(74, 158, 255, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    {node.name}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px' }}>
                    类型: {node.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧按钮区域 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 管理员专属：新建按钮 */}
          {isAdmin && (
            <button
              onClick={handleCreateNew}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              新建
            </button>
          )}

          {/* 登录/登出按钮 */}
          {!isAdmin ? (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)'
              }}
            >
              登录
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 管理员信息 */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(74, 158, 255, 0.15)',
                border: '1px solid rgba(74, 158, 255, 0.3)',
                borderRadius: '8px',
                color: '#4A9EFF',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                👤 {adminUsername}
              </div>
              
              {/* 登出按钮 */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.color = 'white'
                }}
              >
                登出
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </>
  )
}
