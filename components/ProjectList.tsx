'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProjectCard, { Project } from './ProjectCard'
import GraphList from './GraphList'
import ProjectSearch, { SearchResult } from './ProjectSearch'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import styles from './ProjectList.module.css'

// API响应类型
interface ProjectsResponse {
  projects: Project[]
}

// 项目列表组件属性
export interface ProjectListProps {
  maxItems?: number      // 最大显示数量，默认12（已废弃，使用分页）
  columns?: number       // 列数，默认6
  onProjectClick?: (projectId: string) => void
}

// 分页配置
const ITEMS_PER_PAGE = 18 // 每页显示 18 个项目（3行 × 6列）

export default function ProjectList({ 
  maxItems = 12, 
  columns = 6,
  onProjectClick 
}: ProjectListProps) {
  const router = useRouter()
  const [allProjects, setAllProjects] = useState<Project[]>([]) // 所有项目
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]) // 显示的项目
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  
  // 图谱列表状态
  const [showGraphs, setShowGraphs] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // 获取项目数据
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ProjectsResponse = await response.json()
      
      // 验证数据并过滤无效项目
      const validProjects = data.projects.filter(project => 
        project && 
        project.id && 
        project.name && 
        typeof project.graphCount === 'number'
      )
      
      setAllProjects(validProjects)
      
      // 计算总页数
      const pages = Math.ceil(validProjects.length / ITEMS_PER_PAGE)
      setTotalPages(pages)
      
      // 如果不在搜索状态，应用分页
      if (!isSearching) {
        updateDisplayProjects(validProjects, 1)
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      setError(error instanceof Error ? error.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新显示的项目（根据当前页）
  const updateDisplayProjects = (projects: Project[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setDisplayProjects(projects.slice(startIndex, endIndex))
    setCurrentPage(page)
  }

  // 处理搜索结果
  const handleSearchResults = async (results: SearchResult[]) => {
    setIsSearching(true)
    
    // 获取搜索结果中涉及的项目ID
    const projectIds = [...new Set(results.map(r => r.projectId))]
    
    // 从所有项目中筛选出搜索结果对应的项目
    const searchProjects = allProjects.filter(project => 
      projectIds.includes(project.id)
    )
    
    // 搜索模式下也使用分页
    const pages = Math.ceil(searchProjects.length / ITEMS_PER_PAGE)
    setTotalPages(pages)
    updateDisplayProjects(searchProjects, 1)
  }

  // 清除搜索
  const handleClearSearch = () => {
    setIsSearching(false)
    // 恢复原始的项目列表（应用分页）
    const pages = Math.ceil(allProjects.length / ITEMS_PER_PAGE)
    setTotalPages(pages)
    updateDisplayProjects(allProjects, 1)
  }

  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    
    const projectsToDisplay = isSearching 
      ? allProjects.filter(project => {
          // 重新应用搜索过滤（简化版）
          return true // 实际应该保存搜索结果
        })
      : allProjects
    
    updateDisplayProjects(projectsToDisplay, page)
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 处理项目点击 - 显示图谱列表
  const handleProjectClick = (projectId: string) => {
    if (onProjectClick) {
      onProjectClick(projectId)
    } else {
      // 找到被点击的项目
      const project = allProjects.find(p => p.id === projectId)
      if (project) {
        setSelectedProject(project)
        setShowGraphs(true)
      }
    }
  }

  // 处理返回项目列表
  const handleBackToProjects = () => {
    setShowGraphs(false)
    setSelectedProject(null)
  }

  // 处理图谱点击 - 导航到3D编辑器
  const handleGraphClick = (graphId: string) => {
    if (selectedProject) {
      router.push(`/3d-editor?projectId=${selectedProject.id}&graphId=${graphId}`)
    }
  }

  // 重试加载
  const handleRetry = () => {
    fetchProjects()
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchProjects()
  }, []) // 移除 maxItems 依赖

  // 渲染分页按钮
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 7 // 最多显示7个页码

    let startPage = Math.max(1, currentPage - 3)
    let endPage = Math.min(totalPages, currentPage + 3)

    // 调整显示范围以保持最多7个页码
    if (endPage - startPage < maxVisiblePages - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
    }

    // 添加第一页
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={styles.pageButton}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pageNumbers.push(<span key="ellipsis1" className={styles.ellipsis}>...</span>)
      }
    }

    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${i === currentPage ? styles.active : ''}`}
        >
          {i}
        </button>
      )
    }

    // 添加最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="ellipsis2" className={styles.ellipsis}>...</span>)
      }
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={styles.pageButton}
        >
          {totalPages}
        </button>
      )
    }

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.navButton}
        >
          上一页
        </button>
        
        <div className={styles.pageNumbers}>
          {pageNumbers}
        </div>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.navButton}
        >
          下一页
        </button>
      </div>
    )
  }

  // 如果显示图谱列表
  if (showGraphs && selectedProject) {
    return (
      <GraphList
        projectId={selectedProject.id}
        projectName={selectedProject.name}
        maxItems={maxItems}
        columns={columns}
        onBack={handleBackToProjects}
        onGraphClick={handleGraphClick}
      />
    )
  }

  // 渲染加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage 
          message={error}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  // 渲染项目列表（包含搜索）
  return (
    <div className={styles.container}>
      {/* 搜索组件 */}
      <ProjectSearch
        onSearchResults={handleSearchResults}
        onClear={handleClearSearch}
      />
      
      {/* 搜索状态提示 */}
      {isSearching && displayProjects.length > 0 && (
        <div className={styles.searchInfo}>
          找到 {displayProjects.length} 个相关项目
        </div>
      )}
      
      {/* 空状态 */}
      {displayProjects.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {isSearching ? '🔍' : '📊'}
          </div>
          <h3 className={styles.emptyTitle}>
            {isSearching ? '未找到相关项目' : '暂无项目'}
          </h3>
          <p className={styles.emptyDescription}>
            {isSearching 
              ? '尝试使用其他关键词搜索，或清除搜索查看所有项目'
              : '还没有创建任何项目，点击"开始创作"来创建你的第一个项目吧！'
            }
          </p>
        </div>
      )}

      {/* 项目网格 */}
      {displayProjects.length > 0 && (
        <>
          <div 
            className={styles.projectGrid}
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`
            }}
          >
            {displayProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleProjectClick}
              />
            ))}
          </div>
          
          {/* 分页控件 */}
          {renderPagination()}
        </>
      )}
    </div>
  )
}