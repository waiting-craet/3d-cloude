'use client'

import { useState, useEffect } from 'react'
import styles from './CreateProjectModal.module.css'

interface Project {
  id: string
  name: string
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectName: string, graphName: string, isNewProject: boolean) => Promise<void>
  existingProjects: Project[]
  variant?: 'default' | 'creation'
}

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onCreate,
  existingProjects,
  variant = 'default',
}: CreateProjectModalProps) {
  const [isNewProject, setIsNewProject] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [graphName, setGraphName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (existingProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(existingProjects[0].id)
    }
  }, [existingProjects, selectedProjectId])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen, isCreating, onClose])

  if (!isOpen) return null

  const isCreationVariant = variant === 'creation'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 防止重复提交
    if (isCreating) {
      return
    }
    
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

    setIsCreating(true)
    setError('')
    
    try {
      await onCreate(finalProjectName, graphName, isNewProject)
      
      // 重置表单
      setProjectName('')
      setGraphName('')
      setError('')
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className={`${styles.backdrop} ${isCreationVariant ? styles.themeCreation : styles.themeDefault}`}
    >
      <div className={styles.dialog}>
        {/* 标题 */}
        <div className={styles.header}>
          <h2 className={styles.title}>新建知识图谱</h2>
          <p className={styles.subtitle}>创建新项目或在现有项目中添加图谱</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 项目类型选择 */}
          <div className={styles.section}>
            <div className={styles.segment}>
              <button
                type="button"
                onClick={() => setIsNewProject(true)}
                className={`${styles.segmentButton} ${isNewProject ? styles.segmentButtonActive : ''}`}
              >
                新建项目
              </button>
              <button
                type="button"
                onClick={() => setIsNewProject(false)}
                className={`${styles.segmentButton} ${!isNewProject ? styles.segmentButtonActive : ''}`}
              >
                选择现有项目
              </button>
            </div>
          </div>

          {/* 项目名称输入或选择 */}
          {isNewProject ? (
            <div className={styles.section}>
              <label className={styles.label}>项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value)
                  setError('')
                }}
                placeholder="请输入项目名称"
                autoFocus
                className={styles.input}
              />
            </div>
          ) : (
            <div className={styles.section}>
              <label className={styles.label}>选择项目</label>
              {existingProjects.length > 0 ? (
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    setError('')
                  }}
                  className={styles.input}
                >
                  {existingProjects.map((project) => (
                    <option 
                      key={project.id} 
                      value={project.id}
                      className={styles.option}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={styles.errorBox}>
                  暂无项目，请先创建新项目
                </div>
              )}
            </div>
          )}

          {/* 知识图谱名称输入 */}
          <div className={styles.section}>
            <label className={styles.label}>知识图谱名称</label>
            <input
              type="text"
              value={graphName}
              onChange={(e) => {
                setGraphName(e.target.value)
                setError('')
              }}
              placeholder="请输入知识图谱名称"
              className={styles.input}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          {/* 按钮组 */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              {isCreating && (
                <span className={styles.spinner} />
              )}
              {isCreating ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
