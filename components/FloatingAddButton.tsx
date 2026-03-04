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

  // 二维按钮已移动到TopNavbar，此组件暂时不显示任何内容
  return null
}
