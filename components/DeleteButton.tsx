import React, { useState } from 'react'

interface DeleteButtonProps {
  onDelete: (e: React.MouseEvent) => void
  disabled?: boolean
  ariaLabel: string
}

/**
 * DeleteButton组件 - 用于删除项目或图谱的按钮
 * 
 * 特性：
 * - 显示垃圾桶图标
 * - 悬停时显示红色高亮
 * - 点击时阻止事件冒泡
 * - 支持禁用状态
 * - 支持可访问性（aria-label）
 */
export default function DeleteButton({
  onDelete,
  disabled = false,
  ariaLabel,
}: DeleteButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡到父元素
    if (!disabled) {
      onDelete(e)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '8px',
        background: isHovered && !disabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: disabled ? 'rgba(255, 255, 255, 0.3)' : isHovered ? '#ef4444' : 'rgba(255, 255, 255, 0.5)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      type="button"
    >
      {/* 垃圾桶图标 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '20px', height: '20px' }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  )
}
