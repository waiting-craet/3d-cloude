'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import LoginModal from '@/components/LoginModal'
import InkWashNavbar from '@/components/InkWashNavbar'
import HeroSection from '@/components/HeroSection'
import StatisticsDisplay from '@/components/StatisticsDisplay'
import { GallerySection } from '@/components/GallerySection'
import { WorkCardGrid } from '@/components/WorkCardGrid'
import InkWashWorkCard from '@/components/InkWashWorkCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
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

// API response type
interface ProjectsResponse {
  projects: Project[]
}

export default function LandingPage() {
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // Navigate to project's graph list
    router.push(`/project/${projectId}`)
  }, [router])

  const handleSearch = useCallback((query: string) => {
    // TODO: Implement search functionality
    console.log('Search query:', query)
  }, [])

  // Retry loading projects
  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  // Calculate statistics from projects data (memoized to avoid recalculation)
  const statistics = useCallback(() => ({
    projectsCount: projects.length,
    knowledgeGraphsCount: projects.reduce((sum, p) => sum + p.graphCount, 0),
    totalGraphsCount: projects.reduce((sum, p) => sum + p.graphCount, 0),
  }), [projects])()

  // Display only first 12 projects in gallery (memoized)
  const displayProjects = useCallback(() => projects.slice(0, 12), [projects])()

  return (
    <main style={{
      minHeight: '100vh',
      background: '#fafafa',
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
          background: '#5a9a8f',
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

      {/* Ink-Wash Navigation Bar */}
      <InkWashNavbar
        isLoggedIn={isLoggedIn}
        onStartCreating={handleStartCreating}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Add padding to account for fixed navbar */}
      <div id="main-content" style={{ paddingTop: '70px' }}>
        {/* Hero Section */}
        <HeroSection
          title="构建与发现知识的无尽脉络"
          subtitle="在这里，每一个想法都能找到它的位置，每一条知识都能连接成网络"
          onSearch={handleSearch}
        />

        {/* Statistics Display */}
        {!loading && !error && (
          <StatisticsDisplay
            projectsCount={statistics.projectsCount}
            knowledgeGraphsCount={statistics.knowledgeGraphsCount}
            totalGraphsCount={statistics.totalGraphsCount}
          />
        )}

        {/* Gallery Section */}
        <GallerySection heading="推荐广场">
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

          {!loading && !error && displayProjects.length === 0 && (
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
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#2c2c2c' }}>
                暂无项目
              </h3>
              <p style={{ fontSize: '14px', color: '#737373' }}>
                还没有创建任何项目，点击"开始创作"来创建你的第一个项目吧！
              </p>
            </div>
          )}

          {!loading && !error && displayProjects.length > 0 && (
            <WorkCardGrid columns={6} gap="24px">
              {displayProjects.map(project => (
                <InkWashWorkCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </WorkCardGrid>
          )}
        </GallerySection>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  )
}
