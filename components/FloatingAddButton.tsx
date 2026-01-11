'use client'

import { useState, useEffect } from 'react'
import AddNodeModal from './AddNodeModal'
import { useGraphStore } from '@/lib/store'

export default function FloatingAddButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { addNode } = useGraphStore()

  // 检查管理员状态
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    setIsAdmin(savedIsAdmin === 'true')

    // 监听 storage 事件以实时更新状态
    const handleStorageChange = () => {
      const currentIsAdmin = localStorage.getItem('isAdmin')
      setIsAdmin(currentIsAdmin === 'true')
    }

    window.addEventListener('storage', handleStorageChange)
    
    // 使用自定义事件监听同一页面内的 localStorage 变化
    const handleLoginStateChange = () => {
      const currentIsAdmin = localStorage.getItem('isAdmin')
      setIsAdmin(currentIsAdmin === 'true')
    }
    
    window.addEventListener('loginStateChange', handleLoginStateChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('loginStateChange', handleLoginStateChange)
    }
  }, [])

  const handleAddNode = async (name: string, description: string) => {
    await addNode({
      name,
      description,
      type: 'entity',
      x: Math.random() * 20 - 10,
      y: Math.random() * 15,
      z: Math.random() * 20 - 10,
      color: '#4A9EFF',
      size: 1.5,
    })
  }

  // 只在管理员登录时显示按钮
  if (!isAdmin) return null

  return (
    <>
      {/* 浮动按钮 - 仅管理员可见 */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
          border: 'none',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(74, 158, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(74, 158, 255, 0.6)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(74, 158, 255, 0.4)'
        }}
        title="添加节点"
      >
        +
      </button>

      {/* 添加节点弹窗 */}
      <AddNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNode}
      />
    </>
  )
}
