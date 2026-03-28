'use client'

import { useState, useRef } from 'react'

interface BannerImageUploadProps {
  onUploadSuccess?: () => void
}

export default function BannerImageUpload({ onUploadSuccess }: BannerImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择图片文件')
      setUploadStatus('error')
      return
    }

    // 验证文件大小 (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('文件大小不能超过 5MB')
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-banner', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      setUploadStatus('success')
      setErrorMessage('图片上传成功！页面将在 3 秒后刷新')
      
      setTimeout(() => {
        window.location.reload()
      }, 3000)

      onUploadSuccess?.()
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        background: 'rgba(102, 126, 234, 0.05)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        borderRadius: '12px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1a1a1a', fontSize: '16px', fontWeight: '600' }}>
          📸 上传横幅图片
        </h3>
        <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>
          推荐尺寸: 1920 x 320 像素，文件大小 &lt; 5MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        style={{
          padding: '12px 24px',
          background: isUploading
            ? 'rgba(102, 126, 234, 0.5)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
          opacity: isUploading ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!isUploading) {
            e.currentTarget.style.transform = 'translateY(-2px)'
          }
        }}
        onMouseOut={(e) => {
          if (!isUploading) {
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        {isUploading ? '上传中...' : '选择图片'}
      </button>

      {uploadStatus === 'success' && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            color: '#22c55e',
            fontSize: '14px',
          }}
        >
          ✓ {errorMessage}
        </div>
      )}

      {uploadStatus === 'error' && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          ✕ {errorMessage}
        </div>
      )}
    </div>
  )
}
