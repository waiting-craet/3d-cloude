'use client'

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, deleteNode, fetchGraph } = useGraphStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // 检查管理员状态
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    setIsAdmin(savedIsAdmin === 'true')

    // 监听登录状态变化
    const handleLoginStateChange = () => {
      const currentIsAdmin = localStorage.getItem('isAdmin')
      setIsAdmin(currentIsAdmin === 'true')
    }
    
    window.addEventListener('loginStateChange', handleLoginStateChange)
    window.addEventListener('storage', handleLoginStateChange)

    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
      window.removeEventListener('storage', handleLoginStateChange)
    }
  }, [])

  const handleClose = () => {
    setSelectedNode(null)
  }

  const handleEdit = () => {
    // 跳转到二维图谱编辑页面
    router.push('/workflow')
  }

  const handleDelete = async () => {
    if (!selectedNode) return
    
    if (!confirm(`确定要删除节点"${selectedNode.name}"吗？\n\n此操作将同时删除与该节点相关的所有连接，且无法撤销。`)) {
      return
    }

    try {
      await deleteNode(selectedNode.id)
      alert('删除成功！')
      setSelectedNode(null)
      // 刷新图谱数据
      fetchGraph()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  if (!selectedNode) return null

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      width: '380px',
      maxHeight: 'calc(100vh - 100px)',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(107, 182, 255, 0.2)',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      {/* 头部 - 渐变背景 */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(107, 182, 255, 0.3)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          节点详情
        </h2>
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'rotate(90deg)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'rotate(0deg)'
          }}
        >
          ×
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {/* 名称 - 只读展示 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}>
            名称
          </label>
          <div style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#f9fafb',
            color: '#1f2937',
            minHeight: '44px',
          }}>
            {selectedNode.name || '未命名'}
          </div>
        </div>

        {/* 描述 - 只读展示 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}>
            简介
          </label>
          <div style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#f9fafb',
            color: '#1f2937',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {selectedNode.description || '暂无简介'}
          </div>
        </div>

        {/* 媒体展示模块 */}
        {(selectedNode.imageUrl || selectedNode.videoUrl) && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
            }}>
              媒体内容
            </label>
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f9fafb',
            }}>
              {selectedNode.videoUrl ? (
                <video
                  src={selectedNode.videoUrl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    display: 'block',
                  }}
                >
                  您的浏览器不支持视频播放
                </video>
              ) : selectedNode.imageUrl ? (
                <img
                  src={selectedNode.imageUrl}
                  alt={selectedNode.name || '节点图片'}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* 元信息 */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(107, 182, 255, 0.08) 0%, rgba(74, 158, 255, 0.08) 100%)',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#4b5563',
          border: '1px solid rgba(107, 182, 255, 0.15)',
        }}>
          <div style={{ 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ 
              fontSize: '16px',
              background: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '600',
            }}>
              ℹ️
            </span>
            <strong style={{ color: '#1f2937' }}>节点信息</strong>
          </div>
          <div style={{ 
            marginBottom: '8px',
            paddingLeft: '24px',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6b7280' }}>类型:</span>
            <span style={{ 
              fontWeight: '500',
              color: '#1f2937',
              background: 'rgba(107, 182, 255, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {selectedNode.type}
            </span>
          </div>
          <div style={{ 
            marginBottom: '8px',
            paddingLeft: '24px',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6b7280' }}>ID:</span>
            <span style={{ 
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#4b5563',
            }}>
              {selectedNode.id.slice(0, 12)}...
            </span>
          </div>
          <div style={{ 
            paddingLeft: '24px',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#6b7280' }}>位置:</span>
            <span style={{ 
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#4b5563',
            }}>
              ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)}, {selectedNode.z.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* 底部按钮 - 仅管理员可见 */}
      {isAdmin && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          background: 'rgba(249, 250, 251, 0.8)',
        }}>
          <button
            onClick={handleEdit}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #6BB6FF 0%, #4A9EFF 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(107, 182, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 182, 255, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 182, 255, 0.3)'
            }}
          >
            <span style={{ fontSize: '16px' }}>✏️</span>
            修改
          </button>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)'
            }}
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
            删除
          </button>
        </div>
      )}
    </div>
  )
}
