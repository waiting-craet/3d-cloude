'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Project {
  id: string
  name: string
}

interface Graph {
  id: string
  name: string
}

export default function ImportPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedGraph, setSelectedGraph] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'excel' | 'csv' | 'json' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewGraphModal, setShowNewGraphModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newGraphName, setNewGraphName] = useState('')
  const [creating, setCreating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchGraphs(selectedProject)
    } else {
      setGraphs([])
      setSelectedGraph('')
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        // API 返回 { projects: [...] } 格式
        setProjects(Array.isArray(data.projects) ? data.projects : (Array.isArray(data) ? data : []))
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
    }
  }

  const fetchGraphs = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/graphs`)
      if (response.ok) {
        const data = await response.json()
        // API 返回 { graphs: [...] } 格式
        setGraphs(Array.isArray(data.graphs) ? data.graphs : (Array.isArray(data) ? data : []))
      }
    } catch (error) {
      console.error('Failed to fetch graphs:', error)
      setGraphs([])
    }
  }



  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('请输入项目名称')
      return
    }
    setCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProjectName.trim()
          // 不再自动创建默认图谱
        })
      })
      if (response.ok) {
        const result = await response.json()
        
        // 显示警告信息(如果有)
        if (result.warnings && result.warnings.length > 0) {
          console.warn('项目创建警告:', result.warnings)
        }
        
        await fetchProjects()
        setSelectedProject(result.project.id)
        setShowNewProjectModal(false)
        setNewProjectName('')
      } else {
        const error = await response.json()
        alert(error.error || '创建项目失败')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('创建项目失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateGraph = async () => {
    if (!newGraphName.trim()) {
      alert('请输入图谱名称')
      return
    }
    if (!selectedProject) {
      alert('请先选择项目')
      return
    }
    setCreating(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject}/graphs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newGraphName.trim()
        })
      })
      if (response.ok) {
        const result = await response.json()
        await fetchGraphs(selectedProject)
        setSelectedGraph(result.graph.id)
        setShowNewGraphModal(false)
        setNewGraphName('')
      } else {
        const error = await response.json()
        alert(error.error || '创建图谱失败')
      }
    } catch (error) {
      console.error('Failed to create graph:', error)
      alert('创建图谱失败')
    } finally {
      setCreating(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      setFileType('excel')
    } else if (fileName.endsWith('.csv')) {
      setFileType('csv')
    } else if (fileName.endsWith('.json')) {
      setFileType('json')
    } else {
      setFileType(null)
      setUploadStatus('不支持的文件格式')
    }
  }

  const handleDownloadTemplate = (templateType: 'csv' | 'json' | 'excel') => {
    if (templateType === 'excel') {
      // For Excel, use API endpoint - fixed to 3D format
      const link = document.createElement('a')
      link.href = `/api/templates?format=excel`
      link.download = `3d-graph-template.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For CSV and JSON, use static files - fixed to 3D format
      const fileName = `3d-graph-template.${templateType}`
      
      const link = document.createElement('a')
      link.href = `/templates/${fileName}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleGenerateClick = () => {
    if (!selectedFile || !selectedProject || !selectedGraph) {
      setUploadStatus('请选择项目、图谱和文件')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmUpload = async () => {
    setShowConfirmModal(false)
    setShowLoadingModal(true)
    await handleUpload()
  }

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setShowLoadingModal(false)
    setUploading(false)
    setUploadStatus('已取消生成')
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedProject || !selectedGraph || !fileType) {
      setUploadStatus('请选择项目、图谱和文件')
      setShowLoadingModal(false)
      return
    }
    
    // 创建新的 AbortController
    const controller = new AbortController()
    setAbortController(controller)
    
    setUploading(true)
    setUploadStatus('正在上传...')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('projectId', selectedProject)
      formData.append('graphId', selectedGraph)
      formData.append('fileType', fileType)
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      
      const result = await response.json()
      
      if (response.ok) {
        let successMessage = '导入成功！'
        if (result.warnings && result.warnings.length > 0) {
          successMessage += `\n注意事项：${result.warnings.join('；')}`
        }
        if (result.skippedEdges > 0) {
          successMessage += `\n跳过了 ${result.skippedEdges} 条无效边`
        }
        setUploadStatus(successMessage)
        setShowLoadingModal(false)
        setTimeout(() => router.push('/graph'), 2000)
      } else {
        let errorMessage = '导入失败：'
        if (result.errors && Array.isArray(result.errors)) {
          errorMessage += '\n' + result.errors.join('\n')
        } else {
          errorMessage += result.message || '未知错误'
        }
        
        if (result.warnings && result.warnings.length > 0) {
          errorMessage += '\n\n警告：' + result.warnings.join('；')
        }
        
        setUploadStatus(errorMessage)
        setShowLoadingModal(false)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Upload cancelled by user')
        setUploadStatus('已取消生成')
      } else {
        console.error('Upload failed:', error)
        setUploadStatus('导入失败，请重试')
      }
      setShowLoadingModal(false)
    } finally {
      setUploading(false)
      setAbortController(null)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#fafafa',
      padding: '0'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#00bfa5'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#00bfa5',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            📊
          </div>
          知识图谱
        </div>
      </nav>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '50px 30px 100px 30px'
      }}>
        {/* 标题 */}
        <h1 style={{
          fontSize: '38px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '50px',
          color: '#2c2c2c',
          letterSpacing: '-0.3px'
        }}>
          导入数据
        </h1>
        {/* 顶部选择区域 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '30px',
          alignItems: 'center'
        }}>
          {/* 项目选择 */}
          <div style={{
            flex: 1,
            background: 'white',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid #ebebeb',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">项目选择</option>
              {Array.isArray(projects) && projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNewProjectModal(true)}
              style={{
                padding: '8px 16px',
                background: '#00bfa5',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00d4b8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00bfa5'
              }}
            >
              + 新建
            </button>
          </div>
        </div>

        {/* 主内容区 - 两列布局 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* 左侧 - 导入数据 */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '30px',
            border: '1px solid #ebebeb',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c2c2c',
              marginBottom: '20px'
            }}>
              导入数据
            </h2>

            {/* 文件类型选择 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {['Excel', 'CSV', 'JSON'].map((type) => (
                <div
                  key={type}
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    padding: '30px 20px',
                    border: selectedFile && fileType?.toUpperCase() === type.toUpperCase()
                      ? '2px solid #00bfa5'
                      : '1px solid #e5e5e5',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}>📄</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#2c2c2c', marginBottom: '4px' }}>
                    {type}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>拖拽文件到此</div>
                </div>
              ))}
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />

            {selectedFile && (
              <div style={{
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '13px'
              }}>
                📎 {selectedFile.name} ({fileType?.toUpperCase()})
              </div>
            )}

            {/* 图谱选择 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#2c2c2c',
                marginBottom: '8px'
              }}>
                选择图谱
              </label>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <select
                  value={selectedGraph}
                  onChange={(e) => setSelectedGraph(e.target.value)}
                  disabled={!selectedProject}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: selectedProject ? 'pointer' : 'not-allowed',
                    opacity: selectedProject ? 1 : 0.5
                  }}
                >
                  <option value="">请选择图谱</option>
                  {Array.isArray(graphs) && graphs.map((graph) => (
                    <option key={graph.id} value={graph.id}>{graph.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewGraphModal(true)}
                  disabled={!selectedProject}
                  style={{
                    padding: '10px 16px',
                    background: !selectedProject ? '#ccc' : '#00bfa5',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: !selectedProject ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = '#00d4b8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = '#00bfa5'
                    }
                  }}
                >
                  + 新建
                </button>
              </div>
            </div>
          </div>

          {/* 右侧 - 模板下载 */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '30px',
            border: '1px solid #ebebeb',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c2c2c',
              marginBottom: '20px'
            }}>
              模板下载
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleDownloadTemplate('excel')}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#1a3a52'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#ddd'
                }}
              >
                <span style={{ fontSize: '16px' }}>📊</span>
                <span>Excel模板 (3D)</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('csv')}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#00bfa5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#ddd'
                }}
              >
                <span style={{ fontSize: '16px' }}>📄</span>
                <span>CSV模板 (3D)</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('json')}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#00bfa5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#ddd'
                }}
              >
                <span style={{ fontSize: '16px' }}>📋</span>
                <span>JSON模板 (3D)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 底部生成按钮 */}
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #ebebeb',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
          textAlign: 'center'
        }}>
          <button
            onClick={handleGenerateClick}
            disabled={!selectedFile || !selectedProject || !selectedGraph || uploading}
            style={{
              padding: '14px 60px',
              background: (!selectedFile || !selectedProject || !selectedGraph || uploading)
                ? '#e0e0e0'
                : '#00bfa5',
              border: 'none',
              borderRadius: '24px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (!selectedFile || !selectedProject || !selectedGraph || uploading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedFile && selectedProject && selectedGraph && !uploading) {
                e.currentTarget.style.background = '#00d4b8'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile && selectedProject && selectedGraph && !uploading) {
                e.currentTarget.style.background = '#00bfa5'
              }
            }}
          >
            {uploading ? '正在生成...' : '生成图谱'}
          </button>

          {uploadStatus && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: uploadStatus.includes('成功') ? '#d4edda' : '#f8d7da',
              color: uploadStatus.includes('成功') ? '#155724' : '#721c24',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>

      {/* 新建项目模态框 */}
      {showNewProjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px'
            }}>
              新建项目
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="请输入项目名称"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '20px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateProject()
              }}
            />
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectName('')
                }}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                style={{
                  padding: '10px 20px',
                  background: creating || !newProjectName.trim() ? '#e0e0e0' : '#00bfa5',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: creating || !newProjectName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!creating && newProjectName.trim()) {
                    e.currentTarget.style.background = '#00d4b8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating && newProjectName.trim()) {
                    e.currentTarget.style.background = '#00bfa5'
                  }
                }}
              >
                {creating ? '创建中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建图谱模态框 */}
      {showNewGraphModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px'
            }}>
              新建图谱
            </h3>
            <input
              type="text"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
              placeholder="请输入图谱名称"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '15px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateGraph()
              }}
            />
            <div style={{
              padding: '10px',
              background: '#f0f8ff',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#00bfa5'
            }}>
              图谱类型: 3D (统一格式)
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNewGraphModal(false)
                  setNewGraphName('')
                }}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={creating || !newGraphName.trim()}
                style={{
                  padding: '10px 20px',
                  background: creating || !newGraphName.trim() ? '#ccc' : '#00bfa5',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: creating || !newGraphName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? '创建中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认导入模态框 */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '450px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              确认生成图谱
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '14px',
                color: '#555'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>项目:</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    {projects.find(p => p.id === selectedProject)?.name || ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>图谱:</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    {graphs.find(g => g.id === selectedGraph)?.name || ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>文件:</span>
                  <span style={{ fontWeight: '600', color: '#333', fontSize: '13px' }}>
                    {selectedFile?.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>格式:</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    {fileType?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              background: '#fff3cd',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#856404',
              border: '1px solid #ffeaa7'
            }}>
              ⚠️ 数据将被导入到选定的图谱中，此操作不可撤销
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 24px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                style={{
                  padding: '10px 24px',
                  background: '#00bfa5',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00d4b8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00bfa5'
                }}
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成中加载模态框 */}
      {showLoadingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            {/* 加载动画 */}
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 24px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #00bfa5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px'
            }}>
              正在生成图谱...
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              {uploadStatus || '正在处理您的数据，请稍候'}
            </p>
            
            <button
              onClick={handleCancelUpload}
              style={{
                padding: '12px 32px',
                background: '#f5f5f5',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#666',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0e0e0'
                e.currentTarget.style.borderColor = '#bbb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5'
                e.currentTarget.style.borderColor = '#ddd'
              }}
            >
              取消生成
            </button>
          </div>
          
          {/* CSS动画 */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </main>
  )
}
