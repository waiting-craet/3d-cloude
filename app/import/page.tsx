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
  const [graphType, setGraphType] = useState<'2D' | '3D'>('2D')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'excel' | 'csv' | 'json' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewGraphModal, setShowNewGraphModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newGraphName, setNewGraphName] = useState('')
  const [creating, setCreating] = useState(false)

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
        setProjects(Array.isArray(data) ? data : [])
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
        setGraphs(Array.isArray(data) ? data : [])
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
        body: JSON.stringify({ name: newProjectName.trim() })
      })
      if (response.ok) {
        const newProject = await response.json()
        await fetchProjects()
        setSelectedProject(newProject.id)
        setShowNewProjectModal(false)
        setNewProjectName('')
      } else {
        alert('创建项目失败')
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
          name: newGraphName.trim(),
          type: graphType
        })
      })
      if (response.ok) {
        const newGraph = await response.json()
        await fetchGraphs(selectedProject)
        setSelectedGraph(newGraph.id)
        setShowNewGraphModal(false)
        setNewGraphName('')
      } else {
        alert('创建图谱失败')
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
      // For Excel, use API endpoint
      const type = graphType === '3D' ? '3d' : '2d'
      const link = document.createElement('a')
      link.href = `/api/templates?type=${type}&format=excel`
      link.download = `${type}-graph-template.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For CSV and JSON, use static files
      const fileName = graphType === '3D' 
        ? `3d-graph-template.${templateType}`
        : `2d-graph-template.${templateType}`
      
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
    await handleUpload()
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedProject || !selectedGraph || !fileType) {
      setUploadStatus('请选择项目、图谱和文件')
      return
    }
    setUploading(true)
    setUploadStatus('正在上传...')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('projectId', selectedProject)
      formData.append('graphId', selectedGraph)
      formData.append('fileType', fileType)
      formData.append('graphType', graphType)
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        setUploadStatus('导入成功！')
        setTimeout(() => router.push('/graph'), 1500)
      } else {
        const error = await response.json()
        setUploadStatus(`导入失败: ${error.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadStatus('导入失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#e8eef3',
      padding: '0'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: '#1a3a52',
        padding: '18px 40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'white',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            📦
          </div>
          项目选设计
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 顶部选择区域 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          {/* 项目选择 */}
          <div style={{
            flex: 1,
            background: 'white',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                background: '#1a3a52',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a4a62'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a3a52'
              }}
            >
              + 新建
            </button>
          </div>

          {/* 图谱类型切换 */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '12px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>图谱类型</span>
            <div style={{
              display: 'flex',
              background: '#f5f5f5',
              borderRadius: '20px',
              padding: '3px'
            }}>
              <button
                onClick={() => setGraphType('2D')}
                style={{
                  padding: '6px 20px',
                  background: graphType === '2D' ? '#1a3a52' : 'transparent',
                  color: graphType === '2D' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ▼ 2D
              </button>
              <button
                onClick={() => setGraphType('3D')}
                style={{
                  padding: '6px 20px',
                  background: graphType === '3D' ? '#1a3a52' : 'transparent',
                  color: graphType === '3D' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                3D
              </button>
            </div>
          </div>
        </div>

        {/* 主内容区 - 两列布局 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* 左侧 - 导入数据 */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
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
                      ? '2px solid #1a3a52'
                      : '1px solid #ddd',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}>📄</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
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
                color: '#333',
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
                    background: !selectedProject ? '#ccc' : '#1a3a52',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: !selectedProject ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = '#2a4a62'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = '#1a3a52'
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
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px'
            }}>
              模板下载
            </h2>
            <div style={{ 
              padding: '12px',
              background: '#f0f8ff',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '12px',
              color: '#1a3a52',
              border: '1px solid #d0e8ff'
            }}>
              当前选择: {graphType} 图谱模板
            </div>
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
                <span>Excel模板 ({graphType})</span>
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
                  e.currentTarget.style.borderColor = '#1a3a52'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#ddd'
                }}
              >
                <span style={{ fontSize: '16px' }}>📄</span>
                <span>CSV模板 ({graphType})</span>
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
                  e.currentTarget.style.borderColor = '#1a3a52'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#ddd'
                }}
              >
                <span style={{ fontSize: '16px' }}>📋</span>
                <span>JSON模板 ({graphType})</span>
              </button>
            </div>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: '#fff9e6',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#856404',
              border: '1px solid #ffeaa7'
            }}>
              💡 提示: 切换图谱类型会自动更新模板
            </div>
          </div>
        </div>

        {/* 底部生成按钮 */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <button
            onClick={handleGenerateClick}
            disabled={!selectedFile || !selectedProject || !selectedGraph || uploading}
            style={{
              padding: '14px 60px',
              background: (!selectedFile || !selectedProject || !selectedGraph || uploading)
                ? '#ccc'
                : '#1a3a52',
              border: 'none',
              borderRadius: '24px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (!selectedFile || !selectedProject || !selectedGraph || uploading) ? 'not-allowed' : 'pointer'
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

        {/* 返回按钮 */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            onClick={() => router.push('/create')}
            style={{
              padding: '8px 20px',
              background: 'rgba(26, 58, 82, 0.1)',
              border: '1px solid rgba(26, 58, 82, 0.3)',
              borderRadius: '16px',
              color: '#1a3a52',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ← 返回
          </button>
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
                  background: creating || !newProjectName.trim() ? '#ccc' : '#1a3a52',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: creating || !newProjectName.trim() ? 'not-allowed' : 'pointer'
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
              color: '#1a3a52'
            }}>
              图谱类型: {graphType}
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
                  background: creating || !newGraphName.trim() ? '#ccc' : '#1a3a52',
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
                  <span style={{ color: '#666' }}>类型:</span>
                  <span style={{ fontWeight: '600', color: '#1a3a52' }}>{graphType}</span>
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
                  background: '#1a3a52',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
