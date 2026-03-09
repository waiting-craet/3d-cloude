'use client'

import { useState, useRef } from 'react'

interface InlineImageUploadProps {
  nodeId: string
  currentImageUrl?: string
  onImageChange: (url: string) => void
  disabled?: boolean
  onPreviewClick?: (url: string) => void
}

export function InlineImageUpload({
  nodeId,
  currentImageUrl,
  onImageChange,
  disabled = false,
  onPreviewClick,
}: InlineImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    // 显示预览
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // 上传文件
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nodeId', nodeId)
      formData.append('type', 'image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      onImageChange(data.url)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onImageChange('')
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px',
      }}>
        节点图片
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
        }}>
          <img
            src={preview}
            alt="节点图片"
            onClick={() => onPreviewClick?.(preview)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: onPreviewClick ? 'pointer' : 'default',
            }}
          />
          {onPreviewClick && (
            <div
              onClick={() => onPreviewClick(preview)}
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(4px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
              }}
            >
              <span style={{ fontSize: '14px' }}>🔍</span>
              点击预览
            </div>
          )}
          {!disabled && (
            <button
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
              }}
            >
              删除图片
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          style={{
            width: '100%',
            height: '200px',
            border: '2px dashed #6BB6FF',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            background: disabled ? '#f9fafb' : 'rgba(107, 182, 255, 0.05)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!disabled && !uploading) {
              e.currentTarget.style.background = 'rgba(107, 182, 255, 0.1)'
              e.currentTarget.style.borderColor = '#4A9EFF'
            }
          }}
          onMouseOut={(e) => {
            if (!disabled && !uploading) {
              e.currentTarget.style.background = 'rgba(107, 182, 255, 0.05)'
              e.currentTarget.style.borderColor = '#6BB6FF'
            }
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>📷</span>
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            {uploading ? '上传中...' : '点击上传图片'}
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            支持 JPG、PNG、GIF、WebP，最大 5MB
          </span>
        </div>
      )}
    </div>
  )
}
