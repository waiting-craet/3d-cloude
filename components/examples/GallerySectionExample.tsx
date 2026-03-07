import React from 'react'
import { GallerySection } from '../GallerySection'
import { WorkCardGrid } from '../WorkCardGrid'
import { InkWashWorkCard } from '../InkWashWorkCard'

/**
 * Example usage of GallerySection component
 * 
 * This example demonstrates how to use the GallerySection component
 * to wrap a WorkCardGrid with work cards.
 */
export function GallerySectionExample() {
  // Example project data
  const projects = [
    {
      id: '1',
      name: '知识图谱示例 1',
      description: '这是一个示例知识图谱',
      graphCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user1',
    },
    {
      id: '2',
      name: '知识图谱示例 2',
      description: '另一个示例知识图谱',
      graphCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user1',
    },
    // Add more projects as needed
  ]

  const handleCardClick = (projectId: string) => {
    console.log('Clicked project:', projectId)
    // Navigate to project or show project details
  }

  return (
    <GallerySection heading="推荐广场">
      <WorkCardGrid>
        {projects.map((project) => (
          <InkWashWorkCard
            key={project.id}
            project={project}
            onClick={handleCardClick}
          />
        ))}
      </WorkCardGrid>
    </GallerySection>
  )
}
