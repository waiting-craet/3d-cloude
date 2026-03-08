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

interface ImportStats {
  duplicateNodesCount: number
  duplicateEdgesCount: number
  importedNodesCount: number
  importedEdgesCount: number
  totalNodesInFile: number
  totalEdgesInFile: number
}

// Morandi Green Color Palette - Matching Creation Page
const MorandiColors = {
  // Primary Colors
  skyBlue: '#7FDBDA',           // 天青色 - primary accent
  darkGreen: '#426666',         // 黛绿色 - secondary accent
  
  // Background Greens
  sageGreen: '#7fa99b',         // Morandi green - main backgrounds and buttons
  mintGreen: '#9bbaae',         // Lighter Morandi green - secondary backgrounds
  paleGreen: '#c8d5cf',         // Very light green - subtle backgrounds
  
  // Neutral Tones
  warmGray: '#e8e6e3',          // Warm gray - borders and dividers
  softWhite: '#f5f4f2',         // Off-white - card backgrounds
  charcoal: '#4a4a48',          // Dark gray - text
  
  // State Colors (muted to complement palette)
  successGreen: '#7fa87f',      // Muted green - success states
  warningAmber: '#d4b896',      // Muted amber - warnings
  errorRose: '#c89b9b',         // Muted rose - errors
  
  // Hover States (slightly lighter/darker variants)
  skyBlueHover: '#9dd9f3',      // Lighter sky blue
  darkGreenHover: '#3d6363',    // Lighter dark green
  sageGreenHover: '#8fb5a7',    // Lighter sage green
}

// Ink Wash Visual Effects - Matching Creation Page
const InkWashEffects = {
  // Gradient backgrounds (subtle, vertical)
  pageGradient: 'linear-gradient(135deg, #e8f0ed 0%, #d4e4df 100%)',
  cardGradient: 'linear-gradient(180deg, #f5f4f2 0%, #e8e6e3 100%)',
  navGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(245, 244, 242, 0.85) 100%)',
  modalGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f4f2 100%)',
  
  // Soft shadows (multiple layers for depth)
  softShadow: '0 2px 8px rgba(90, 122, 110, 0.08), 0 1px 3px rgba(90, 122, 110, 0.06)',
  cardShadow: '0 4px 12px rgba(90, 122, 110, 0.12), 0 2px 4px rgba(90, 122, 110, 0.06)',
  modalShadow: '0 8px 24px rgba(90, 122, 110, 0.15), 0 4px 8px rgba(90, 122, 110, 0.1)',
  
  // Border radius (soft, rounded)
  smallRadius: '8px',
  mediumRadius: '12px',
  largeRadius: '14px',
  pillRadius: '24px',
  
  // Transparency for overlays
  modalOverlay: 'rgba(66, 102, 102, 0.6)',      // 黛绿色半透明
  loadingOverlay: 'rgba(66, 102, 102, 0.7)',    // 黛绿色半透明(更深)
  
  // Blur effects
  backdropBlur: 'blur(10px)',
}

// Icon Paths
const IconPaths = {
  excel: '/icons/excel.png',
  csv: '/icons/csv.png',
  json: '/icons/filetype-json.png',
  download: '/icons/下载.png',
}

// File Type Icon Component
const FileTypeIcon = ({ type }: { type: 'excel' | 'csv' | 'json' }) => {
  return (
    <div style={{
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'opacity(0.8)',
      transition: 'all 0.2s'
    }}>
      <img 
        src={IconPaths[type]} 
        alt={`${type} icon`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}

// Download Icon Component
const DownloadIcon = () => {
  return (
    <div style={{
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'opacity(0.8)',
      transition: 'all 0.2s'
    }}>
      <img 
        src={IconPaths.download} 
        alt="download icon"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  )
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
  const [importStats, setImportStats] = useState<ImportStats | null>(null)

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
    setImportStats(null) // 重置统计信息
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
        // 更新统计信息
        setImportStats({
          duplicateNodesCount: result.duplicateNodesCount || 0,
          duplicateEdgesCount: result.duplicateEdgesCount || 0,
          importedNodesCount: result.nodesCount || 0,
          importedEdgesCount: result.edgesCount || 0,
          totalNodesInFile: result.totalNodesInFile || 0,
          totalEdgesInFile: result.totalEdgesInFile || 0
        })
        
        let successMessage = '导入成功！'
        if (result.warnings && result.warnings.length > 0) {
          successMessage += `\n注意事项：${result.warnings.join('；')}`
        }
        if (result.skippedEdges > 0) {
          successMessage += `\n跳过了 ${result.skippedEdges} 条无效边`
        }
        setUploadStatus(successMessage)
        setShowLoadingModal(false)
        router.push(`/graph?projectId=${selectedProject}&graphId=${selectedGraph}`)
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
        
        // 显示错误消息并保持模态框打开一段时间，让用户看到错误
        setUploadStatus(errorMessage)
        
        // 延迟关闭模态框，让用户有时间看到错误信息
        setTimeout(() => {
          setShowLoadingModal(false)
        }, 3000)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Upload cancelled by user')
        setUploadStatus('已取消生成')
      } else {
        console.error('Upload failed:', error)
        setUploadStatus('导入失败，请重试')
      }
      
      // 延迟关闭模态框，让用户有时间看到错误信息
      setTimeout(() => {
        setShowLoadingModal(false)
      }, 2000)
    } finally {
      setUploading(false)
      setAbortController(null)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: InkWashEffects.pageGradient,
      padding: '0'
    }}>
      {/* 顶部导航栏 */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: InkWashEffects.navGradient,
        backdropFilter: InkWashEffects.backdropBlur,
        borderBottom: `1px solid rgba(139, 166, 154, 0.2)`,
        boxShadow: InkWashEffects.softShadow
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: MorandiColors.sageGreen
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: `linear-gradient(135deg, ${MorandiColors.sageGreen} 0%, ${MorandiColors.darkGreen} 100%)`,
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
            background: InkWashEffects.cardGradient,
            borderRadius: InkWashEffects.smallRadius,
            padding: '16px 20px',
            border: `1px solid ${MorandiColors.warmGray}`,
            boxShadow: InkWashEffects.softShadow,
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
                border: `1px solid ${MorandiColors.warmGray}`,
                borderRadius: InkWashEffects.smallRadius,
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                background: MorandiColors.softWhite,
                color: MorandiColors.charcoal,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.sageGreen
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.warmGray
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
                background: MorandiColors.sageGreen,
                border: 'none',
                borderRadius: InkWashEffects.smallRadius,
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: InkWashEffects.softShadow
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = MorandiColors.sageGreenHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = MorandiColors.sageGreen
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
                      ? `2px solid ${MorandiColors.sageGreen}`
                      : `1px solid ${MorandiColors.warmGray}`,
                    borderRadius: InkWashEffects.mediumRadius,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: InkWashEffects.cardGradient,
                    transition: 'all 0.2s',
                    boxShadow: InkWashEffects.cardShadow,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = MorandiColors.sageGreenHover
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = selectedFile && fileType?.toUpperCase() === type.toUpperCase()
                      ? MorandiColors.sageGreen
                      : MorandiColors.warmGray
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <FileTypeIcon type={type.toLowerCase() as 'excel' | 'csv' | 'json'} />
                  <div style={{ fontSize: '15px', fontWeight: '600', color: MorandiColors.charcoal, marginTop: '12px', marginBottom: '4px' }}>
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
                {selectedFile.name} ({fileType?.toUpperCase()})
              </div>
            )}

            {/* 图谱选择 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: MorandiColors.charcoal,
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
                    border: `1px solid ${MorandiColors.warmGray}`,
                    borderRadius: InkWashEffects.smallRadius,
                    fontSize: '14px',
                    outline: 'none',
                    cursor: selectedProject ? 'pointer' : 'not-allowed',
                    opacity: selectedProject ? 1 : 0.5,
                    background: MorandiColors.softWhite,
                    color: MorandiColors.charcoal,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.borderColor = MorandiColors.sageGreen
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.borderColor = MorandiColors.warmGray
                    }
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
                    background: !selectedProject ? '#ccc' : MorandiColors.sageGreen,
                    border: 'none',
                    borderRadius: InkWashEffects.smallRadius,
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: !selectedProject ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: !selectedProject ? 'none' : InkWashEffects.softShadow
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = MorandiColors.sageGreenHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProject) {
                      e.currentTarget.style.background = MorandiColors.sageGreen
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
                  background: MorandiColors.sageGreen,
                  border: `1px solid ${MorandiColors.warmGray}`,
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontWeight: '500',
                  boxShadow: InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreenHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreen
                }}
              >
                <DownloadIcon />
                <span>Excel模板</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('csv')}
                style={{
                  padding: '12px 16px',
                  background: MorandiColors.sageGreen,
                  border: `1px solid ${MorandiColors.warmGray}`,
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontWeight: '500',
                  boxShadow: InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreenHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreen
                }}
              >
                <DownloadIcon />
                <span>CSV模板</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('json')}
                style={{
                  padding: '12px 16px',
                  background: MorandiColors.sageGreen,
                  border: `1px solid ${MorandiColors.warmGray}`,
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontWeight: '500',
                  boxShadow: InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreenHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreen
                }}
              >
                <DownloadIcon />
                <span>JSON模板</span>
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
                ? MorandiColors.warmGray
                : MorandiColors.sageGreen,
              border: 'none',
              borderRadius: InkWashEffects.mediumRadius,
              color: (!selectedFile || !selectedProject || !selectedGraph || uploading)
                ? MorandiColors.charcoal
                : 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (!selectedFile || !selectedProject || !selectedGraph || uploading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (!selectedFile || !selectedProject || !selectedGraph || uploading)
                ? 'none'
                : InkWashEffects.softShadow
            }}
            onMouseEnter={(e) => {
              if (selectedFile && selectedProject && selectedGraph && !uploading) {
                e.currentTarget.style.background = MorandiColors.sageGreenHover
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile && selectedProject && selectedGraph && !uploading) {
                e.currentTarget.style.background = MorandiColors.sageGreen
              }
            }}
          >
            {uploading ? '正在生成...' : '生成图谱'}
          </button>

          {uploadStatus && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: uploadStatus.includes('成功') 
                ? MorandiColors.successGreen 
                : uploadStatus.includes('警告') || uploadStatus.includes('注意')
                  ? MorandiColors.warningAmber
                  : MorandiColors.errorRose,
              color: uploadStatus.includes('成功') 
                ? MorandiColors.darkGreen 
                : MorandiColors.charcoal,
              borderRadius: InkWashEffects.smallRadius,
              fontSize: '13px',
              boxShadow: InkWashEffects.softShadow,
              lineHeight: '1.5',
              whiteSpace: 'pre-line'
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
          background: InkWashEffects.modalOverlay,
          backdropFilter: InkWashEffects.backdropBlur,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: InkWashEffects.modalGradient,
            borderRadius: InkWashEffects.largeRadius,
            padding: '30px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: InkWashEffects.modalShadow
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: MorandiColors.charcoal,
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
                border: `1px solid ${MorandiColors.warmGray}`,
                borderRadius: InkWashEffects.smallRadius,
                fontSize: '14px',
                outline: 'none',
                marginBottom: '20px',
                background: MorandiColors.softWhite,
                color: MorandiColors.charcoal,
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.sageGreen
                e.currentTarget.style.boxShadow = `0 0 0 2px ${MorandiColors.sageGreen}33`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.warmGray
                e.currentTarget.style.boxShadow = 'none'
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
                  background: MorandiColors.warmGray,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1,
                  color: MorandiColors.charcoal,
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.currentTarget.style.background = '#ddd9d6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating) {
                    e.currentTarget.style.background = MorandiColors.warmGray
                  }
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                style={{
                  padding: '10px 20px',
                  background: creating || !newProjectName.trim() ? MorandiColors.warmGray : MorandiColors.sageGreen,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  color: 'white',
                  fontSize: '14px',
                  cursor: creating || !newProjectName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: creating || !newProjectName.trim() ? 'none' : InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  if (!creating && newProjectName.trim()) {
                    e.currentTarget.style.background = MorandiColors.sageGreenHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating && newProjectName.trim()) {
                    e.currentTarget.style.background = MorandiColors.sageGreen
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
          background: InkWashEffects.modalOverlay,
          backdropFilter: InkWashEffects.backdropBlur,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: InkWashEffects.modalGradient,
            borderRadius: InkWashEffects.largeRadius,
            padding: '30px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: InkWashEffects.modalShadow
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: MorandiColors.charcoal,
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
                border: `1px solid ${MorandiColors.warmGray}`,
                borderRadius: InkWashEffects.smallRadius,
                fontSize: '14px',
                outline: 'none',
                marginBottom: '15px',
                background: MorandiColors.softWhite,
                color: MorandiColors.charcoal,
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.sageGreen
                e.currentTarget.style.boxShadow = `0 0 0 2px ${MorandiColors.sageGreen}33`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = MorandiColors.warmGray
                e.currentTarget.style.boxShadow = 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateGraph()
              }}
            />
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
                  background: MorandiColors.warmGray,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1,
                  color: MorandiColors.charcoal,
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.currentTarget.style.background = '#ddd9d6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating) {
                    e.currentTarget.style.background = MorandiColors.warmGray
                  }
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={creating || !newGraphName.trim()}
                style={{
                  padding: '10px 20px',
                  background: creating || !newGraphName.trim() ? MorandiColors.warmGray : MorandiColors.sageGreen,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  color: 'white',
                  fontSize: '14px',
                  cursor: creating || !newGraphName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: creating || !newGraphName.trim() ? 'none' : InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  if (!creating && newGraphName.trim()) {
                    e.currentTarget.style.background = MorandiColors.sageGreenHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating && newGraphName.trim()) {
                    e.currentTarget.style.background = MorandiColors.sageGreen
                  }
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
          background: InkWashEffects.modalOverlay,
          backdropFilter: InkWashEffects.backdropBlur,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: InkWashEffects.modalGradient,
            borderRadius: InkWashEffects.largeRadius,
            padding: '30px',
            width: '450px',
            maxWidth: '90%',
            boxShadow: InkWashEffects.modalShadow
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: MorandiColors.charcoal,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
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
              background: '#FFF8E1',
              borderRadius: InkWashEffects.smallRadius,
              marginBottom: '20px',
              fontSize: '13px',
              color: '#8B7355',
              border: `1px solid ${MorandiColors.warningAmber}`
            }}>
              数据将被导入到选定的图谱中，此操作不可撤销
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
                  background: MorandiColors.warmGray,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: MorandiColors.charcoal,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ddd9d6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MorandiColors.warmGray
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                style={{
                  padding: '10px 24px',
                  background: MorandiColors.sageGreen,
                  border: 'none',
                  borderRadius: InkWashEffects.smallRadius,
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: InkWashEffects.softShadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreenHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MorandiColors.sageGreen
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
          background: InkWashEffects.loadingOverlay,
          backdropFilter: InkWashEffects.backdropBlur,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: InkWashEffects.modalGradient,
            borderRadius: InkWashEffects.largeRadius,
            padding: '40px',
            width: '450px',
            maxWidth: '90%',
            boxShadow: InkWashEffects.modalShadow,
            textAlign: 'center'
          }}>
            {/* 加载动画 */}
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 24px',
              border: `4px solid ${MorandiColors.paleGreen}`,
              borderTop: `4px solid ${MorandiColors.sageGreen}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: MorandiColors.charcoal,
              marginBottom: '12px'
            }}>
              正在生成图谱...
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: uploadStatus.includes('失败') || uploadStatus.includes('错误') ? MorandiColors.errorRose : MorandiColors.charcoal,
              marginBottom: '24px',
              lineHeight: '1.6',
              fontWeight: uploadStatus.includes('失败') || uploadStatus.includes('错误') ? '600' : 'normal',
              whiteSpace: 'pre-line'
            }}>
              {uploadStatus || '正在处理您的数据，请稍候'}
            </p>
            
            {/* 统计信息显示区域 */}
            {importStats && (
              <div style={{
                background: InkWashEffects.cardGradient,
                borderRadius: InkWashEffects.mediumRadius,
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left',
                border: `1px solid ${MorandiColors.warmGray}`,
                boxShadow: InkWashEffects.cardShadow
              }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: MorandiColors.charcoal,
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  导入统计
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px'
                }}>
                  {/* 节点统计 */}
                  <div style={{
                    background: MorandiColors.softWhite,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.charcoal, marginBottom: '6px' }}>
                      文件节点数
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.charcoal }}>
                      {importStats.totalNodesInFile}
                    </div>
                  </div>
                  
                  <div style={{
                    background: MorandiColors.softWhite,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.charcoal, marginBottom: '6px' }}>
                      文件边数
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.charcoal }}>
                      {importStats.totalEdgesInFile}
                    </div>
                  </div>
                  
                  <div style={{
                    background: MorandiColors.paleGreen,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.warningAmber, marginBottom: '6px', fontWeight: '500' }}>
                      冗余节点
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.warningAmber }}>
                      {importStats.duplicateNodesCount}
                    </div>
                  </div>
                  
                  <div style={{
                    background: MorandiColors.paleGreen,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.warningAmber, marginBottom: '6px', fontWeight: '500' }}>
                      冗余边
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.warningAmber }}>
                      {importStats.duplicateEdgesCount}
                    </div>
                  </div>
                  
                  <div style={{
                    background: MorandiColors.paleGreen,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.successGreen, marginBottom: '6px', fontWeight: '500' }}>
                      导入节点
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.successGreen }}>
                      {importStats.importedNodesCount}
                    </div>
                  </div>
                  
                  <div style={{
                    background: MorandiColors.paleGreen,
                    padding: '12px',
                    borderRadius: InkWashEffects.smallRadius,
                    border: `1px solid ${MorandiColors.warmGray}`,
                    boxShadow: InkWashEffects.cardShadow
                  }}>
                    <div style={{ color: MorandiColors.successGreen, marginBottom: '6px', fontWeight: '500' }}>
                      导入边
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: MorandiColors.successGreen }}>
                      {importStats.importedEdgesCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleCancelUpload}
              style={{
                padding: '12px 32px',
                background: MorandiColors.warmGray,
                border: `2px solid ${MorandiColors.warmGray}`,
                borderRadius: InkWashEffects.smallRadius,
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                color: MorandiColors.charcoal,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ddd9d6'
                e.currentTarget.style.borderColor = '#ddd9d6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = MorandiColors.warmGray
                e.currentTarget.style.borderColor = MorandiColors.warmGray
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
