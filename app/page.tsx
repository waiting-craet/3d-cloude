'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import LoginModal from '@/components/LoginModal'
import PaperNavbar from '@/components/PaperNavbar'
import PaperHeroSection from '@/components/PaperHeroSection'
import { PaperGallerySection } from '@/components/PaperGallerySection'
import { PaperWorkGrid } from '@/components/PaperWorkGrid'
import PaperWorkCard from '@/components/PaperWorkCard'
import GraphCard from '@/components/GraphCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import PaperFooter from '@/components/PaperFooter'
import Pagination from '@/components/Pagination'
import { useUserStore } from '@/lib/userStore'

// Project type definition
interface Project {
  id: string
  name: string
  description?: string
  graphCount: number
  createdAt: string
  updatedAt: string
  userId: string
  graphs?: Array<{
    id: string
    name: string
    nodeCount: number
    edgeCount: number
  }>
}

// Graph type definition
interface Graph {
  id: string
  name: string
  description?: string
  nodeCount: number
  edgeCount: number
  createdAt: string
  updatedAt: string
}

// API response type
interface ProjectsResponse {
  projects: Project[]
}

// Graphs API response type
interface GraphsResponse {
  graphs: Graph[]
}

export default function LandingPage() {
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View state management
  const [viewMode, setViewMode] = useState<'gallery' | 'projectGraphs'>('gallery')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [graphs, setGraphs] = useState<Graph[]>([])
  const [graphsLoading, setGraphsLoading] = useState(false)
  const [graphsError, setGraphsError] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const { isLoggedIn, logout, initializeFromStorage } = useUserStore()

  // 页面加载时恢复登录状态
  useEffect(() => {
    initializeFromStorage()
  }, [initializeFromStorage])

  // 监听登录状态变化
  useEffect(() => {
    const handleLoginStateChange = () => {
      initializeFromStorage()
    }

    window.addEventListener('loginStateChange', handleLoginStateChange)
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange)
    }
  }, [initializeFromStorage])

  // Fetch projects data for statistics and gallery
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ProjectsResponse = await response.json()
        
        // Validate and filter invalid projects
        const validProjects = data.projects.filter(project => 
          project && 
          project.id && 
          project.name && 
          typeof project.graphCount === 'number'
        )
        
        setProjects(validProjects)
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleStartCreating = useCallback(() => {
    if (!isLoggedIn) {
      // 未登录时提示用户先登录
      alert('请先登录后再开始创作')
      setIsLoginModalOpen(true)
      return
    }
    
    try {
      router.push('/creation')
    } catch (error) {
      console.error('Navigation failed:', error)
      window.location.href = '/creation'
    }
  }, [isLoggedIn, router])

  const handleLogin = useCallback(() => {
    setIsLoginModalOpen(true)
  }, [])

  const handleProjectClick = useCallback((projectId: string) => {
    // Find the selected project
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      console.error('Project not found:', projectId)
      return
    }

    // Switch to project graphs view
    setSelectedProject(project)
    setViewMode('projectGraphs')
    setCurrentPage(1) // Reset to first page
    
    // Fetch graphs for this project
    fetchProjectGraphs(projectId)
  }, [projects])

  // Fetch graphs for a specific project
  const fetchProjectGraphs = useCallback(async (projectId: string) => {
    try {
      setGraphsLoading(true)
      setGraphsError(null)
      
      const response = await fetch(`/api/projects/${projectId}/graphs`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: GraphsResponse = await response.json()
      setGraphs(data.graphs || [])
    } catch (error) {
      console.error('Failed to fetch graphs:', error)
      setGraphsError(error instanceof Error ? error.message : 'Failed to fetch graphs')
    } finally {
      setGraphsLoading(false)
    }
  }, [])

  // Return to gallery view
  const handleBackToGallery = useCallback(() => {
    setViewMode('gallery')
    setSelectedProject(null)
    setGraphs([])
    setGraphsError(null)
    setSearchQuery('') // Clear search when going back
    setCurrentPage(1) // Reset to first page
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  // Retry loading projects
  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  // Display only first 12 projects in gallery (memoized)
  const displayProjects = useCallback(() => {
    let filtered = projects
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      )
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return {
      items: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    }
  }, [projects, searchQuery, currentPage])()

  // Filter graphs based on search query
  const displayGraphs = useCallback(() => {
    let filtered = graphs
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(graph => 
        graph.name.toLowerCase().includes(query) ||
        (graph.description && graph.description.toLowerCase().includes(query))
      )
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return {
      items: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    }
  }, [graphs, searchQuery, currentPage])()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <main style={{
        flex: '1',
        color: '#333'
      }}>
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-content" 
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          padding: '1rem',
          background: '#6b8e85',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '1rem';
          e.currentTarget.style.top = '1rem';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
        }}
      >
        跳转到主内容
      </a>

      {/* Paper Navigation Bar */}
      <PaperNavbar
        isLoggedIn={isLoggedIn}
        onStartCreating={handleStartCreating}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Add padding to account for fixed navbar */}
      <div id="main-content" style={{ 
        paddingTop: '64px',
        background: 'linear-gradient(135deg, #e8f0ed 0%, #d4e4df 100%)'
      }}>
        {/* Hero Section */}
        <PaperHeroSection
          title="智构红图·科技赋能文化浸润"
          subtitle="新疆红色文化三维知识图谱创新平台"
          onSearch={handleSearch}
        />

        {/* Gallery Section */}
        <PaperGallerySection 
          heading={viewMode === 'gallery' ? '推荐广场' : `${selectedProject?.name}项目中的知识图谱`}
        >
          {/* Search results info */}
          {searchQuery.trim() && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(107, 142, 133, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#6b8e85', fontSize: '14px' }}>
                搜索 "{searchQuery}" 找到 {viewMode === 'gallery' ? displayProjects.totalItems : displayGraphs.totalItems} 个结果
              </span>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  color: '#6b8e85',
                  border: '1px solid #6b8e85',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                aria-label="清除搜索"
              >
                清除
              </button>
            </div>
          )}

          {/* Back button for project graphs view */}
          {viewMode === 'projectGraphs' && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleBackToGallery}
                style={{
                  padding: '8px 16px',
                  background: '#6b8e85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                aria-label="返回推荐广场"
              >
                ← 返回推荐广场
              </button>
            </div>
          )}

          {/* Gallery View - Show Projects */}
          {viewMode === 'gallery' && (
            <>
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <LoadingSpinner />
                </div>
              )}

              {error && (
                <div style={{ padding: '60px 0' }}>
                  <ErrorMessage message={error} onRetry={handleRetry} />
                </div>
              )}

              {!loading && !error && displayProjects.items.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666'
                }}>
                  <div 
                    style={{ fontSize: '48px', marginBottom: '16px' }}
                    role="img"
                    aria-label="图表图标"
                  >
                    📊
                  </div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333333' }}>
                    {searchQuery.trim() ? '未找到匹配的项目' : '暂无项目'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#999999' }}>
                    {searchQuery.trim() ? '尝试使用其他关键词搜索' : '还没有创建任何项目，点击"开始创作"来创建你的第一个项目吧！'}
                  </p>
                </div>
              )}

              {!loading && !error && displayProjects.items.length > 0 && (
                <>
                  <PaperWorkGrid columns={4} gap="20px">
                    {displayProjects.items.map(project => (
                      <PaperWorkCard
                        key={project.id}
                        project={project}
                        onClick={handleProjectClick}
                      />
                    ))}
                  </PaperWorkGrid>
                  
                  {/* Pagination for projects */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={displayProjects.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </>
          )}

          {/* Project Graphs View - Show Graphs */}
          {viewMode === 'projectGraphs' && (
            <>
              {graphsLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <LoadingSpinner />
                </div>
              )}

              {graphsError && (
                <div style={{ padding: '60px 0' }}>
                  <ErrorMessage 
                    message={graphsError} 
                    onRetry={() => selectedProject && fetchProjectGraphs(selectedProject.id)} 
                  />
                </div>
              )}

              {!graphsLoading && !graphsError && displayGraphs.items.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666'
                }}>
                  <div 
                    style={{ fontSize: '48px', marginBottom: '16px' }}
                    role="img"
                    aria-label="图谱图标"
                  >
                    🗺️
                  </div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333333' }}>
                    {searchQuery.trim() ? '未找到匹配的图谱' : '该项目还没有创建任何图谱'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#999999' }}>
                    {searchQuery.trim() ? '尝试使用其他关键词搜索' : '点击"开始创作"来创建第一个知识图谱吧！'}
                  </p>
                </div>
              )}

              {!graphsLoading && !graphsError && displayGraphs.items.length > 0 && (
                <>
                  <PaperWorkGrid columns={4} gap="20px">
                    {displayGraphs.items.map(graph => (
                      <GraphCard
                        key={graph.id}
                        graph={{
                          id: graph.id,
                          name: graph.name,
                          description: graph.description || null,
                          nodeCount: graph.nodeCount,
                          edgeCount: graph.edgeCount,
                          createdAt: new Date(graph.createdAt),
                          updatedAt: new Date(graph.updatedAt),
                          projectId: selectedProject?.id || '',
                        }}
                        onClick={(graphId) => router.push(`/graph?graphId=${graphId}&from=homepage`)}
                      />
                    ))}
                  </PaperWorkGrid>
                  
                  {/* Pagination for graphs */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={displayGraphs.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </>
          )}
        </PaperGallerySection>
      </div>
    </main>

      {/* Footer */}
      <PaperFooter />

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  )
}
