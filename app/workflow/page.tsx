'use client'

import { useRef } from 'react'
import { useGraphStore } from '@/lib/store'
import { getThemeConfig } from '@/lib/theme'
import WorkflowCanvas, { type WorkflowCanvasRef } from '@/components/WorkflowCanvas'

export default function WorkflowPage() {
  const canvasRef = useRef<WorkflowCanvasRef>(null)
  const { theme } = useGraphStore()
  const themeConfig = getThemeConfig(theme)

  const handleSave = () => {
    canvasRef.current?.saveAndConvert()
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: themeConfig.pageBackground,
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: themeConfig.navbarBackground,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${themeConfig.navbarBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${themeConfig.buttonBorder}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: themeConfig.navbarText,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = themeConfig.buttonHoverBackground
            e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = themeConfig.buttonBorder
          }}
        >
          ← 返回
        </button>
        
        <div style={{
          marginLeft: '20px',
          fontSize: '16px',
          fontWeight: '600',
          color: themeConfig.navbarText,
        }}>
          二维知识图谱创建
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSave}
            disabled={canvasRef.current?.isConverting}
            style={{
              padding: '8px 16px',
              background: canvasRef.current?.isConverting ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: canvasRef.current?.isConverting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'white',
              fontWeight: '500',
              opacity: canvasRef.current?.isConverting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!canvasRef.current?.isConverting) {
                e.currentTarget.style.background = '#2563eb'
              }
            }}
            onMouseOut={(e) => {
              if (!canvasRef.current?.isConverting) {
                e.currentTarget.style.background = '#3b82f6'
              }
            }}
          >
            {canvasRef.current?.isConverting ? '转换中...' : '保存并转换为3D'}
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <WorkflowCanvas ref={canvasRef} />
    </div>
  )
}
