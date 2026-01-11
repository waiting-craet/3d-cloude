'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'

export default function TopNavbar() {
  const { nodes } = useGraphStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

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

  const handleLogin = () => {
    // TODO: 实现登录逻辑
    alert('登录功能开发中...')
  }

  return (
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

      {/* 右侧：登录按钮 */}
      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={handleLogin}
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
      </div>
    </nav>
  )
}
