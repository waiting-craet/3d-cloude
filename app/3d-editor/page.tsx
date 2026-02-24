'use client'

import { useSearchParams } from 'next/navigation'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'
import { useGraphStore } from '@/lib/store'
import { useEffect } from 'react'

export default function ThreeDEditorPage() {
  const searchParams = useSearchParams()
  const graphId = searchParams.get('graphId')
  const { setCurrentGraph, setCurrentProject, setProjects } = useGraphStore()

  useEffect(() => {
    if (graphId) {
      // Load graph data from database
      const loadGraphData = async () => {
        try {
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
            
            // Also load the project information
            if (graph.projectId) {
              const projectResponse = await fetch(`/api/projects/${graph.projectId}`)
              if (projectResponse.ok) {
                const projectData = await projectResponse.json()
                const project = projectData.project
                
                // Set the current project
                setCurrentProject({
                  id: project.id,
                  name: project.name,
                  graphs: [graph],
                })
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
  }, [graphId, setCurrentGraph, setCurrentProject, setProjects])

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a1a',
    }}>
      {/* Top Navigation Bar */}
      <TopNavbar />

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
          <FloatingAddButton />
        </div>

        {/* Node Detail Panel */}
        <NodeDetailPanel />
      </div>
    </div>
  )
}
