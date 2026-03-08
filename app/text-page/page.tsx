'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import AIPreviewModal, { PreviewData } from '@/components/AIPreviewModal'
import { MergeDecision } from '@/lib/services/merge-resolution'
import { inkWashTokens } from '@/lib/design-tokens'
import styles from './page.module.css'

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
  const [outputFormat, setOutputFormat] = useState<'2d' | '3d'>('3d')
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
  
  // 创建状态 - 防抖动
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isCreatingGraph, setIsCreatingGraph] = useState(false)
  
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
  const isMountedRef = useRef<boolean>(true)
  
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

  // Cleanup on component unmount - cancel pending requests and prevent state updates
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      // Cancel any pending AI analysis requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
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
      if (isMountedRef.current) {
        setAnalysisError('请先选择一个项目')
        setIsNetworkError(false)
      }
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
      if (isMountedRef.current) {
        setAnalysisError('请输入文本或上传文件')
        setIsNetworkError(false)
      }
      return
    }
    
    if (documentText.trim().length === 0) {
      console.error('Document text is empty after trimming')
      if (isMountedRef.current) {
        setAnalysisError('文档内容为空，请输入有效的文本或上传包含内容的文件')
        setIsNetworkError(false)
      }
      return
    }

    if (isMountedRef.current) {
      setIsAnalyzing(true)
      setAnalysisError(null)
      setIsNetworkError(false)
      setShowAILoadingModal(true) // 显示加载模态框
    }

    const params = {
      documentText,
      projectId: selectedProject,
      graphId: selectedGraph || undefined,
      visualizationType: outputFormat,
      customPrompt: customPrompt.trim() || undefined, // 添加自定义提示词
    }

    // 保存参数以便重试
    if (isMountedRef.current) {
      setLastAnalysisParams(params)
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 调用AI分析API - wrap in additional try-catch for Chrome extension compatibility
      let response
      try {
        response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
          signal: abortController.signal, // 添加取消信号
        }).catch((fetchError) => {
          // Handle fetch errors (including Chrome extension message channel errors)
          console.error('Fetch error in handleAIAnalysis:', fetchError)
          throw fetchError
        })
      } catch (fetchError: any) {
        // Chrome extension compatibility - handle message channel errors
        console.error('Chrome extension or fetch error:', fetchError)
        throw fetchError
      }

      const result = await response.json()

      if (result.success) {
        // 设置AI生成的数据并显示预览模态框 - only if mounted
        if (isMountedRef.current) {
          setAiGeneratedData(result.data)
          setShowAIPreview(true)
          setLastAnalysisParams(null) // 清除保存的参数
        }
      } else {
        // 显示错误消息 - only if mounted
        if (isMountedRef.current) {
          setAnalysisError(result.error || 'AI分析失败，请重试')
          setIsNetworkError(false)
        }
      }
    } catch (error: any) {
      // 检查是否是用户取消
      if (error.name === 'AbortError') {
        console.log('AI analysis cancelled by user')
        if (isMountedRef.current) {
          setAnalysisError(null)
          setIsNetworkError(false)
        }
      } else {
        console.error('AI analysis error:', error)
        if (isMountedRef.current) {
          setAnalysisError('网络错误，请检查连接后重试')
          setIsNetworkError(true)
        }
      }
    } finally {
      // Cleanup - only update state if mounted
      if (isMountedRef.current) {
        setIsAnalyzing(false)
        setShowAILoadingModal(false) // 隐藏加载模态框
      }
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

    if (isMountedRef.current) {
      setIsAnalyzing(true)
      setAnalysisError(null)
      setIsNetworkError(false)
      setShowAILoadingModal(true) // 显示加载模态框
    }

    // 创建新的 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Wrap in additional try-catch for Chrome extension compatibility
      let response
      try {
        response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lastAnalysisParams),
          signal: abortController.signal, // 添加取消信号
        }).catch((fetchError) => {
          // Handle fetch errors (including Chrome extension message channel errors)
          console.error('Fetch error in handleRetryAnalysis:', fetchError)
          throw fetchError
        })
      } catch (fetchError: any) {
        // Chrome extension compatibility - handle message channel errors
        console.error('Chrome extension or fetch error in retry:', fetchError)
        throw fetchError
      }

      const result = await response.json()

      if (result.success) {
        if (isMountedRef.current) {
          setAiGeneratedData(result.data)
          setShowAIPreview(true)
          setLastAnalysisParams(null)
        }
      } else {
        if (isMountedRef.current) {
          setAnalysisError(result.error || 'AI分析失败，请重试')
          setIsNetworkError(false)
        }
      }
    } catch (error: any) {
      // 检查是否是用户取消
      if (error.name === 'AbortError') {
        console.log('AI analysis retry cancelled by user')
        if (isMountedRef.current) {
          setAnalysisError(null)
          setIsNetworkError(false)
        }
      } else {
        console.error('AI analysis retry error:', error)
        if (isMountedRef.current) {
          setAnalysisError('网络错误，请检查连接后重试')
          setIsNetworkError(true)
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false)
        setShowAILoadingModal(false) // 隐藏加载模态框
      }
      abortControllerRef.current = null
    }
  }

  // AI预览保存处理函数 - Enhanced for navigation (Task 2.2)
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
        
        // 刷新图谱列表
        if (selectedProject) {
          const graphsResponse = await fetch(`/api/projects/${selectedProject}/graphs`)
          if (graphsResponse.ok) {
            const graphsData = await graphsResponse.json()
            setGraphs(graphsData.graphs || [])
          }
        }
        
        // Return success with graphId for navigation (Task 2.2)
        return {
          success: true,
          graphId: result.data.graphId,
          graphName: result.data.graphName
        }
      } else {
        // Return error without navigation (Requirement 3.2)
        return {
          success: false,
          error: result.error || '保存失败，请重试'
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存失败，请重试'
      }
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    // 防抖动：如果正在创建中，直接返回
    if (isCreatingProject) return
    
    setIsCreatingProject(true)
    
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
        
        // 显示警告信息（如果有）
        if (result.warnings && result.warnings.length > 0) {
          console.warn('项目创建警告:', result.warnings)
        }
        
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
    } finally {
      // 无论成功还是失败，都要重置创建状态
      setIsCreatingProject(false)
    }
  }

  const handleCreateGraph = async () => {
    if (!newGraphName.trim() || !selectedProject) return
    
    // 防抖动：如果正在创建中，直接返回
    if (isCreatingGraph) return
    
    setIsCreatingGraph(true)

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
    } finally {
      // 无论成功还是失败，都要重置创建状态
      setIsCreatingGraph(false)
    }
  }

  const filteredGraphs = graphs.filter(g => g.projectId === selectedProject)

  return (
    <main style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${inkWashTokens.colors.neutral.gray50} 0%, ${inkWashTokens.colors.neutral.gray100} 50%, ${inkWashTokens.colors.neutral.white} 100%)`,
      padding: '0'
    }}>
      {/* 顶部导航栏 - 水墨风格 */}
      <nav className={styles.mobileNav} style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
        boxShadow: inkWashTokens.shadows.sm
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '22px',
          fontWeight: 'bold',
          background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 100%)`,
            borderRadius: inkWashTokens.borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            boxShadow: `0 4px 12px rgba(90, 154, 143, 0.3)`
          }}>
            🎋
          </div>
          知识图谱生成器
        </div>
      </nav>

      <div className={`${styles.mobileContainer} ${styles.tabletContainer} ${styles.desktopContainer}`} style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 30px 100px 30px'
      }}>
        {/* 标题 - 水墨风格 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 className={styles.mobileTitle} style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '20px',
            background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 50%, ${inkWashTokens.colors.accent.sage} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-1px',
            textShadow: '0 2px 20px rgba(90, 154, 143, 0.1)'
          }}>
            AI知识图谱生成器
          </h1>
          <p className={styles.mobileSubtitle} style={{
            color: inkWashTokens.colors.neutral.gray600,
            fontSize: '18px',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8',
            fontWeight: '500'
          }}>
            🎨 导入数据或输入文本，AI 将自动提取实体关系，生成可视化知识图谱
          </p>
        </div>

        {/* 主内容区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}>
          {/* 项目和图谱选择区域 - 水墨风格 */}
          <div className={`${styles.mobileCard} ${styles.tabletCard} ${styles.desktopCard}`} style={{
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.lg,
            padding: '36px',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.md
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 100%)`,
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

            <div className={`${styles.mobileGrid} ${styles.tabletGrid}`} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}>
              {/* 项目选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: inkWashTokens.colors.neutral.gray800,
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
                      background: inkWashTokens.colors.neutral.white,
                      border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                      borderRadius: inkWashTokens.borderRadius.lg,
                      color: inkWashTokens.colors.neutral.gray800,
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: isLoadingProjects ? 'wait' : 'pointer',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingProjects) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoadingProjects) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                      e.currentTarget.style.boxShadow = 'none'
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
                    className={styles.mobileButton}
                    style={{
                      padding: '14px 24px',
                      background: inkWashTokens.colors.primary.main,
                      border: 'none',
                      borderRadius: inkWashTokens.borderRadius.lg,
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(90, 154, 143, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 154, 143, 0.4)'
                      e.currentTarget.style.background = inkWashTokens.colors.primary.dark
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 154, 143, 0.3)'
                      e.currentTarget.style.background = inkWashTokens.colors.primary.main
                    }}>
                    + 新建
                  </button>
                </div>
              </div>

              {/* 图谱选择 */}
              <div>
                <label style={{
                  display: 'block',
                  color: inkWashTokens.colors.neutral.gray800,
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
                      background: (selectedProject && !isLoadingGraphs) ? inkWashTokens.colors.neutral.white : inkWashTokens.colors.neutral.gray100,
                      border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                      borderRadius: inkWashTokens.borderRadius.lg,
                      color: (selectedProject && !isLoadingGraphs) ? inkWashTokens.colors.neutral.gray800 : inkWashTokens.colors.neutral.gray500,
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: (selectedProject && !isLoadingGraphs) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProject && !isLoadingGraphs) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProject && !isLoadingGraphs) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                      }
                    }}
                    onFocus={(e) => {
                      if (selectedProject && !isLoadingGraphs) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
                      }
                    }}
                    onBlur={(e) => {
                      if (selectedProject && !isLoadingGraphs) {
                        e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                        e.currentTarget.style.boxShadow = 'none'
                      }
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
                    className={styles.mobileButton}
                    style={{
                      padding: '14px 24px',
                      background: selectedProject ? inkWashTokens.colors.primary.main : inkWashTokens.colors.neutral.gray300,
                      border: 'none',
                      borderRadius: inkWashTokens.borderRadius.lg,
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: selectedProject ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      opacity: selectedProject ? 1 : 0.5,
                      boxShadow: selectedProject ? '0 4px 12px rgba(90, 154, 143, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 154, 143, 0.4)'
                        e.currentTarget.style.background = inkWashTokens.colors.primary.dark
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProject) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 154, 143, 0.3)'
                        e.currentTarget.style.background = inkWashTokens.colors.primary.main
                      }
                    }}>
                    + 新建
                  </button>
                </div>
              </div>
            </div>

            {/* 提示信息 - 水墨风格 */}
            {!selectedProject && (
              <div style={{
                marginTop: '20px',
                padding: '16px 20px',
                background: inkWashTokens.colors.semantic.warning + '1a', // 10% opacity
                border: `1px solid ${inkWashTokens.colors.semantic.warning}4d`, // 30% opacity
                borderRadius: inkWashTokens.borderRadius.lg,
                color: '#8b6f47',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <span>请先选择或创建一个项目</span>
              </div>
            )}
          </div>

          {/* 输入区域 - 水墨风格 */}
          <div className={`${styles.mobileCard} ${styles.tabletCard} ${styles.desktopCard}`} style={{
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.lg,
            padding: '36px',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.md
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 100%)`,
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

            {/* 文件上传按钮 - 水墨风格 */}
            <div style={{
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                background: 'white',
                border: `2px dashed ${inkWashTokens.colors.accent.mist}`,
                borderRadius: inkWashTokens.borderRadius.lg,
                color: inkWashTokens.colors.primary.main,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '15px',
                fontWeight: '700',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(90, 154, 143, 0.05)'
                e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = inkWashTokens.colors.accent.mist
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <span style={{ fontSize: '24px' }}>📄</span>
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
                color: inkWashTokens.colors.neutral.gray600,
                fontSize: '13px',
                fontWeight: '500'
              }}>
                支持格式：TXT, MD, Markdown
              </div>
            </div>

            {/* 已导入文件信息卡片 - 水墨风格 */}
            {uploadedFile && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(90, 154, 143, 0.08)',
                border: `1px solid rgba(90, 154, 143, 0.2)`,
                borderRadius: inkWashTokens.borderRadius.lg,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: inkWashTokens.colors.primary.main,
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
                        background: 'rgba(90, 154, 143, 0.2)',
                      }}>✓</span>
                      文件已导入
                    </div>
                    <div style={{
                      color: inkWashTokens.colors.neutral.gray800,
                      fontSize: '14px',
                      marginBottom: '6px',
                      fontWeight: '500',
                    }}>
                      📄 {uploadedFile.name}
                    </div>
                    <div style={{
                      color: inkWashTokens.colors.neutral.gray600,
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
                      borderRadius: inkWashTokens.borderRadius.sm,
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
                    border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                    borderRadius: inkWashTokens.borderRadius.md,
                    color: inkWashTokens.colors.primary.main,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(90, 154, 143, 0.05)'
                    e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                  }}>
                  {showPreview ? '🔼 收起预览' : '🔽 展开预览'}
                </button>

                {/* 文件预览 */}
                {showPreview && (
                  <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: inkWashTokens.colors.neutral.gray100,
                    border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                    borderRadius: inkWashTokens.borderRadius.md,
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}>
                    <pre style={{
                      color: inkWashTokens.colors.neutral.gray800,
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

            {/* AI智能分析说明 - 水墨风格 */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(90, 154, 143, 0.08)',
              border: `1px solid rgba(90, 154, 143, 0.2)`,
              borderRadius: inkWashTokens.borderRadius.lg,
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
                  color: inkWashTokens.colors.primary.main,
                  fontWeight: '600',
                }}>
                  AI 智能分析
                </div>
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: inkWashTokens.colors.neutral.gray600, 
                lineHeight: '1.6',
                paddingLeft: '30px',
              }}>
                支持 TXT、MD 格式 · 自动提取实体和关系 · 生成可视化图谱
              </div>
            </div>

            {/* 文本输入框 - 水墨风格 */}
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
                background: uploadedFile ? inkWashTokens.colors.neutral.gray100 : 'white',
                border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                borderRadius: inkWashTokens.borderRadius.md,
                color: uploadedFile ? inkWashTokens.colors.neutral.gray500 : inkWashTokens.colors.neutral.gray800,
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                fontFamily: 'inherit',
                cursor: uploadedFile ? 'not-allowed' : 'text',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                if (!uploadedFile) {
                  e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!uploadedFile) {
                  e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            />

            <div style={{
              marginTop: '8px',
              color: inkWashTokens.colors.neutral.gray600,
              fontSize: '12px',
            }}>
              {uploadedFile && inputText.trim()
                ? `文件大小: ${formatFileSize(uploadedFile.size)} | 字符数: ${inputText.length}`
                : uploadedFile 
                ? `文件大小: ${formatFileSize(uploadedFile.size)}`
                : `字符数: ${inputText.length}`}
            </div>
          </div>

          {/* 配置区域 - 水墨风格 */}
          <div className={`${styles.mobileCard} ${styles.tabletCard} ${styles.desktopCard}`} style={{
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.lg,
            padding: '36px',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.md
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${inkWashTokens.colors.primary.main} 0%, ${inkWashTokens.colors.primary.light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>⚙️</span> 输出配置
            </h2>

            {/* 输出格式选择 */}
            <div style={{
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'block',
                color: inkWashTokens.colors.neutral.gray800,
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '12px',
              }}>
                图谱类型
              </label>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
              }}>
                {/* 仅保留3D选项 */}
                <div
                  style={{
                    padding: '20px',
                    background: 'rgba(90, 154, 143, 0.08)',
                    border: `2px solid ${inkWashTokens.colors.primary.main}`,
                    borderRadius: inkWashTokens.borderRadius.lg,
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '300px',
                  }}>
                  <div style={{
                    fontSize: '36px',
                    marginBottom: '8px',
                  }}>
                    🌐
                  </div>
                  <div style={{
                    color: inkWashTokens.colors.neutral.gray800,
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}>
                    三维图谱
                  </div>
                  <div style={{
                    color: inkWashTokens.colors.neutral.gray600,
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
                    background: `rgba(90, 154, 143, 0.1)`,
                    border: `1px solid rgba(90, 154, 143, 0.3)`,
                    borderRadius: '8px',
                    color: inkWashTokens.colors.primary.main,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(90, 154, 143, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(90, 154, 143, 0.1)'
                  }}>
                  {showCustomPrompt ? '收起 ▲' : '展开 ▼'}
                </button>
              </div>

              {showCustomPrompt && (
                <div 
                  className={styles.slideDown}
                  style={{
                    padding: '20px',
                    background: 'rgba(90, 154, 143, 0.05)',
                    border: '1px solid rgba(90, 154, 143, 0.2)',
                    borderRadius: '12px',
                  }}>
                  <div style={{
                    color: inkWashTokens.colors.neutral.gray600,
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
                      border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                      borderRadius: '10px',
                      color: inkWashTokens.colors.neutral.gray800,
                      fontSize: '13px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />

                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      color: inkWashTokens.colors.neutral.gray600,
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

            {/* AI分析生成按钮 - 水墨风格 */}
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
                    ? inkWashTokens.colors.primary.main
                    : inkWashTokens.colors.neutral.gray300,
                  border: 'none',
                  borderRadius: inkWashTokens.borderRadius.lg,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing)
                    ? '0 4px 12px rgba(90, 154, 143, 0.3)'
                    : 'none',
                  opacity: (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) ? 1 : 0.6,
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  if (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 154, 143, 0.4)'
                    e.currentTarget.style.background = inkWashTokens.colors.primary.light
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProject && (uploadedFile || inputText.trim()) && !isAnalyzing) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 154, 143, 0.3)'
                    e.currentTarget.style.background = inkWashTokens.colors.primary.main
                  }
                }}>
                <span style={{ fontSize: '22px', marginRight: '10px' }}>
                  {isAnalyzing ? '⏳' : '🤖'}
                </span>
                {isAnalyzing ? 'AI分析中...' : 'AI分析生成知识图谱'}
              </button>
              
              {/* 提示信息 - 水墨风格 */}
              {!selectedProject ? (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: inkWashTokens.colors.semantic.warning + '1a', // 10% opacity
                  border: `1px solid ${inkWashTokens.colors.semantic.warning}4d`, // 30% opacity
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: '#8b6f47',
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
                  background: inkWashTokens.colors.semantic.warning + '1a', // 10% opacity
                  border: `1px solid ${inkWashTokens.colors.semantic.warning}4d`, // 30% opacity
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: '#8b6f47',
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

            {/* 提示信息 - 水墨风格 */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(90, 154, 143, 0.08)',
              border: `1px solid rgba(90, 154, 143, 0.2)`,
              borderRadius: inkWashTokens.borderRadius.lg,
            }}>
              <div style={{
                color: inkWashTokens.colors.neutral.gray600,
                fontSize: '14px',
                lineHeight: '1.7',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  fontWeight: '700',
                  color: inkWashTokens.colors.primary.main,
                }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  AI智能分析说明
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '24px',
                  color: inkWashTokens.colors.neutral.gray600,
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
          <div className={styles.mobileModal} style={{
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.xl,
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.xl,
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: inkWashTokens.colors.neutral.gray800,
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
                background: inkWashTokens.colors.neutral.white,
                border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                borderRadius: inkWashTokens.borderRadius.lg,
                color: inkWashTokens.colors.neutral.gray800,
                fontSize: '15px',
                marginBottom: '24px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                e.currentTarget.style.boxShadow = 'none'
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
                  background: inkWashTokens.colors.neutral.white,
                  border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: inkWashTokens.colors.neutral.gray600,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = inkWashTokens.colors.neutral.gray100
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = inkWashTokens.colors.neutral.white
                }}>
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreatingProject}
                style={{
                  padding: '12px 24px',
                  background: (newProjectName.trim() && !isCreatingProject)
                    ? inkWashTokens.colors.primary.main
                    : inkWashTokens.colors.neutral.gray300,
                  border: 'none',
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: inkWashTokens.colors.neutral.white,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (newProjectName.trim() && !isCreatingProject) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: (newProjectName.trim() && !isCreatingProject) ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (newProjectName.trim() && !isCreatingProject) {
                    e.currentTarget.style.background = inkWashTokens.colors.primary.light
                  }
                }}
                onMouseLeave={(e) => {
                  if (newProjectName.trim() && !isCreatingProject) {
                    e.currentTarget.style.background = inkWashTokens.colors.primary.main
                  }
                }}>
                {isCreatingProject && (
                  <div className={styles.spinner} />
                )}
                {isCreatingProject ? '创建中...' : '创建'}
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
          <div className={styles.mobileModal} style={{
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.xl,
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.xl,
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: inkWashTokens.colors.neutral.gray800,
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
                background: inkWashTokens.colors.neutral.white,
                border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                borderRadius: inkWashTokens.borderRadius.lg,
                color: inkWashTokens.colors.neutral.gray800,
                fontSize: '15px',
                marginBottom: '24px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = inkWashTokens.colors.primary.main
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 154, 143, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = inkWashTokens.colors.neutral.gray200
                e.currentTarget.style.boxShadow = 'none'
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
                  background: inkWashTokens.colors.neutral.white,
                  border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: inkWashTokens.colors.neutral.gray600,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = inkWashTokens.colors.neutral.gray100
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = inkWashTokens.colors.neutral.white
                }}>
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={!newGraphName.trim() || isCreatingGraph}
                style={{
                  padding: '12px 24px',
                  background: (newGraphName.trim() && !isCreatingGraph)
                    ? inkWashTokens.colors.primary.main
                    : inkWashTokens.colors.neutral.gray300,
                  border: 'none',
                  borderRadius: inkWashTokens.borderRadius.md,
                  color: inkWashTokens.colors.neutral.white,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (newGraphName.trim() && !isCreatingGraph) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: (newGraphName.trim() && !isCreatingGraph) ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (newGraphName.trim() && !isCreatingGraph) {
                    e.currentTarget.style.background = inkWashTokens.colors.primary.light
                  }
                }}
                onMouseLeave={(e) => {
                  if (newGraphName.trim() && !isCreatingGraph) {
                    e.currentTarget.style.background = inkWashTokens.colors.primary.main
                  }
                }}>
                {isCreatingGraph && (
                  <div className={styles.spinner} />
                )}
                {isCreatingGraph ? '创建中...' : '创建'}
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
            background: inkWashTokens.colors.neutral.white,
            borderRadius: inkWashTokens.borderRadius.xl,
            padding: '48px',
            maxWidth: '480px',
            width: '90%',
            border: `1px solid ${inkWashTokens.colors.neutral.gray200}`,
            boxShadow: inkWashTokens.shadows.xl,
            textAlign: 'center',
          }}>
            {/* 加载动画 - 水墨风格 */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 32px',
              position: 'relative',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                border: `4px solid rgba(90, 154, 143, 0.2)`,
                borderTop: `4px solid ${inkWashTokens.colors.primary.main}`,
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
              color: inkWashTokens.colors.neutral.gray800,
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              letterSpacing: '0.5px',
            }}>
              AI正在生成中
            </h3>

            {/* 描述 */}
            <p style={{
              color: inkWashTokens.colors.neutral.gray600,
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
                background: 'rgba(193, 123, 123, 0.1)',
                border: `1px solid rgba(193, 123, 123, 0.3)`,
                borderRadius: inkWashTokens.borderRadius.lg,
                color: inkWashTokens.colors.semantic.error,
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(193, 123, 123, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(193, 123, 123, 0.1)'
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
          enableAutoNavigation={true}
        />
      )}
    </main>
  )
}
