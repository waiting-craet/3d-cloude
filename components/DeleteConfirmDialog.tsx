import React, { useEffect, useState } from 'react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  entityType: 'project' | 'graph'
  entityName: string
  stats: {
    nodeCount: number
    edgeCount: number
    graphCount?: number // 仅项目有此字段
  }
  isDeleting?: boolean
}

/**
 * DeleteConfirmDialog组件 - 删除确认对话框
 * 
 * 特性：
 * - 模态对话框，背景半透明遮罩
 * - 显示警告图标和红色主题
 * - 显示实体名称和统计信息
 * - 确认和取消按钮
 * - 支持ESC键关闭
 * - 显示加载状态
 */
export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  stats,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const [cancelHovered, setCancelHovered] = useState(false)
  const [confirmHovered, setConfirmHovered] = useState(false)

  // ESC键关闭对话框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isDeleting, onClose])

  if (!isOpen) return null

  const entityTypeText = entityType === 'project' ? '项目' : '图谱'

  const handleConfirm = async () => {
    if (!isDeleting) {
      await onConfirm()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 1rem',
          padding: '1.5rem',
        }}
      >
        {/* 警告图标 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            margin: '0 auto',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
          }}
        >
          <svg
            style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 标题 */}
        <h3
          id="dialog-title"
          style={{
            marginTop: '1rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            textAlign: 'center',
            color: '#111827',
          }}
        >
          确认删除{entityTypeText}
        </h3>

        {/* 内容 */}
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
          <p style={{ textAlign: 'center' }}>
            你确定要删除{entityTypeText}
            <span style={{ fontWeight: '600', color: '#111827' }}> "{entityName}" </span>
            吗？
          </p>

          {/* 统计信息 */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
            }}
          >
            <p style={{ fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              将被删除的数据：
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#4b5563' }}>
              {entityType === 'project' && stats.graphCount !== undefined && (
                <li style={{ marginBottom: '0.25rem' }}>• {stats.graphCount} 个图谱</li>
              )}
              <li style={{ marginBottom: '0.25rem' }}>• {stats.nodeCount} 个节点</li>
              <li>• {stats.edgeCount} 条边</li>
            </ul>
          </div>

          <p
            style={{
              marginTop: '1rem',
              textAlign: 'center',
              color: '#dc2626',
              fontWeight: '500',
            }}
          >
            此操作不可撤销！
          </p>
        </div>

        {/* 按钮 */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => setCancelHovered(false)}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: cancelHovered && !isDeleting ? '#e5e7eb' : '#f3f4f6',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
            type="button"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => setConfirmHovered(false)}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white',
              backgroundColor: confirmHovered && !isDeleting ? '#b91c1c' : '#dc2626',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            type="button"
          >
            {isDeleting ? (
              <>
                <svg
                  style={{
                    animation: 'spin 1s linear infinite',
                    marginLeft: '-0.25rem',
                    marginRight: '0.5rem',
                    height: '1rem',
                    width: '1rem',
                    color: 'white',
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </button>
        </div>
      </div>

      {/* 添加旋转动画的样式 */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
