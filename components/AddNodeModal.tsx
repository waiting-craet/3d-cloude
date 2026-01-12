'use client'

import { useState } from 'react'

interface AddNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, description: string) => void
}

export default function AddNodeModal({ isOpen, onClose, onAdd }: AddNodeModalProps) {
  const [nodeName, setNodeName] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nodeName.trim()) {
      setError('请输入节点名称')
      return
    }

    onAdd(nodeName.trim(), nodeDescription.trim())
    
    // 重置表单
    setNodeName('')
    setNodeDescription('')
    setError('')
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(30, 30, 30, 0.98)',
          borderRadius: '16px',
          padding: '40px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* 标题 */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '8px',
          }}>
            添加节点
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}>
            创建新的知识节点
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          {/* 节点名称输入 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              节点名称 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => {
                setNodeName(e.target.value)
                setError('')
              }}
              placeholder="请输入节点名称"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
            />
          </div>

          {/* 节点介绍输入 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              节点介绍 <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>(选填)</span>
            </label>
            <textarea
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              placeholder="请输入节点介绍..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* 按钮组 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
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
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
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
              添加
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
