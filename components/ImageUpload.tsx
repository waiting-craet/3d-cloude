'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void
  type?: 'node' | 'document' | 'general'
  id?: string
  currentImageUrl?: string
  buttonText?: string
}

export default function ImageUpload({
  onUploadSuccess,
  type = 'general',
  id,
  currentImageUrl,
  buttonText = '上传图片'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      formData.append('type', type)
      if (id) {
        formData.append('id', id)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onUploadSuccess(data.url)
      } else {
        const error = await response.json()
        alert(`上传失败: ${error.error}`)
        setPreview(currentImageUrl || null)
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = async () => {
    if (!currentImageUrl) return

    try {
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentImageUrl }),
      })

      if (response.ok) {
        setPreview(null)
        onUploadSuccess('')
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="预览"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
          >
            删除
          </button>
        </div>
      )}

      <button
        onClick={handleButtonClick}
        disabled={uploading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? '上传中...' : buttonText}
      </button>

      <p className="text-xs text-gray-500">
        支持 JPEG、PNG、GIF、WebP 格式，最大 5MB
      </p>
    </div>
  )
}
