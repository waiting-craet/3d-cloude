'use client'

import { useState, useRef } from 'react'
import { useGraphStore } from '@/lib/store'
import { getThemeConfig } from '@/lib/theme'

interface CoverUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projects: any[]
}

export default function CoverUploadModal({ isOpen, onClose, projects }: CoverUploadModalProps) {
  const { theme, currentProject, currentGraph, refreshProjects } = useGraphStore()
  const themeConfig = getThemeConfig(theme)

  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProject?.id || '')
  const [selectedGraphId, setSelectedGraphId] = useState<string>('')
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUploading) {
      handleClose()
    }
  }

  const handleClose = () => {
    setUploadSuccess(false)
    setUploadError(null)
    onClose()
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  
  // Decide whether the upload is for a project or a graph based on selections
  const entityType = selectedGraphId ? 'graph' : 'project'
  const entityId = selectedGraphId || selectedProjectId

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!entityId) {
      setUploadError('请先选择要添加封面的项目或图谱')
      return
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('仅支持图片上传')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityId', entityId)
    formData.append('entityType', entityType)

    try {
      const response = await fetch('/api/upload-cover', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '上传失败')
      }

      setUploadSuccess(true)
      await refreshProjects() // Refresh projects to update coverUrls in store
      
      // Close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
      
    } catch (error) {
      console.error('上传封面失败:', error)
      setUploadError(error instanceof Error ? error.message : '上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = '' // reset file input
      }
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: themeConfig.panelBackground,
        border: `1px solid ${themeConfig.panelBorder}`,
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: themeConfig.panelShadow,
        color: themeConfig.panelText,
        position: 'relative',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* 关闭按钮 */}
        {!isUploading && !uploadSuccess && (
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: themeConfig.panelText,
              opacity: 0.5,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: '700',
        }}>
          添加封面
        </h2>

        {uploadSuccess ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#10b981',
          }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="rgba(16,185,129,0.12)" />
                <path d="M7.5 12.5l3 3 6-6.5" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>封面上传成功！</div>
          </div>
        ) : (
          <>
            {/* 项目选择 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              }}>
                选择目标项目
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value)
                  setSelectedGraphId('') // reset graph selection
                }}
                disabled={isUploading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: themeConfig.inputBackground,
                  border: `1px solid ${themeConfig.inputBorder}`,
                  borderRadius: '10px',
                  color: themeConfig.inputText,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  appearance: 'none',
                }}
              >
                <option value="" disabled>请选择项目</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 图谱选择（可选） */}
            {selectedProjectId && selectedProject?.graphs && selectedProject.graphs.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                }}>
                  选择图谱（可选，留空则为项目设置封面）
                </label>
                <select
                  value={selectedGraphId}
                  onChange={(e) => setSelectedGraphId(e.target.value)}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: themeConfig.inputBackground,
                    border: `1px solid ${themeConfig.inputBorder}`,
                    borderRadius: '10px',
                    color: themeConfig.inputText,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    appearance: 'none',
                  }}
                >
                  <option value="">为项目 {selectedProject.name} 设置封面</option>
                  {selectedProject.graphs.map((g: any) => (
                    <option key={g.id} value={g.id}>为图谱 {g.name} 设置封面</option>
                  ))}
                </select>
              </div>
            )}

            {/* 提示信息 */}
            <div style={{
              padding: '16px',
              background: theme === 'dark' ? 'rgba(74, 158, 255, 0.1)' : 'rgba(74, 158, 255, 0.05)',
              borderLeft: '4px solid #4a9eff',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              lineHeight: '1.5',
            }}>
              <span style={{ fontWeight: 'bold', color: '#4a9eff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 18h6M10 21h4M8 10a4 4 0 1 1 8 0c0 1.6-.8 2.8-1.9 3.7-.7.6-1.1 1.4-1.1 2.3H11c0-.9-.4-1.7-1.1-2.3C8.8 12.8 8 11.6 8 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                提示：
              </span>
              为了获得最佳的卡片显示效果，推荐上传尺寸比例为 <strong>16:9</strong> 或 <strong>1:1</strong> 的高质量图片。图片大小不超过 5MB。
            </div>

            {/* 错误提示 */}
            {uploadError && (
              <div style={{
                color: '#ef4444',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}

            {/* 上传按钮区域 */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: 'none' }}
                disabled={isUploading || !entityId}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !entityId}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: isUploading || !entityId ? '#9ca3af' : 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isUploading || !entityId ? 'not-allowed' : 'pointer',
                  boxShadow: isUploading || !entityId ? 'none' : '0 4px 12px rgba(74, 158, 255, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => {
                  if (!isUploading && entityId) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 158, 255, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isUploading && entityId) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.3)'
                  }
                }}
              >
                {isUploading ? (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M20 4v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    上传中...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
                      <path d="M5.5 17.5 11 12.5l2.8 2.8 2.2-2.3 2.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    选择封面图片上传
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
