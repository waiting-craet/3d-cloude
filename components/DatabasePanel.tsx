'use client'

import { useState, useEffect } from 'react'

interface Stats {
  nodeCount: number
  edgeCount: number
  nodesByType: Array<{ type: string; count: number }>
}

export default function DatabasePanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCreateDocument = async () => {
    const name = prompt('输入文档名称:')
    if (!name) return

    const content = prompt('输入文档内容:')
    const autoSplit = confirm('是否自动分割成 chunks？')

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          content,
          autoSplit,
          tags: ['手动创建'],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || '文档创建成功！')
        fetchStats()
        window.location.reload() // 刷新页面显示新节点
      }
    } catch (error) {
      console.error('创建文档失败:', error)
      alert('创建文档失败')
    }
  }

  return (
    <div className="ui-overlay" style={{ bottom: 20, left: 20 }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        minWidth: '320px',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📊 数据库</h2>
          <button onClick={() => setIsOpen(!isOpen)} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0 5px',
          }}>
            {isOpen ? '−' : '+'}
          </button>
        </div>

        {isOpen && (
          <>
            {/* 统计信息 */}
            {stats && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>📈 统计</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <p style={{ margin: '5px 0' }}>节点总数: <strong>{stats.nodeCount}</strong></p>
                  <p style={{ margin: '5px 0' }}>关系总数: <strong>{stats.edgeCount}</strong></p>
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '5px 0', fontSize: '13px', opacity: 0.8 }}>按类型:</p>
                    {stats.nodesByType.map((item) => (
                      <p key={item.type} style={{ margin: '3px 0 3px 15px', fontSize: '13px' }}>
                        {item.type}: {item.count}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 搜索 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>🔍 搜索</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="搜索节点..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1a1a1a',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {isSearching ? '...' : '搜索'}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      style={{
                        padding: '8px',
                        marginBottom: '5px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    >
                      <strong>{result.name}</strong>
                      <span style={{ opacity: 0.7, marginLeft: '8px' }}>({result.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 快速操作 */}
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>⚡ 快速操作</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleCreateDocument}
                  style={{
                    padding: '10px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  📄 创建文档
                </button>
                <button
                  onClick={fetchStats}
                  style={{
                    padding: '10px',
                    background: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  🔄 刷新统计
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
