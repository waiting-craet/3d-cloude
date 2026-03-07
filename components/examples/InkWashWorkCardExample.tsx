/**
 * InkWashWorkCard Example Usage
 * 
 * This file demonstrates how to use the InkWashWorkCard component
 * in the homepage redesign.
 */

import React from 'react'
import { InkWashWorkCard } from '../InkWashWorkCard'
import { useRouter } from 'next/navigation'

export const InkWashWorkCardExample: React.FC = () => {
  const router = useRouter()

  // Example project data
  const exampleProject = {
    id: '1',
    name: '知识图谱示例',
    description: '这是一个示例项目',
    graphs: [
      {
        id: 'g1',
        name: '图谱1',
        nodeCount: 10,
        edgeCount: 15,
      },
      {
        id: 'g2',
        name: '图谱2',
        nodeCount: 20,
        edgeCount: 25,
      },
    ],
  }

  // Handle card click - navigate to project's first graph
  const handleCardClick = (projectId: string) => {
    const project = exampleProject
    if (project.graphs && project.graphs.length > 0) {
      // Navigate to the first graph in the project
      router.push(`/graph?id=${project.graphs[0].id}`)
    } else {
      // Navigate to project page if no graphs
      router.push(`/project/${projectId}`)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '400px' }}>
      <h2>InkWashWorkCard Example</h2>
      <InkWashWorkCard project={exampleProject} onClick={handleCardClick} />
    </div>
  )
}

export default InkWashWorkCardExample
