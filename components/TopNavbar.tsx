'use client'

import { useState, useEffect, useRef } from 'react'
import { useGraphStore } from '@/lib/store'
import LoginModal from './LoginModal'
import CreateProjectModal from './CreateProjectModal'
import DeleteButton from './DeleteButton'
import DeleteConfirmDialog from './DeleteConfirmDialog'

export default function TopNavbar() {
  const { 
    nodes, 
    projects, 
    currentProject, 
    currentGraph,
    setProjects,
    setSelectedNode,
    createProject,
    addGraphToProject,
    switchGraph,
  } = useGraphStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  
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
    const savedIsAdmin = localStorage.getItem('isAdmin')
    const savedUsername = localStorage.getItem('adminUsername')
    console.log('=== 管理员状态检查 ===')
    console.log('savedIsAdmin:', savedIsAdmin)
    console.log('savedUsername:', savedUsername)
    if (savedIsAdmin === 'true' && savedUsername) {
      setIsAdmin(true)
      setAdminUsername(savedUsername)
      console.log('✓ 管理员状态已恢复')
    } else {
      console.log('✗ 未检测到管理员状态')
    }

    // 从数据库加载项目数据（使用优化的 API）
    const loadProjects = async () => {
      try {
        console.log('正在从数据库加载项目...')
        const res = await fetch('/api/projects/with-graphs')
        if (res.ok) {
          const data = await res.json()
          const projects = data.projects || []
          
          console.log('加载到的项目数:', projects.length)
          
          setProjects(projects)
          
          // 检查localStorage中的ID是否有效
          const currentProjectId = localStorage.getItem('currentProjectId')
          const currentGraphId = localStorage.getItem('currentGraphId')
          
          // 验证ID是否是真实的数据库ID（cuid格式）
          const isValidId = (id: string | null) => id && id.startsWith('cmk')
          
          if (isValidId(currentProjectId) && isValidId(currentGraphId)) {
            // 验证项目和图谱是否存在
            const project = projects.find((p: any) => p.id === currentProjectId)
            const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
            
            if (project && graph) {
              console.log('恢复上次选择的图谱:', graph.name)
              switchGraph(currentProjectId!, currentGraphId!)
            } else {
              console.log('上次选择的图谱不存在，清理localStorage')
              localStorage.removeItem('currentProjectId')
              localStorage.removeItem('currentGraphId')
            }
          } else {
            // 清理旧的本地ID
            console.log('检测到旧的本地ID，清理localStorage')
            localStorage.removeItem('currentProjectId')
            localStorage.removeItem('currentGraphId')
            localStorage.removeItem('projects')
          }
        }
      } catch (error) {
        console.error('加载项目失败:', error)
      }
    }
    
    loadProjects()
  }, [setProjects, switchGraph])

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

  const handleLogin = (username: string, password: string) => {
    setIsAdmin(true)
    setAdminUsername(username)
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminUsername', username)
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new Event('loginStateChange'))
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setAdminUsername('')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminUsername')
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new Event('loginStateChange'))
  }

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
    try {
      const endpoint =
        deleteDialog.type === 'project'
          ? `/api/projects/${deleteDialog.id}`
          : `/api/graphs/${deleteDialog.id}`

      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '删除失败')
      }

      // 显示成功消息
      alert(
        `成功删除 ${deleteDialog.name}！\n删除了 ${data.deletedNodeCount} 个节点和 ${data.deletedEdgeCount} 条边`
      )

      // 关闭对话框
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: null,
        name: null,
        stats: { nodeCount: 0, edgeCount: 0 },
      })

      // 如果删除的是当前选中的项目或图谱，清理localStorage并刷新页面
      if (deleteDialog.type === 'project' && currentProject?.id === deleteDialog.id) {
        localStorage.removeItem('currentProjectId')
        localStorage.removeItem('currentGraphId')
        window.location.reload()
        return
      } else if (deleteDialog.type === 'graph' && currentGraph?.id === deleteDialog.id) {
        localStorage.removeItem('currentGraphId')
        window.location.reload()
        return
      }

      // 记住当前展开的项目ID（如果删除的是图谱）
      const expandedProjectId = deleteDialog.type === 'graph' ? hoveredProjectId : null

      // 重新加载项目列表（使用重试机制确保获取最新数据）
      let retryCount = 0
      const maxRetries = 3
      let projectsLoaded = false

      while (retryCount < maxRetries && !projectsLoaded) {
        // 添加短暂延迟，让数据库有时间同步
        if (retryCount > 0) {
          console.log(`⏳ 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }

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
          
          // 验证删除是否成功（检查被删除的项目/图谱是否还存在）
          if (deleteDialog.type === 'project') {
            const stillExists = projects.some((p: any) => p.id === deleteDialog.id)
            if (!stillExists) {
              // 删除成功，更新状态
              setProjects(projects)
              projectsLoaded = true
              console.log('✅ 项目删除成功，列表已更新')
            }
          } else if (deleteDialog.type === 'graph') {
            const project = projects.find((p: any) => 
              p.graphs.some((g: any) => g.id === deleteDialog.id)
            )
            if (!project) {
              // 删除成功，更新状态
              setProjects(projects)
              projectsLoaded = true
              console.log('✅ 图谱删除成功，列表已更新')
              
              // 如果删除的是图谱，保持项目展开状态
              if (expandedProjectId) {
                setHoveredProjectId(expandedProjectId)
              }
            }
          }
        }
        
        retryCount++
      }

      // 如果重试后仍未成功，强制刷新页面
      if (!projectsLoaded) {
        console.log('⚠️ 重试后仍未获取最新数据，强制刷新页面')
        window.location.reload()
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
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
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px',
        gap: '20px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      }}>
        {/* 左侧：现有图谱下拉菜单 */}
        <div ref={projectMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            style={{
              padding: '8px 16px',
              background: showProjectMenu ? 'rgba(74, 158, 255, 0.15)' : 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#ffffff',
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
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
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
                color: 'rgba(255, 255, 255, 0.6)', 
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
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
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
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: hoveredProjectId === project.id 
                          ? 'rgba(74, 158, 255, 0.1)' 
                          : 'transparent',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseOver={(e) => {
                        if (hoveredProjectId !== project.id) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
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
                          color: 'rgba(255, 255, 255, 0.6)',
                          transform: hoveredProjectId === project.id ? 'rotate(90deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                        }}>
                          ▶
                        </span>
                        <div>
                          <div style={{ 
                            color: 'white', 
                            fontSize: '15px', 
                            fontWeight: '600',
                            marginBottom: '2px',
                          }}>
                            📁 {project.name}
                          </div>
                          <div style={{ 
                            color: 'rgba(255, 255, 255, 0.5)', 
                            fontSize: '12px',
                          }}>
                            {project.graphs.length} 个图谱
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
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
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      }}>
                        {project.graphs.map((graph) => (
                          <div
                            key={graph.id}
                            style={{
                              padding: '12px 16px 12px 48px',
                              background: currentGraph?.id === graph.id 
                                ? 'rgba(74, 158, 255, 0.2)' 
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
                                e.currentTarget.style.background = 'rgba(74, 158, 255, 0.1)'
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
                                color: 'white', 
                                fontSize: '14px', 
                                fontWeight: '500',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}>
                                {currentGraph?.id === graph.id && (
                                  <span style={{ color: '#4A9EFF', fontSize: '16px' }}>✓</span>
                                )}
                                <span>{graph.name}</span>
                              </div>
                              <div style={{ 
                                color: 'rgba(255, 255, 255, 0.5)', 
                                fontSize: '12px',
                                paddingLeft: currentGraph?.id === graph.id ? '24px' : '0',
                              }}>
                                {graph.nodeCount} 节点 · {graph.edgeCount} 关系
                              </div>
                            </div>
                            {isAdmin && (
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
                  color: 'rgba(255, 255, 255, 0.5)',
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
              background: currentGraph ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: currentGraph ? 'white' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              cursor: currentGraph ? 'text' : 'not-allowed',
            }}
            onMouseOver={(e) => {
              if (currentGraph) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
              }
            }}
            onMouseOut={(e) => {
              if (currentGraph) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
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
              background: 'rgba(40, 40, 40, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
            }}>
              {searchResults.length > 0 ? (
                <>
                  {/* 搜索结果头部 */}
                  <div style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.6)',
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
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(74, 158, 255, 0.15)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ 
                        color: 'white', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        marginBottom: '4px',
                      }}>
                        {node.name}
                      </div>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.5)', 
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
                  color: 'rgba(255, 255, 255, 0.5)',
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

        {/* 右侧按钮区域 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 管理员专属：新建图谱按钮 */}
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
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
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              新建图谱
            </button>
          )}

          {/* 登录/登出按钮 */}
          {!isAdmin ? (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)'
              }}
            >
              登录
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 管理员信息 */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(74, 158, 255, 0.15)',
                border: '1px solid rgba(74, 158, 255, 0.3)',
                borderRadius: '8px',
                color: '#4A9EFF',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                👤 {adminUsername}
              </div>
              
              {/* 登出按钮 */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
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
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.color = 'white'
                }}
              >
                登出
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* 新建项目弹窗 */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
        existingProjects={projects}
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
    </>
  )
}
