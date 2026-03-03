'use client'

import { useState, useEffect, useRef } from 'react'
import AIPreviewModal, { PreviewData } from '@/components/AIPreviewModal'
import { MergeDecision } from '@/lib/services/merge-resolution'

interface Project {
  id: string
  name: string
}

interface Graph {
  id: string
  name: string
  projectId: string
}

export default function TextPage() {
  const [inputText, setInputText] = useState('')
  const [outputFormat, setOutputFormat] = useState<'2d' | '3d'>('2d')
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: number
    type: string
    content: string
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // 项目和图谱相关状态
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedGraph, setSelectedGraph] = useState<string>('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewGraphModal, setShowNewGraphModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newGraphName, setNewGraphName] = useState('')
  
  // 项目和图谱数据（从API获取）
  const [projects, setProjects] = useState<Project[]>([])
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false)
  
  // AI分析相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAIPreview, setShowAIPreview] = useState(false)
  const [aiGeneratedData, setAiGeneratedData] = useState<PreviewData | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [lastAnalysisParams, setLastAnalysisParams] = useState<{
    documentText: string
    projectId: string
    graphId?: string
    visualizationType: '2d' | '3d'
  } | null>(null)
  const [showAILoadingModal, setShowAILoadingModal] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 自定义提示词状态
  const [customPrompt, setCustomPrompt] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)

  // 修复页面滚动问题
  useEffect(() => {
    // 保存原始样式
    const originalOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    
    // 允许滚动
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    
    // 清理函数：恢复原始样式
    return () => {
      document.body.style.overflow = originalOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true)
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        } else {
          console.error('Failed to fetch projects')
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  // 获取选中项目的图谱列表
  useEffect(() => {
    if (!selectedProject) {
      setGraphs([])
      return
    }

    const fetchGraphs = async () => {
      setIsLoadingGraphs(true)
      try {
        const response = await fetch(`/api/projects/${selectedProject}/graphs`)
        if (response.ok) {
          const data = await response.json()
          setGraphs(data.graphs || [])
        } else {
          console.error('Failed to fetch graphs')
        }
      } catch (error) {
        console.error('Error fetching graphs:', error)
      } finally {
        setIsLoadingGraphs(false)
      }
    }

    fetchGraphs()
  }, [selectedProject])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File upload started:', {
        name: file.name,
        size: file.size,
        type: file.type,
      })
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        console.log('File content loaded:', {
          contentLength: content?.length,
          contentPreview: content?.substring(0, 100),
          contentType: typeof content,
        })
        
        // 验证内容不为空
        if (!content || content.trim().length === 0) {
          console.error('File content is empty after reading')
          alert('文件内容为空或无法读取，请检查文件格式')
          return
        }
        
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type || getFileType(file.name),
          content: content
        })
        
        console.log('File state updated successfully')
      }
      reader.onerror = (error) => {
        console.error('File read error:', error)
        alert('文件读取失败，请重试')
      }
      
      // 尝试使用UTF-8编码读取
      try {
        reader.readAsText(file, 'UTF-8')
      } catch (error) {
        console.error('Failed to read file:', error)
        alert('文件读取失败，请检查文件格式')
      }
    }
  }

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const typeMap: { [key: string]: string } = {
      'txt': '文本文件',
      'md': 'Markdown',
      'json': 'JSON',
      'csv': 'CSV',
      'xlsx': 'Excel',
      'xls': 'Excel'
    }
    return typeMap[ext || ''] || '未知类型'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setShowPreview(false)
  }

  // AI分析处理函数
  const handleAIAnalysis = async () => {
    // 验证项目选择
    if (!selectedProject) {
      setAnalysisError('请先选择一个项目')
      setIsNetworkError(false)
      return
    }

    // 获取文档文本 - 优先使用文件内容,如果没有文件则使用输入框文本
    const documentText = uploadedFile ? uploadedFile.content : inputText
    
    // 调试日志
    console.log('AI Analysis Debug:', {
      hasUploadedFile: !!uploadedFile,
      uploadedFileName: uploadedFile?.name,
      uploadedFileSize: uploadedFile?.size,
      uploadedFileContentLength: uploadedFile?.content?.length,
      contentLength: documentText?.length,
      contentPreview: documentText?.substring(0, 100),
      hasInputText: !!inputText,
      inputTextLength: inputText?.length,
      documentTextType: typeof documentText,
      documentTextTrimmed: documentText?.trim().length,
    })
    
    if (!documentText) {
      console.error('Document text is null or undefined')
      setAnalysisError('请输入文本或上传文件')
      setIsNetworkError(false)
      return
    }
    
    if (documentText.trim().length === 0) {
      console.error('Document text is empty after trimming')
      setAnalysisError('文档内容为空，请输入有效的文本或上传包含内容的文件')
      setIsNetworkError(false)
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setIsNetworkError(false)
    setShowAILoadingModal(true) // 显示加载模态框

    const params = {
      documentText,
      projectId: selectedProject,
      graphId: selectedGraph || undefined,
      visualizationType: outputFormat,
      customPrompt: customPrompt.trim() || undefined, // 添加自定义提示词
    }

    // 保存参数以便重试
    setLastAnalysisParams(params)

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 调用AI分析API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: abortController.signal, // 添加取消信号
      })

      const result = await response.json()

      if (result.success) {
        // 设置AI生成的数据并显示预览模态框
        setAiGeneratedData(result.data)
        setShowAIPreview(true)
        setLastAnalysisParams(null) // 清除保存的参数
      } else {
        // 显示错误消息
        setAnalysisError(result.error || 'AI分析失败，请重试')
        setIsNetworkError(false)
      }
    } catch (error: any) {
      // 检查是否是用户取消
      if (error.name === 'AbortError') {
        console.log('AI analysis cancelled by user')
        setAnalysisError(null)
        setIsNetworkError(false)
      } else {
        console.error('AI analysis error:', error)
        setAnalysisError('网络错误，请检查连接后重试')
        setIsNetworkError(true)
      }
    } finally {
      setIsAnalyzing(false)
      setShowAILoadingModal(false) // 隐藏加载模态框
      abortControllerRef.current = null
    }
  }

  // 取消AI分析
  const handleCancelAIAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setShowAILoadingModal(false)
      setIsAnalyzing(false)
      abortControllerRef.current = null
    }
  }

  // 重试AI分析
  const handleRetryAnalysis = async () => {
    if (!lastAnalysisParams) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setIsNetworkError(false)
    setShowAILoadingModal(true) // 显示加载模态框

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastAnalysisParams),
        signal: abortController.signal, // 添加取消信号
      })

      const result = await response.json()

      if (result.success) {
        setAiGeneratedData(result.data)
        setShowAIPreview(true)
        setLastAnalysisParams(null)
      } else {
        setAnalysisError(result.error || 'AI分析失败，请重试')
        setIsNetworkError(false)
      }
    } catch (error: any) {
      // 检查是否是用户取消
      if (error.name === 'AbortError') {
        console.log('AI analysis retry cancelled by user')
        setAnalysisError(null)
        setIsNetworkError(false)
      } else {
        console.error('AI analysis retry error:', error)
        setAnalysisError('网络错误，请检查连接后重试')
        setIsNetworkError(true)
      }
    } finally {
      setIsAnalyzing(false)
      setShowAILoadingModal(false) // 隐藏加载模态框
      abortControllerRef.current = null
    }
  }

  // AI预览保存处理函数
  const handleAISave = async (editedData: PreviewData, mergeDecisions: MergeDecision[]) => {
    try {
      // 调用保存API
      const response = await fetch('/api/ai/save-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: editedData.nodes,
          edges: editedData.edges,
          mergeDecisions,
          projectId: selectedProject,
          graphId: selectedGraph || undefined,
          graphName: selectedGraph ? undefined : `AI图谱 ${new Date().toLocaleString('zh-CN')}`,
          visualizationType: outputFormat,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Graph saved successfully:', result.data)
        
        // 关闭模态框
        setShowAIPreview(false)
        setAiGeneratedData(null)
        
        // 刷新图谱列表
        if (selectedProject) {
          const graphsResponse = await fetch(`/api/projects/${selectedProject}/graphs`)
          if (graphsResponse.ok) {
            const graphsData = await graphsResponse.json()
            setGraphs(graphsData.graphs || [])
          }
        }
        
        // 显示成功消息（可选）
        alert(`图谱保存成功！\n创建节点: ${result.data.nodesCreated}\n更新节点: ${result.data.nodesUpdated}\n创建边: ${result.data.edgesCreated}`)
      } else {
        // 显示错误消息
        alert(`保存失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('保存失败，请重试')
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.project) {
        // 关闭模态框
        setShowNewProjectModal(false)
        setNewProjectName('')
        
        // 刷新项目列表
        const projectsResponse = await fetch('/api/projects')
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setProjects(projectsData.projects || [])
          
          // 自动选中新创建的项目
          setSelectedProject(result.project.id)
        }
      } else {
        alert(`创建项目失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Create project error:', error)
      alert('创建项目失败，请重试')
    }
  }

  const handleCreateGraph = async () => {
    if (!newGraphName.trim() || !selectedProject) return

    try {
      const response = await fetch(`/api/projects/${selectedProject}/graphs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGraphName.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.graph) {
        // 关闭模态框
        setShowNewGraphModal(false)
        setNewGraphName('')
        
        // 刷新图谱列表
        const graphsResponse = await fetch(`/api/projects/${selectedProject}/graphs`)
        if (graphsResponse.ok) {
          const graphsData = await graphsResponse.json()
          setGraphs(graphsData.graphs || [])
          
          // 自动选中新创建的图谱
          setSelectedGraph(result.graph.id)
        }
      } else {
        alert(`创建图谱失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Create graph error:', error)
      alert('创建图谱失败，请重试')
    }
  }

  const filteredGraphs = graphs.filter(g => g.projectId === selectedProject)

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 30%, #80DEEA 70%, #4DD0E1 100%)',
      padding: '0'
    }}>
      {/* 顶部导航栏 - 夏威夷海滩风格 */}
      <nav style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 188, 212, 0.1)',
        boxShadow: '0 2px 20px rgba(0, 188, 212, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '22px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
          }}>
            🌊
          </div>
          知识图谱生成器
        </div>
      </nav>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 30px 100px 30px'
      }}>
        {/* 标题 - 夏威夷风格 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #00BCD4 0%, #FF6F61 50%, #FFD54F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-1px',
            textShadow: '0 2px 20px rgba(0, 188, 212, 0.1)'
          }}>
            AI知识图谱生成器
          </h1>
          <p style={{
            color: '#00838F',
            fontSize: '18px',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8',
            fontWeight: '500'
          }}>
            🏝️ 导入数据或输入文本，AI 将自动提取实体关系，生成可视化知识图谱
          </p>
        </div>

        {/* 主内容区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}>
          {/* 项目和图谱选择区域 - 夏威夷风格 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid rgba(0, 188, 212, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 188, 212, 0.12)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📁</span> 项目与图谱
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}>
              {/* 项目选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: '#00838F',
                  fontSize: '15px',
                  fontWeight: '700',
                  marginBottom: '12px',
                }}>
                  选择项目
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                }}>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value)
                      setSelectedGraph('')
                    }}
                    disabled={isLoadingProjects}
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      background: 'white',
                      border: '2px solid #B2EBF2',
                      borderRadius: '12px',
                      color: '#00838F',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: isLoadingProjects ? 'wait' : 'pointer',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}>
                    <option value="">
                      {isLoadingProjects ? '加载中...' : '请选择项目'}
                    </option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    style={{
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.3)'
                    }}>
                    + 新建
                  </button>
                </div>
              </div>

              {/* 图谱选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: '#00838F',
                  fontSize: '15px',
                  fontWeight: '700',
                  marginBottom: '12px',
                }}>
                  选择图谱
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                }}>
                  <select
                    value={selectedGraph}
                    onChange={(e) => setSelectedGraph(e.target.value)}
                    disabled={!selectedProject || isLoadingGraphs}
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      background: (selectedProject && !isLoadingGraphs) ? 'white' : '#F0F9FA',
                      border: '2px solid #B2EBF2',
                      borderRadius: '12px',
                      color: (selectedProject && !isLoadingGraphs) ? '#00838F' : '#80DEEA',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: (selectedProject && !isLoadingGraphs) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}>
                    <option value="">
                      {isLoadingGraphs ? '加载中...' : '请选择图谱'}
                    </option>
                    {filteredGraphs.map(graph => (
                      <option key={graph.id} value={graph.id}>
                        {graph.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewGraphModal(true)}
                    disabled={!selectedProject}
                    style={{
                      padding: '14px 24px',
                      background: selectedProject ? 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)' : '#E0E0E0',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: selectedProject ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      opacity: selectedProject ? 1 : 0.5,
                      boxShadow: selectedProject ? '0 4px 12px rgba(0, 188, 212, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.3)'
                      }
                    }}>
                    + 新建
                  </button>
                </div>
              </div>
            </div>

            {/* 提示信息 - 夏威夷风格 */}
            {!selectedProject && (
              <div style={{
                marginTop: '20px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(255, 213, 79, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)',
                border: '2px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '16px',
                color: '#F57C00',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ fontSize: '20px' }}>🌺</span>
                <span>请先选择或创建一个项目</span>
              </div>
            )}
          </div>

          {/* 输入区域 - 夏威夷风格 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid rgba(0, 188, 212, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 188, 212, 0.12)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📝</span> 数据输入
            </h2>

            {/* 文件上传按钮 - 夏威夷风格 */}
            <div style={{
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                background: 'white',
                border: '3px dashed #4DD0E1',
                borderRadius: '16px',
                color: '#00ACC1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '15px',
                fontWeight: '700',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(77, 208, 225, 0.08)'
                e.currentTarget.style.borderColor = '#00BCD4'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#4DD0E1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <span style={{ fontSize: '24px' }}>🏖️</span>
                导入文本文件
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.text"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <div style={{
                marginTop: '10px',
                color: '#00838F',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                支持格式：TXT, MD, Markdown
              </div>
            </div>

            {/* 已导入文件信息卡片 */}
            {uploadedFile && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(0, 191, 165, 0.08)',
                border: '1px solid rgba(0, 191, 165, 0.2)',
                borderRadius: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#00bfa5',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(0, 191, 165, 0.2)',
                      }}>✓</span>
                      文件已导入
                    </div>
                    <div style={{
                      color: '#2c2c2c',
                      fontSize: '14px',
                      marginBottom: '6px',
                      fontWeight: '500',
                    }}>
                      📄 {uploadedFile.name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '13px',
                      display: 'flex',
                      gap: '12px',
                    }}>
                      <span>类型: {uploadedFile.type}</span>
                      <span>•</span>
                      <span>大小: {formatFileSize(uploadedFile.size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    }}>
                    🗑️ 移除
                  </button>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'white',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    color: '#00bfa5',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 191, 165, 0.05)'
                    e.currentTarget.style.borderColor = '#00bfa5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#e5e5e5'
                  }}>
                  {showPreview ? '🔼 收起预览' : '🔽 展开预览'}
                </button>

                {/* 文件预览 */}
                {showPreview && (
                  <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: '#f5f5f5',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}>
                    <pre style={{
                      color: '#2c2c2c',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      margin: 0,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {uploadedFile.content.slice(0, 2000)}
                      {uploadedFile.content.length > 2000 && '\n\n... (内容过长，仅显示前2000字符)'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* AI智能分析说明 */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(0, 191, 165, 0.08)',
              border: '1px solid rgba(0, 191, 165, 0.2)',
              borderRadius: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '20px' }}>🤖</span>
                <div style={{
                  fontSize: '15px',
                  color: '#00bfa5',
                  fontWeight: '600',
                }}>
                  AI 智能分析
                </div>
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#666', 
                lineHeight: '1.6',
                paddingLeft: '30px',
              }}>
                支持 TXT、MD 格式 · 自动提取实体和关系 · 生成可视化图谱
              </div>
            </div>

            {/* 文本输入框 */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!!uploadedFile}
              placeholder={
                uploadedFile 
                  ? "已导入文件，如需输入文本请先移除文件" 
                  : "输入文本内容，AI 将自动提取实体和关系..."
              }
              style={{
                width: '100%',
                minHeight: '250px',
                maxHeight: '500px',
                padding: '16px',
                background: uploadedFile ? '#f5f5f5' : 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                color: uploadedFile ? '#999' : '#2c2c2c',
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                fontFamily: 'inherit',
                cursor: uploadedFile ? 'not-allowed' : 'text',
                transition: 'all 0.2s ease',
              }}
            />

            <div style={{
              marginTop: '8px',
              color: '#666',
              fontSize: '12px',
            }}>
              {uploadedFile && inputText.trim()
                ? `文件大小: ${formatFileSize(uploadedFile.size)} | 字符数: ${inputText.length}`
                : uploadedFile 
                ? `文件大小: ${formatFileSize(uploadedFile.size)}`
                : `字符数: ${inputText.length}`}
            </div>
          </div>

          {/* 配置区域 */}
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
              marginBottom: '24px'
            }}>
              输出配置
            </h2>

            {/* 输出格式选择 */}
            <div style={{
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'block',
                color: '#2c2c2c',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                选择图谱类型
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                {/* 2D选项 */}
                <div
                  onClick={() => setOutputFormat('2d')}
                  style={{
                    padding: '20px',
                    background: outputFormat === '2d' ? 'rgba(0, 191, 165, 0.08)' : 'white',
                    border: outputFormat === '2d' ? '2px solid #00bfa5' : '2px solid #e5e5e5',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (outputFormat !== '2d') {
                      e.currentTarget.style.borderColor = '#00bfa5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outputFormat !== '2d') {
                      e.currentTarget.style.borderColor = '#e5e5e5'
                    }
                  }}>
                  <div style={{
                    fontSize: '36px',
                    marginBottom: '8px',
                  }}>
                    📊
                  </div>
                  <div style={{
                    color: '#2c2c2c',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    二维图谱
                  </div>
                  <div style={{
                    color: '#666',
                    fontSize: '12px',
                  }}>
                    平面网络视图
                  </div>
                </div>

                {/* 3D选项 */}
                <div
                  onClick={() => setOutputFormat('3d')}
                  style={{
                    padding: '20px',
                    background: outputFormat === '3d' ? 'rgba(0, 191, 165, 0.08)' : 'white',
                    border: outputFormat === '3d' ? '2px solid #00bfa5' : '2px solid #e5e5e5',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (outputFormat !== '3d') {
                      e.currentTarget.style.borderColor = '#00bfa5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outputFormat !== '3d') {
                      e.currentTarget.style.borderColor = '#e5e5e5'
                    }
                  }}>
                  <div style={{
                    fontSize: '36px',
                    marginBottom: '8px',
                  }}>
                    🌐
                  </div>
                  <div style={{
                    color: '#2c2c2c',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    三维图谱
                  </div>
                  <div style={{
                    color: '#666',
                    fontSize: '12px',
                  }}>
                    立体空间视图
                  </div>
                </div>
              </div>
            </div>

            {/* 自定义提示词模块 */}
            <div style={{
              marginBottom: '28px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <label style={{
                  color: '#2c2c2c',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>自定义提示词</span>
                  <span style={{
                    fontSize: '11px',
                    color: '#666',
                    fontWeight: '400',
                    padding: '2px 8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  }}>
                    选填
                  </span>
                </label>
                <button
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(0, 191, 165, 0.1)',
                    border: '1px solid rgba(0, 191, 165, 0.3)',
                    borderRadius: '8px',
                    color: '#00bfa5',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 191, 165, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 191, 165, 0.1)'
                  }}>
                  {showCustomPrompt ? '收起 ▲' : '展开 ▼'}
                </button>
              </div>

              {showCustomPrompt && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(0, 191, 165, 0.05)',
                  border: '1px solid rgba(0, 191, 165, 0.2)',
                  borderRadius: '12px',
                  animation: 'slideDown 0.3s ease',
                }}>
                  <style jsx>{`
                    @keyframes slideDown {
                      from {
                        opacity: 0;
                        transform: translateY(-10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                  
                  <div style={{
                    color: '#666',
                    fontSize: '13px',
                    marginBottom: '12px',
                    lineHeight: '1.6',
                  }}>
                    💡 在默认提示词基础上添加您的特殊要求，例如：
                    <ul style={{
                      margin: '8px 0 0 0',
                      paddingLeft: '20px',
                    }}>
                      <li>重点关注某类实体（如"重点提取人物和组织"）</li>
                      <li>特定领域要求（如"按照医学术语标准提取"）</li>
                      <li>关系类型偏好（如"优先识别因果关系"）</li>
                    </ul>
                  </div>

                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="例如：请重点提取人物、组织和地点实体，并识别它们之间的从属关系和合作关系..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '14px',
                      background: 'white',
                      border: '1px solid #e5e5e5',
                      borderRadius: '10px',
                      color: '#2c2c2c',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00bfa5'
                      e.currentTarget.style.background = 'white'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e5e5'
                      e.currentTarget.style.background = 'white'
                    }}
                  />

                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      color: '#666',
                      fontSize: '12px',
                    }}>
                      字符数: {customPrompt.length}
                    </div>
                    {customPrompt.trim() && (
                      <button
                        onClick={() => setCustomPrompt('')}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}>
                        清空
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI分析生成按钮 */}
            <div style={{
              marginBottom: '16px',
            }}>
              <button
                onClick={handleAIAnalysis}
                disabled={!selectedProject || (!uploadedFile && !inputText.trim()) || isAnalyzing}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing)
                    ? '#00bfa5'
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing)
                    ? '0 4px 12px rgba(0, 191, 165, 0.3)'
                    : 'none',
                  opacity: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) ? 1 : 0.6,
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  if (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 191, 165, 0.4)'
                    e.currentTarget.style.background = '#00d4b8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 191, 165, 0.3)'
                    e.currentTarget.style.background = '#00bfa5'
                  }
                }}>
                <span style={{ fontSize: '22px', marginRight: '10px' }}>
                  {isAnalyzing ? '⏳' : '🤖'}
                </span>
                {isAnalyzing ? 'AI分析中...' : 'AI分析生成知识图谱'}
              </button>
              
              {/* 提示信息 */}
              {!selectedProject ? (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '10px',
                  color: '#d97706',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>💡</span>
                  <span>请先选择一个项目，然后点击按钮进行AI分析</span>
                </div>
              ) : !uploadedFile && !inputText.trim() ? (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '10px',
                  color: '#d97706',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>💡</span>
                  <span>请上传文件或在文本框中输入内容</span>
                </div>
              ) : null}
            </div>

            {/* 错误消息显示 */}
            {analysisError && (
              <div style={{
                marginBottom: '16px',
                padding: '14px 18px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '14px',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: isNetworkError ? '12px' : '0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span>
                    <span>{analysisError}</span>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysisError(null)
                      setIsNetworkError(false)
                      setLastAnalysisParams(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}>
                    ✕
                  </button>
                </div>
                {isNetworkError && lastAnalysisParams && (
                  <button
                    onClick={handleRetryAnalysis}
                    disabled={isAnalyzing}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: isAnalyzing 
                        ? '#f5f5f5' 
                        : 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      color: '#dc2626',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isAnalyzing) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isAnalyzing) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                      }
                    }}>
                    {isAnalyzing ? '重试中...' : '🔄 重试'}
                  </button>
                )}
              </div>
            )}

            {/* 提示信息 */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(0, 191, 165, 0.05)',
              border: '1px solid rgba(0, 191, 165, 0.2)',
              borderRadius: '14px',
            }}>
              <div style={{
                color: '#666',
                fontSize: '14px',
                lineHeight: '1.7',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  fontWeight: '700',
                  color: '#00bfa5',
                }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  AI智能分析说明
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '24px',
                  color: '#666',
                }}>
                  <li style={{ marginBottom: '6px' }}>支持格式：TXT、Markdown (.md) 文本文件</li>
                  <li style={{ marginBottom: '6px' }}>AI自动识别文本中的实体（人物、地点、概念等）</li>
                  <li style={{ marginBottom: '6px' }}>智能提取实体之间的关系和联系</li>
                  <li style={{ marginBottom: '6px' }}>生成可视化知识图谱，支持2D和3D展示</li>
                  <li>生成的图谱支持交互编辑、合并冲突和导出</li>
                </ul>
              </div>
            </div>
          </div>
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
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowNewProjectModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #ebebeb',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: '#2c2c2c',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              创建新项目
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="输入项目名称"
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                color: '#2c2c2c',
                fontSize: '15px',
                marginBottom: '24px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateProject()
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectName('')
                }}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                }}>
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                style={{
                  padding: '12px 24px',
                  background: newProjectName.trim()
                    ? '#00bfa5'
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: newProjectName.trim() ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.background = '#00d4b8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.background = '#00bfa5'
                  }
                }}>
                创建
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
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowNewGraphModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #ebebeb',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: '#2c2c2c',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              创建新图谱
            </h3>
            <input
              type="text"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
              placeholder="输入图谱名称"
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                color: '#2c2c2c',
                fontSize: '15px',
                marginBottom: '24px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateGraph()
              }}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setShowNewGraphModal(false)
                  setNewGraphName('')
                }}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                }}>
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={!newGraphName.trim()}
                style={{
                  padding: '12px 24px',
                  background: newGraphName.trim()
                    ? '#00bfa5'
                    : '#e0e0e0',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newGraphName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: newGraphName.trim() ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (newGraphName.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newGraphName.trim()) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI生成加载模态框 */}
      {showAILoadingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '480px',
            width: '90%',
            border: '1px solid #ebebeb',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
          }}>
            {/* 加载动画 */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 32px',
              position: 'relative',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                border: '4px solid rgba(0, 191, 165, 0.2)',
                borderTop: '4px solid #00bfa5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '32px',
              }}>
                🤖
              </div>
            </div>

            {/* 标题 */}
            <h3 style={{
              color: '#2c2c2c',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              letterSpacing: '0.5px',
            }}>
              AI正在生成中
            </h3>

            {/* 描述 */}
            <p style={{
              color: '#666',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              AI正在分析您的文档并生成知识图谱
              <br />
              这可能需要几秒钟时间，请稍候...
            </p>

            {/* 取消按钮 */}
            <button
              onClick={handleCancelAIAnalysis}
              style={{
                padding: '14px 32px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}>
              取消生成
            </button>
          </div>
        </div>
      )}

      {/* AI预览模态框 */}
      {showAIPreview && aiGeneratedData && (
        <AIPreviewModal
          isOpen={showAIPreview}
          onClose={() => {
            setShowAIPreview(false)
            setAiGeneratedData(null)
          }}
          data={aiGeneratedData}
          onSave={handleAISave}
          visualizationType={outputFormat}
        />
      )}
    </main>
  )
}
