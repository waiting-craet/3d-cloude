'use client'

import { useState, useRef } from 'react'

interface InlineVideoUploadProps {
  nodeId: string
  currentVideoUrl?: string
  onVideoChange: (url: string) => void
  disabled?: boolean
  readonly?: boolean
}

export function InlineVideoUpload({
  nodeId,
  currentVideoUrl,
  onVideoChange,
  disabled = false,
  readonly = false,
}: InlineVideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(currentVideoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件')
      return
    }

    // 验证文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      alert('视频大小不能超过50MB')
      return
    }

    // 提取视频尺寸
    setUploading(true)
    setError(null)

    try {
      // 使用HTML5 Video API提取视频尺寸
      const video = document.createElement('video')
      const videoObjectUrl = URL.createObjectURL(file)
      
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(videoObjectUrl)
          resolve()
        }
        video.onerror = () => {
          URL.revokeObjectURL(videoObjectUrl)
          reject(new Error('Failed to load video'))
        }
        video.src = videoObjectUrl
      })

      // 上传文件
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nodeId', nodeId)
      formData.append('type', 'video')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || data.error || '上传失败')
      }

      const data = await response.json()
      setVideoUrl(data.url)
      onVideoChange(data.url)
    } catch (error) {
      console.error('上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试'
      alert(errorMessage)
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    if (window.confirm('确定要删除此视频吗？')) {
      setVideoUrl(null)
      setError(null)
      onVideoChange('')
    }
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
        节点视频
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov,video/avi"
        onChange={handleFileSelect}
        disabled={disabled || readonly}
        style={{ display: 'none' }}
      />

      {videoUrl ? (
        <div style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
        }}>
          <video
            controls
            style={{
              width: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
              objectFit: 'contain',
              background: '#000',
            }}
            onError={() => {
              setError('视频加载失败')
            }}
          >
            <source src={videoUrl} />
            您的浏览器不支持视频播放
          </video>
          {!disabled && !readonly && (
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
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
              }}
            >
              删除视频
            </button>
          )}
          {error && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !readonly && !uploading && fileInputRef.current?.click()}
          style={{
            width: '100%',
            height: '200px',
            border: '2px dashed #6BB6FF',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled || readonly || uploading ? 'not-allowed' : 'pointer',
            background: disabled || readonly ? '#f9fafb' : 'rgba(107, 182, 255, 0.05)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!disabled && !readonly && !uploading) {
              e.currentTarget.style.background = 'rgba(107, 182, 255, 0.1)'
              e.currentTarget.style.borderColor = '#4A9EFF'
            }
          }}
          onMouseOut={(e) => {
            if (!disabled && !readonly && !uploading) {
              e.currentTarget.style.background = 'rgba(107, 182, 255, 0.05)'
              e.currentTarget.style.borderColor = '#6BB6FF'
            }
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</span>
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            {uploading ? '上传中...' : '点击上传视频'}
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            支持 MP4、WebM、MOV、AVI，最大 50MB
          </span>
        </div>
      )}
    </div>
  )
}
