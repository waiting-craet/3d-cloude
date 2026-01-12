'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: string
  name: string
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectName: string, graphName: string, isNewProject: boolean) => void
  existingProjects: Project[]
}

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onCreate,
  existingProjects 
}: CreateProjectModalProps) {
  const [isNewProject, setIsNewProject] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [graphName, setGraphName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(existingProjects[0].id)
    }
  }, [existingProjects, selectedProjectId])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!graphName.trim()) {
      setError('请输入知识图谱名称')
      return
    }

    if (isNewProject && !projectName.trim()) {
      setError('请输入项目名称')
      return
    }

    if (!isNewProject && !selectedProjectId) {
      setError('请选择一个项目')
      return
    }

    const finalProjectName = isNewProject ? projectName : 
      existingProjects.find(p => p.id === selectedProjectId)?.name || ''

    onCreate(finalProjectName, graphName, isNewProject)
    
    // 重置表单
    setProjectName('')
    setGraphName('')
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
            新建知识图谱
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}>
            创建新项目或在现有项目中添加图谱
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          {/* 项目类型选择 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsNewProject(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isNewProject 
                    ? 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isNewProject 
                    ? 'none' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                新建项目
              </button>
              <button
                type="button"
                onClick={() => setIsNewProject(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !isNewProject 
                    ? 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: !isNewProject 
                    ? 'none' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                选择现有项目
              </button>
            </div>
          </div>

          {/* 项目名称输入或选择 */}
          {isNewProject ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                项目名称
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value)
                  setError('')
                }}
                placeholder="请输入项目名称"
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
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                选择项目
              </label>
              {existingProjects.length > 0 ? (
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    setError('')
                  }}
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
                    cursor: 'pointer',
                  }}
                >
                  {existingProjects.map((project) => (
                    <option 
                      key={project.id} 
                      value={project.id}
                      style={{ background: '#1a1a1a' }}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                }}>
                  暂无项目，请先创建新项目
                </div>
              )}
            </div>
          )}

          {/* 知识图谱名称输入 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              知识图谱名称
            </label>
            <input
              type="text"
              value={graphName}
              onChange={(e) => {
                setGraphName(e.target.value)
                setError('')
              }}
              placeholder="请输入知识图谱名称"
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
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              创建
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
