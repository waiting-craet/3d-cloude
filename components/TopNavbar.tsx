'use client'

import { useState, useEffect, useRef } from 'react'
import { useGraphStore } from '@/lib/store'
import LoginModal from './LoginModal'
import CreateProjectModal from './CreateProjectModal'

export default function TopNavbar() {
  const { 
    nodes, 
    projects, 
    currentProject, 
    currentGraph,
    setProjects,
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

  // 实时搜索节点
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = nodes.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery, nodes])

  // 页面加载时恢复状态
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('isAdmin')
    const savedUsername = localStorage.getItem('adminUsername')
    if (savedIsAdmin === 'true' && savedUsername) {
      setIsAdmin(true)
      setAdminUsername(savedUsername)
    }

    // 加载项目数据
    const savedProjects = localStorage.getItem('projects')
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects)
      setProjects(parsedProjects)
      
      // 恢复当前项目和图谱
      const currentProjectId = localStorage.getItem('currentProjectId')
      const currentGraphId = localStorage.getItem('currentGraphId')
      if (currentProjectId && currentGraphId) {
        switchGraph(currentProjectId, currentGraphId)
      }
    }
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

  const handleCreateProject = (projectName: string, graphName: string, isNewProject: boolean) => {
    if (isNewProject) {
      createProject(projectName, graphName)
    } else {
      // 添加到现有项目
      const project = projects.find(p => p.name === projectName)
      if (project) {
        addGraphToProject(project.id, graphName)
      }
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
                      onClick={() => toggleProject(project.id)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSwitchGraph(project.id, graph.id)
                            }}
                            style={{
                              padding: '12px 16px 12px 48px',
                              cursor: 'pointer',
                              background: currentGraph?.id === graph.id 
                                ? 'rgba(74, 158, 255, 0.2)' 
                                : 'transparent',
                              transition: 'background 0.2s',
                              borderLeft: currentGraph?.id === graph.id 
                                ? '3px solid #4A9EFF' 
                                : '3px solid transparent',
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
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          />
          
          {/* 搜索结果下拉框 */}
          {showResults && searchResults.length > 0 && (
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
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(74, 158, 255, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    {node.name}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px' }}>
                    类型: {node.type}
                  </div>
                </div>
              ))}
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
    </>
  )
}
