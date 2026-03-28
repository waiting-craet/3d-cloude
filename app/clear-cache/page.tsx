'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 清理localStorage中的旧数据
    const oldKeys = [
      'projects',
      'currentProjectId',
      'currentGraphId',
    ]

    oldKeys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        // 检查是否是旧的本地ID格式
        if (value.includes('project-') || value.includes('graph-')) {
          console.log(`清理旧数据: ${key} = ${value}`)
          localStorage.removeItem(key)
        }
      }
    })

    setCleared(true)
  }, [])

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '600px',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
      }}>
        {cleared ? (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>缓存已清理</h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '32px',
              lineHeight: '1.6',
            }}>
              旧的本地数据已清理完成。<br />
              现在系统将从数据库加载最新的项目和图谱数据。
            </p>
            <button
              onClick={handleGoHome}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              返回首页
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔄</div>
            <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>正在清理缓存...</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              请稍候
            </p>
          </>
        )}
      </div>
    </div>
  )
}
