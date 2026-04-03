'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGraphStore } from '@/lib/store'
import { useUserStore } from '@/lib/userStore'
import { getThemeConfig } from '@/lib/theme'
import CreateProjectModal from './CreateProjectModal'
import CoverUploadModal from './CoverUploadModal'
import DeleteButton from './DeleteButton'
import DeleteConfirmDialog from './DeleteConfirmDialog'

interface TopNavbarProps {
  mode?: 'full' | 'readonly'
}

export default function TopNavbar({ mode = 'full' }: TopNavbarProps = {}) {
  const router = useRouter()
  
  const { 
    nodes, 
    projects, 
    currentProject, 
    currentGraph,
    theme,
    hasUnsavedChanges,
    setProjects,
    setSelectedNode,
    setHasUnsavedChanges,
    createProject,
    addGraphToProject,
    switchGraph,
  } = useGraphStore()
  
  const { user, isLoggedIn, logout, initializeFromStorage } = useUserStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  
  // 保存按钮状态
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const projectMenuRef = useRef<HTMLDivElement>(null)

  // 删除相关状态
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: 'project' | 'graph' | null
    id: string | null
    name: string | null
    stats: {
      nodeCount: number
      edgeCount: number
      graphCount?: number
    }
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: null,
    stats: { nodeCount: 0, edgeCount: 0 },
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // 实时搜索当前图谱的节点
  useEffect(() => {
    if (searchQuery.trim() && currentGraph) {
      const results = nodes.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery, nodes, currentGraph])

  // 页面加载时恢复状态
  useEffect(() => {
    // 从 localStorage 恢复登录状态
    initializeFromStorage()

    // 从数据库加载项目数据（使用优化的 API）
    const loadProjects = async () => {
      try {
        // 先检查 URL 查询参数（优先级最高）
        const urlParams = new URLSearchParams(window.location.search)
        const projectIdFromUrl = urlParams.get('projectId')
        const graphIdFromUrl = urlParams.get('graphId')
        
        // 如果 URL 中有 projectId 和 graphId，直接使用它们
        if (projectIdFromUrl && graphIdFromUrl) {
          console.log('🔍 [TopNavbar] URL 中有 projectId 和 graphId:', projectIdFromUrl, graphIdFromUrl)
          
          // 加载项目列表
          const res = await fetch('/api/projects/with-graphs')
          if (res.ok) {
            const data = await res.json()
            const projects = data.projects || []
            setProjects(projects)
            
            // 查找项目和图谱
            const project = projects.find((p: any) => p.id === projectIdFromUrl)
            const graph = project?.graphs.find((g: any) => g.id === graphIdFromUrl)
            
            if (project && graph) {
              console.log('✅ [TopNavbar] 从 URL 参数设置项目和图谱:', project.name, '/', graph.name)
              switchGraph(projectIdFromUrl, graphIdFromUrl)
              return
            }
          }
        }
        
        // 检查是否已经有 currentProject 设置好了（例如从 3d-editor 页面设置的）
        const state = useGraphStore.getState()
        if (state.currentProject && state.currentGraph) {
          console.log('✅ [TopNavbar] 已有 currentProject 和 currentGraph，跳过初始化')
          console.log('   当前项目:', state.currentProject.name)
          console.log('   当前图谱:', state.currentGraph.name)
          // 仍然需要加载项目列表，但不要覆盖 currentProject
          const res = await fetch('/api/projects/with-graphs')
          if (res.ok) {
            const data = await res.json()
            const projects = data.projects || []
            setProjects(projects)
          }
          return
        }
        
        const res = await fetch('/api/projects/with-graphs')
        if (res.ok) {
          const data = await res.json()
          const projects = data.projects || []
          
          setProjects(projects)
          
          // 从 localStorage 获取项目 ID 和图谱 ID
          let projectId = localStorage.getItem('currentProjectId')
          let graphId = localStorage.getItem('currentGraphId')
          
          // 验证ID是否是真实的数据库ID（cuid格式）
          const isValidId = (id: string | null) => id && id.startsWith('cmk')
          
          // 如果只有 graphId 没有 projectId，尝试从项目列表中查找对应的项目
          if (isValidId(graphId) && !isValidId(projectId)) {
            console.log('🔍 [TopNavbar] 只有 graphId，查找对应的项目...')
            for (const project of projects) {
              const graph = project.graphs.find((g: any) => g.id === graphId)
              if (graph) {
                projectId = project.id
                console.log('✅ [TopNavbar] 找到对应的项目:', project.name)
                break
              }
            }
          }
          
          if (isValidId(projectId) && isValidId(graphId)) {
            // 验证项目和图谱是否存在
            const project = projects.find((p: any) => p.id === projectId)
            const graph = project?.graphs.find((g: any) => g.id === graphId)
            
            if (project && graph) {
              console.log('🔄 [TopNavbar] 切换到图谱:', project.name, '/', graph.name)
              switchGraph(projectId!, graphId!)
            } else {
              console.log('⚠️ [TopNavbar] 项目或图谱不存在，清理缓存')
              localStorage.removeItem('currentProjectId')
              localStorage.removeItem('currentGraphId')
            }
          } else {
            // 清理旧的本地ID
            localStorage.removeItem('currentProjectId')
            localStorage.removeItem('currentGraphId')
            localStorage.removeItem('projects')
          }
        }
      } catch (error) {
        console.error('❌ 加载项目失败:', error)
      }
    }
    
    loadProjects()
  }, [setProjects, switchGraph])

  // 初始化用户状态
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])
  
  // 清除保存成功提示
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, 3000) // 3秒后清除成功提示
      
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])
  
  // 清除保存错误提示
  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => {
        setSaveError(null)
      }, 5000) // 5秒后清除错误提示
      
      return () => clearTimeout(timer)
    }
  }, [saveError])

  // 点击外部关闭项目菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false)
        setHoveredProjectId(null)
      }
    }

    if (showProjectMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProjectMenu])

  const handleLogout = () => {
    logout()
  }

  // 保存节点位置处理函数
  const handleSavePositions = async () => {
    // 验证图谱 ID 存在
    if (!currentGraph?.id) {
      console.error('❌ [保存位置] 图谱 ID 不存在')
      setSaveError('请先选择一个图谱')
      return
    }

    // 验证节点数组不为空
    if (!nodes || nodes.length === 0) {
      console.error('❌ [保存位置] 节点数组为空')
      setSaveError('没有节点需要保存')
      return
    }

    console.log('🔄 [保存位置] 开始保存节点位置...')
    console.log('   图谱 ID:', currentGraph.id)
    console.log('   节点数量:', nodes.length)

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // 在保存前验证所有节点坐标
      const invalidNodes = nodes.filter(node => 
        !isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)
      )
      
      if (invalidNodes.length > 0) {
        console.error('❌ [保存位置] 发现无效坐标的节点:', invalidNodes.map(n => ({
          id: n.id,
          name: n.name,
          x: n.x,
          y: n.y,
          z: n.z,
        })))
        setSaveError(`发现 ${invalidNodes.length} 个节点坐标无效，无法保存`)
        return
      }
      
      // 将三维坐标（x, y, z）保存到数据库
      const nodePositions = nodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        z: node.z,  // 保存 z 坐标（3D 位置）
      }))

      // 构建包含 graphId、nodes 和 metadata 的请求负载
      const payload = {
        graphId: currentGraph.id,
        nodes: nodePositions,
        metadata: {
          is3D: true,  // 设置 is3D 标志
          savedAt: new Date().toISOString(),
        },
      }

      console.log('📤 [保存位置] 发送请求:', {
        graphId: payload.graphId,
        nodeCount: payload.nodes.length,
        metadata: payload.metadata,
      })

      // 调用 POST /api/graphs/save-positions API
      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // 根据 success 字段判断操作结果
      if (response.ok && data.success) {
        console.log('✅ [保存位置] 保存成功')
        setSaveSuccess(true)
        setHasUnsavedChanges(false)
        
        // 清除本地缓存（如果有的话）
        try {
          localStorage.removeItem(`graph_positions_${currentGraph.id}`)
        } catch (error) {
          console.warn('⚠️ [保存位置] 清除本地缓存失败:', error)
        }
      } else {
        // 处理错误响应
        let errorMessage = data.error || data.message || '保存失败'
        
        // 根据状态码显示相应错误消息
        if (response.status === 401) {
          errorMessage = '请先登录'
        } else if (response.status === 403) {
          errorMessage = '无权限修改此图谱'
        } else if (response.status === 404) {
          errorMessage = '图谱不存在或已被删除'
        } else if (response.status >= 500) {
          errorMessage = '服务器错误，请稍后重试'
        }

        console.error('❌ [保存位置] 保存失败:', errorMessage)
        console.error('   响应状态:', response.status)
        console.error('   响应数据:', data)
        
        setSaveError(errorMessage)
      }
    } catch (error) {
      // 捕获网络错误并显示友好提示
      console.error('❌ [保存位置] 网络错误:', error)
      console.error('   错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      })
      
      const errorMessage = error instanceof Error ? error.message : '网络错误，请稍后重试'
      setSaveError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // 获取当前主题配置
  const themeConfig = getThemeConfig(theme)

  const handleCreateProject = async (projectName: string, graphName: string, isNewProject: boolean) => {
    try {
      if (isNewProject) {
        await createProject(projectName, graphName)
      } else {
        // 添加到现有项目
        const project = projects.find(p => p.name === projectName)
        if (project) {
          await addGraphToProject(project.id, graphName)
        }
      }
      
      // 创建成功后，保持下拉框展开状态
      setShowProjectMenu(true)
      
      // 如果是添加到现有项目，展开该项目
      if (!isNewProject) {
        const project = projects.find(p => p.name === projectName)
        if (project) {
          setHoveredProjectId(project.id)
        }
      } else {
        // 如果是新建项目，展开新项目
        // 由于 createProject 会更新 currentProject，我们可以使用它
        const newProjectId = currentProject?.id
        if (newProjectId) {
          setHoveredProjectId(newProjectId)
        }
      }
    } catch (error) {
      console.error('创建失败:', error)
      alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleSwitchGraph = (projectId: string, graphId: string) => {
    // 更新 URL 参数，避免与 TopNavbar 的 useEffect 冲突
    const url = new URL(window.location.href)
    url.searchParams.set('graphId', graphId)
    window.history.replaceState({}, '', url.toString())
    
    switchGraph(projectId, graphId)
    setShowProjectMenu(false)
    setHoveredProjectId(null)
  }

  const toggleProject = (projectId: string) => {
    setHoveredProjectId(hoveredProjectId === projectId ? null : projectId)
  }

  // 删除项目处理
  const handleDeleteProject = async (e: React.MouseEvent, project: any) => {
    e.stopPropagation()
    
    // 计算项目的统计信息
    const totalNodes = project.graphs.reduce((sum: number, g: any) => sum + (g.nodeCount || 0), 0)
    const totalEdges = project.graphs.reduce((sum: number, g: any) => sum + (g.edgeCount || 0), 0)
    
    setDeleteDialog({
      isOpen: true,
      type: 'project',
      id: project.id,
      name: project.name,
      stats: {
        nodeCount: totalNodes,
        edgeCount: totalEdges,
        graphCount: project.graphs.length,
      },
    })
  }

  // 删除图谱处理
  const handleDeleteGraph = async (e: React.MouseEvent, projectId: string, graph: any) => {
    e.stopPropagation()
    
    setDeleteDialog({
      isOpen: true,
      type: 'graph',
      id: graph.id,
      name: graph.name,
      stats: {
        nodeCount: graph.nodeCount || 0,
        edgeCount: graph.edgeCount || 0,
      },
    })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return

    setIsDeleting(true)
    
    // 保存删除信息，用于后续验证
    const deletingId = deleteDialog.id
    const deletingType = deleteDialog.type
    const deletingName = deleteDialog.name
    
    try {
      const endpoint =
        deleteDialog.type === 'project'
          ? `/api/projects/${deleteDialog.id}`
          : `/api/graphs/${deleteDialog.id}`

      console.log(`🗑️ [DELETE] 开始删除 ${deleteDialog.type}:`, deleteDialog.name, `ID: ${deleteDialog.id}`)
      
      const res = await fetch(endpoint, { method: 'DELETE' })
      
      // 处理不同的错误状态码
      if (!res.ok) {
        if (res.status === 404) {
          // 404 错误：项目或图谱已经不存在（可能已被删除）
          const entityName = deleteDialog.type === 'project' ? '项目' : '图谱'
          console.log(`⚠️ [DELETE] ${entityName}不存在 (404)，可能已被删除，立即刷新下拉框`)
          
          // 关闭对话框
          setDeleteDialog({
            isOpen: false,
            type: null,
            id: null,
            name: null,
            stats: { nodeCount: 0, edgeCount: 0 },
          })
          
          // 立即刷新项目列表
          console.log('🔄 [DELETE] 立即刷新项目列表...')
          const projectsRes = await fetch('/api/projects/with-graphs', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          })
          
          if (projectsRes.ok) {
            const projectsData = await projectsRes.json()
            const projects = projectsData.projects || []
            setProjects(projects)
            console.log('✅ [DELETE] 项目列表已刷新')
          }
          
          // 显示友好提示
          alert(`该${entityName}已被删除`)
          return
        } else if (res.status === 500) {
          // 500 错误：服务器错误
          const data = await res.json()
          throw new Error(data.error || data.message || '服务器错误')
        } else {
          // 其他错误
          const data = await res.json()
          throw new Error(data.error || '删除失败')
        }
      }

      const data = await res.json()
      console.log('✅ [DELETE] 删除API调用成功:', data)

      // 显示成功消息
      alert(
        `成功删除 ${deletingName}！\n删除了 ${data.deletedNodeCount} 个节点和 ${data.deletedEdgeCount} 条边`
      )

      // 关闭对话框
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: null,
        name: null,
        stats: { nodeCount: 0, edgeCount: 0 },
      })

      // 检查是否删除的是当前选中的项目或图谱
      const isCurrentProject = deletingType === 'project' && currentProject?.id === deletingId
      const isCurrentGraph = deletingType === 'graph' && currentGraph?.id === deletingId
      
      if (isCurrentProject || isCurrentGraph) {
        // 清理选择并刷新页面
        console.log('🔄 [DELETE] 删除了当前选中的项目/图谱，清理状态并刷新页面')
        localStorage.removeItem('currentProjectId')
        localStorage.removeItem('currentGraphId')
        window.location.reload()
        return
      }

      // 记住当前展开的项目ID（如果删除的是图谱）
      const expandedProjectId = deletingType === 'graph' ? hoveredProjectId : null

      // 重新加载项目列表（使用重试机制确保获取最新数据）
      console.log('🔄 [DELETE] 开始验证删除并刷新项目列表...')
      let retryCount = 0
      const maxRetries = 3
      let verified = false

      while (retryCount < maxRetries && !verified) {
        // 添加短暂延迟，让数据库有时间同步（指数退避）
        if (retryCount > 0) {
          const delay = 500 * retryCount
          console.log(`⏳ [DELETE] 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries}, 延迟 ${delay}ms)`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        console.log(`🔍 [DELETE] 尝试 ${retryCount + 1}/${maxRetries}: 获取最新项目列表...`)
        const projectsRes = await fetch('/api/projects/with-graphs', {
          // 添加缓存控制，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          const projects = projectsData.projects || []
          
          console.log(`📊 [DELETE] 获取到 ${projects.length} 个项目`)
          
          // 验证删除是否成功（检查被删除的项目/图谱是否还存在）
          if (deletingType === 'project') {
            const stillExists = projects.some((p: any) => p.id === deletingId)
            console.log(`🔍 [DELETE] 验证项目 ${deletingId} 是否还存在: ${stillExists}`)
            
            if (!stillExists) {
              // 删除成功，更新状态
              setProjects(projects)
              verified = true
              console.log('✅ [DELETE] 项目删除验证成功，列表已更新')
            } else {
              console.log('⚠️ [DELETE] 项目仍然存在，继续重试...')
            }
          } else if (deletingType === 'graph') {
            const projectWithGraph = projects.find((p: any) => 
              p.graphs.some((g: any) => g.id === deletingId)
            )
            console.log(`🔍 [DELETE] 验证图谱 ${deletingId} 是否还存在: ${!!projectWithGraph}`)
            
            if (!projectWithGraph) {
              // 删除成功，更新状态
              setProjects(projects)
              verified = true
              console.log('✅ [DELETE] 图谱删除验证成功，列表已更新')
              
              // 如果删除的是图谱，保持项目展开状态
              if (expandedProjectId) {
                setHoveredProjectId(expandedProjectId)
              }
            } else {
              console.log('⚠️ [DELETE] 图谱仍然存在，继续重试...')
            }
          }
        } else {
          console.error(`❌ [DELETE] 获取项目列表失败: ${projectsRes.status}`)
        }
        
        retryCount++
      }

      // 如果重试后仍未验证成功，立即强制刷新页面
      if (!verified) {
        console.error('❌ [DELETE] 重试后仍未验证删除成功，立即强制刷新页面')
        window.location.reload()
      }
    } catch (error) {
      console.error('❌ [DELETE] 删除失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`删除失败: ${errorMessage}`)
      
      // 删除失败时不关闭对话框，保持状态不变
      // 用户可以重试或取消
    } finally {
      setIsDeleting(false)
    }
  }

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: null,
        name: null,
        stats: { nodeCount: 0, edgeCount: 0 },
      })
    }
  }

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: themeConfig.navbarBackground,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${themeConfig.navbarBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px',
        gap: '20px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
      }}>
        {/* 返回按钮 */}
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${themeConfig.buttonBorder}`,
            borderRadius: '8px',
            color: themeConfig.navbarText,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = themeConfig.buttonHoverBackground
            e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = themeConfig.buttonBorder
          }}
          title="返回上一页"
        >
          <span style={{ fontSize: '16px' }}>←</span>
          <span>返回</span>
        </button>

        {/* 左侧:现有图谱下拉菜单 - 仅在完整模式下显示 */}
        {mode === 'full' && (
        <div ref={projectMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            style={{
              padding: '8px 16px',
              background: showProjectMenu ? themeConfig.buttonBackground : 'transparent',
              border: `1px solid ${themeConfig.buttonBorder}`,
              borderRadius: '8px',
              color: themeConfig.navbarText,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              if (!showProjectMenu) {
                e.currentTarget.style.background = themeConfig.buttonHoverBackground
              }
            }}
            onMouseOut={(e) => {
              if (!showProjectMenu) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <span>现有图谱</span>
            {currentGraph && (
              <span style={{ 
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)', 
                fontSize: '12px',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {currentProject?.name} / {currentGraph.name}
              </span>
            )}
            <span style={{ 
              fontSize: '12px',
              transform: showProjectMenu ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}>
              ▼
            </span>
          </button>

          {/* 项目和图谱下拉菜单 - 改为单层展开式 */}
          {showProjectMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              minWidth: '320px',
              maxWidth: '450px',
              background: theme === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: `1px solid ${themeConfig.panelBorder}`,
              borderRadius: '12px',
              boxShadow: themeConfig.panelShadow,
              maxHeight: '500px',
              overflowY: 'auto',
              zIndex: 1001,
            }}>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project.id}>
                    {/* 项目标题 - 可点击展开/收起 */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderBottom: `1px solid ${themeConfig.dividerColor}`,
                        background: hoveredProjectId === project.id 
                          ? themeConfig.buttonBackground
                          : 'transparent',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseOver={(e) => {
                        if (hoveredProjectId !== project.id) {
                          e.currentTarget.style.background = themeConfig.hoverBackground
                        }
                      }}
                      onMouseOut={(e) => {
                        if (hoveredProjectId !== project.id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <div 
                        onClick={() => toggleProject(project.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          flex: 1,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ 
                          fontSize: '12px', 
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                          transform: hoveredProjectId === project.id ? 'rotate(90deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                        }}>
                          ▶
                        </span>
                        <div>
                          <div style={{ 
                            color: themeConfig.panelText, 
                            fontSize: '15px', 
                            fontWeight: '600',
                            marginBottom: '2px',
                          }}>
                            📁 {project.name}
                          </div>
                          <div style={{ 
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 
                            fontSize: '12px',
                          }}>
                            {project.graphs.length} 个图谱
                          </div>
                        </div>
                      </div>
                      {isLoggedIn && (
                        <DeleteButton
                          onDelete={(e) => handleDeleteProject(e, project)}
                          disabled={isDeleting}
                          ariaLabel={`删除项目 ${project.name}`}
                        />
                      )}
                    </div>

                    {/* 图谱列表 - 展开显示 */}
                    {hoveredProjectId === project.id && (
                      <div style={{
                        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
                        borderBottom: `1px solid ${themeConfig.dividerColor}`,
                      }}>
                        {project.graphs.map((graph) => (
                          <div
                            key={graph.id}
                            style={{
                              padding: '12px 16px 12px 48px',
                              background: currentGraph?.id === graph.id 
                                ? (theme === 'dark' ? 'rgba(74, 158, 255, 0.2)' : 'rgba(74, 158, 255, 0.15)')
                                : 'transparent',
                              transition: 'background 0.2s',
                              borderLeft: currentGraph?.id === graph.id 
                                ? '3px solid #4A9EFF' 
                                : '3px solid transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseOver={(e) => {
                              if (currentGraph?.id !== graph.id) {
                                e.currentTarget.style.background = theme === 'dark' 
                                  ? 'rgba(74, 158, 255, 0.1)' 
                                  : 'rgba(74, 158, 255, 0.08)'
                              }
                            }}
                            onMouseOut={(e) => {
                              if (currentGraph?.id !== graph.id) {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSwitchGraph(project.id, graph.id)
                              }}
                              style={{
                                flex: 1,
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ 
                                color: themeConfig.panelText, 
                                fontSize: '14px', 
                                fontWeight: '500',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}>
                                {currentGraph?.id === graph.id && (
                                  <span style={{ color: '#00bfa5', fontSize: '16px' }}>✓</span>
                                )}
                                <span>{graph.name}</span>
                              </div>
                              <div style={{ 
                                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 
                                fontSize: '12px',
                                paddingLeft: currentGraph?.id === graph.id ? '24px' : '0',
                              }}>
                                {graph.nodeCount} 节点 · {graph.edgeCount} 关系
                              </div>
                            </div>
                            {isLoggedIn && (
                              <DeleteButton
                                onDelete={(e) => handleDeleteGraph(e, project.id, graph)}
                                disabled={isDeleting}
                                ariaLabel={`删除图谱 ${graph.name}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  fontSize: '14px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
                  <div>暂无项目</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    请先创建项目和知识图谱
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* 搜索框 */}
        <div style={{ position: 'relative', flex: '0 0 400px' }}>
          <input
            type="text"
            placeholder={currentGraph ? `搜索 ${currentGraph.name} 中的节点...` : "请先选择一个知识图谱"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            disabled={!currentGraph}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: currentGraph ? themeConfig.inputBackground : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${themeConfig.inputBorder}`,
              borderRadius: '8px',
              color: currentGraph ? themeConfig.inputText : themeConfig.inputPlaceholder,
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              cursor: currentGraph ? 'text' : 'not-allowed',
            }}
            onMouseOver={(e) => {
              if (currentGraph) {
                e.currentTarget.style.background = theme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
              }
            }}
            onMouseOut={(e) => {
              if (currentGraph) {
                e.currentTarget.style.background = themeConfig.inputBackground
                e.currentTarget.style.borderColor = themeConfig.inputBorder
              }
            }}
          />
          
          {/* 搜索结果下拉框 */}
          {showResults && currentGraph && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: theme === 'dark' ? 'rgba(40, 40, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: `1px solid ${themeConfig.panelBorder}`,
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: themeConfig.panelShadow,
              zIndex: 1001,
              transition: 'all 0.3s ease',
            }}>
              {searchResults.length > 0 ? (
                <>
                  {/* 搜索结果头部 */}
                  <div style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${themeConfig.dividerColor}`,
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    找到 {searchResults.length} 个节点
                  </div>
                  
                  {/* 搜索结果列表 */}
                  {searchResults.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node)
                        setSearchQuery('')
                        setShowResults(false)
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${themeConfig.dividerColor}`,
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = theme === 'dark' 
                        ? 'rgba(74, 158, 255, 0.15)' 
                        : 'rgba(74, 158, 255, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ 
                        color: themeConfig.panelText, 
                        fontSize: '14px', 
                        fontWeight: '500',
                        marginBottom: '4px',
                      }}>
                        {node.name}
                      </div>
                      <div style={{ 
                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 
                        fontSize: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}>
                        <span>类型: {node.type}</span>
                        {node.description && (
                          <span style={{ 
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {node.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  fontSize: '14px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                  <div>未找到匹配的节点</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    尝试使用其他关键词搜索
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧按钮区域 - 仅在完整模式下显示 */}
        {mode === 'full' && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 保存按钮 - 仅在完整模式下显示 */}
          {currentGraph && (
            <button
              onClick={handleSavePositions}
              disabled={isSaving || !hasUnsavedChanges}
              style={{
                padding: '10px 18px',
                background: hasUnsavedChanges 
                  ? (isSaving ? 'rgba(255, 193, 7, 0.6)' : 'linear-gradient(135deg, #FFC107 0%, #FFB300 100%)')
                  : 'rgba(128, 128, 128, 0.3)',
                border: hasUnsavedChanges ? '1px solid rgba(255, 193, 7, 0.5)' : '1px solid rgba(128, 128, 128, 0.3)',
                borderRadius: '8px',
                color: hasUnsavedChanges ? 'white' : 'rgba(255, 255, 255, 0.5)',
                cursor: (isSaving || !hasUnsavedChanges) ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: hasUnsavedChanges ? '0 2px 8px rgba(255, 193, 7, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: (isSaving || !hasUnsavedChanges) ? 0.6 : 1,
              }}
              onMouseOver={(e) => {
                if (!isSaving && hasUnsavedChanges) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                if (!isSaving && hasUnsavedChanges) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FFC107 0%, #FFB300 100%)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)'
                }
              }}
              title={
                !hasUnsavedChanges 
                  ? '没有未保存的更改' 
                  : isSaving 
                    ? '正在保存...' 
                    : '保存节点位置'
              }
            >
              {isSaving ? (
                <>
                  <span style={{ 
                    fontSize: '16px',
                    animation: 'spin 1s linear infinite',
                  }}>⟳</span>
                  <span>保存中...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <span style={{ fontSize: '16px' }}>✓</span>
                  <span>已保存</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '16px' }}>💾</span>
                  <span>保存位置</span>
                  {hasUnsavedChanges && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#FF5252',
                      display: 'inline-block',
                      marginLeft: '2px',
                    }} />
                  )}
                </>
              )}
            </button>
          )}
          
          {/* 管理员专属：快速创建按钮 */}
          {isLoggedIn && (
            <button
              onClick={() => router.push('/workflow')}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.background = 'linear-gradient(135deg, #5AA9FF 0%, #4A98FF 100%)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)'
              }}
              title="快速创建二维图谱"
            >
              <span style={{ fontSize: '16px' }}>⚡</span>
              快速创建
            </button>
          )}

          {/* 管理员专属：添加封面按钮 */}
          {isLoggedIn && (
            <button
              onClick={() => setIsCoverModalOpen(true)}
              style={{
                padding: '10px 18px',
                background: '#8b5cf6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.background = '#9333ea'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = '#8b5cf6'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
              }}
            >
              <span style={{ fontSize: '16px' }}>🖼️</span>
              添加封面
            </button>
          )}

          {/* 管理员专属：新建图谱按钮 */}
          {isLoggedIn && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '10px 18px',
                background: '#00bfa5',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 191, 165, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.background = '#00d4b8'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 191, 165, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = '#00bfa5'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 191, 165, 0.3)'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              新建图谱
            </button>
          )}
        </div>
        )}
      </nav>

      {/* 新建项目弹窗 */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
        existingProjects={projects}
      />

      {/* 添加封面弹窗 */}
      <CoverUploadModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        projects={projects}
      />

      {/* 删除确认对话框 */}
      {deleteDialog.type && (
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          entityType={deleteDialog.type}
          entityName={deleteDialog.name || ''}
          stats={deleteDialog.stats}
          isDeleting={isDeleting}
        />
      )}
      
      {/* 添加旋转动画的样式 */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}
