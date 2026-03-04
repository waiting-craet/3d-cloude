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
  maxItems?: number      // 最大显示数量，默认12
  columns?: number       // 列数，默认6
  onProjectClick?: (projectId: string) => void
}

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
      
      // 如果不在搜索状态，应用maxItems限制
      if (!isSearching) {
        const limitedProjects = maxItems > 0 
          ? validProjects.slice(0, maxItems)
          : validProjects
        setDisplayProjects(limitedProjects)
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      setError(error instanceof Error ? error.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
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
    
    setDisplayProjects(searchProjects)
  }

  // 清除搜索
  const handleClearSearch = () => {
    setIsSearching(false)
    // 恢复原始的项目列表（应用maxItems限制）
    const limitedProjects = maxItems > 0 
      ? allProjects.slice(0, maxItems)
      : allProjects
    setDisplayProjects(limitedProjects)
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
  }, [maxItems]) // 当maxItems改变时重新获取

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
      )}
    </div>
  )
}