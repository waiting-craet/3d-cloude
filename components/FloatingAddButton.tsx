'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FloatingAddButton() {
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

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

  // 只在管理员登录时显示按钮
  if (!isAdmin) return null

  return (
    <button
      onClick={() => router.push('/workflow')}
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
      title="创建新项目"
    >
      +
    </button>
  )
}
