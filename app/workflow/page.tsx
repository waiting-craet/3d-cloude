'use client'

import { useRef } from 'react'
import WorkflowCanvas, { type WorkflowCanvasRef } from '@/components/WorkflowCanvas'

export default function WorkflowPage() {
  const canvasRef = useRef<WorkflowCanvasRef>(null)

  const handleSave = () => {
    canvasRef.current?.saveAndConvert()
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#f5f5f7',
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'white',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← 返回
        </button>
        
        <div style={{
          marginLeft: '20px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
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
              borderRadius: '6px',
              cursor: canvasRef.current?.isConverting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: 'white',
              fontWeight: '500',
              opacity: canvasRef.current?.isConverting ? 0.6 : 1,
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
