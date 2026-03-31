'use client'

import { useSearchParams } from 'next/navigation'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'
import { useGraphStore } from '@/lib/store'
import { useEffect, useState } from 'react'

// 导航模式类型
type NavigationMode = 'full' | 'readonly'

// 根据来源确定导航模式
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  console.log('🔍 [determineNavigationMode] Full referrer:', referrer)
  
  // 如果没有referrer，默认使用完整模式（可能是刷新页面或直接访问）
  if (!referrer) {
    console.log('🔍 [determineNavigationMode] No referrer, using full mode')
    return 'full'
  }
  
  // 检查是否来自首页相关页面（只读模式）
  const isFromHomepage = 
    referrer === '/' || 
    referrer.endsWith('/') && !referrer.includes('/creation') ||
    referrer.includes('/homepage') ||
    referrer.includes('/gallery')
  
  // 检查是否来自Creation页面（完整模式）
  const isFromCreation = referrer.includes('/creation')
  
  console.log('🔍 [determineNavigationMode] isFromHomepage:', isFromHomepage)
  console.log('🔍 [determineNavigationMode] isFromCreation:', isFromCreation)
  
  // Creation页面优先级更高
  if (isFromCreation) {
    return 'full'
  }
  
  return isFromHomepage ? 'readonly' : 'full'
}

export default function ThreeDEditorPage() {
  const searchParams = useSearchParams()
  const graphId = searchParams.get('graphId')
  const projectId = searchParams.get('projectId')
  const { setCurrentGraph, setCurrentProject, setProjects } = useGraphStore()
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('full')

  // 检测导航来源并设置模式
  useEffect(() => {
    // 获取referrer（来源页面）
    const referrer = document.referrer
    const mode = determineNavigationMode(referrer)
    setNavigationMode(mode)
    
    console.log('🔍 [3DEditorPage] Referrer:', referrer)
    console.log('🔍 [3DEditorPage] Navigation Mode:', mode)
  }, [])

  useEffect(() => {
    if (graphId) {
      // Load graph data from database
      const loadGraphData = async () => {
        try {
          // 如果 URL 中有 projectId，优先使用它
          const effectiveProjectId = projectId
          
          // Fetch the graph details from the API
          const response = await fetch(`/api/graphs/${graphId}`)
          if (response.ok) {
            const data = await response.json()
            const graph = data.graph
            
            // Set the current graph in the store
            setCurrentGraph({
              id: graph.id,
              name: graph.name,
              projectId: graph.projectId,
              nodeCount: graph.nodeCount,
              edgeCount: graph.edgeCount,
              createdAt: graph.createdAt,
            })
            
            // Load the project information - prefer URL projectId, then graph.projectId
            const projectToLoad = effectiveProjectId || graph.projectId
            if (projectToLoad) {
              const projectResponse = await fetch(`/api/projects/${projectToLoad}`)
              if (projectResponse.ok) {
                const projectData = await projectResponse.json()
                const project = projectData.project
                
                // Set the current project
                setCurrentProject({
                  id: project.id,
                  name: project.name,
                  graphs: [graph],
                })
                
                // 保存到 localStorage 以便 TopNavbar 使用
                localStorage.setItem('currentProjectId', project.id)
                localStorage.setItem('currentGraphId', graph.id)
              }
            }
          } else {
            console.error('Failed to load graph:', response.status)
          }
        } catch (error) {
          console.error('Error loading graph data:', error)
        }
      }
      
      loadGraphData()
    }
  }, [graphId, projectId, setCurrentGraph, setCurrentProject, setProjects])

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a1a',
    }}>
      {/* Top Navigation Bar */}
      <TopNavbar mode={navigationMode} />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* 3D Canvas */}
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <KnowledgeGraph />
          {/* 只在完整模式下显示添加按钮 */}
          {navigationMode === 'full' && <FloatingAddButton />}
        </div>

        {/* Node Detail Panel */}
        <NodeDetailPanel />
      </div>
    </div>
  )
}
