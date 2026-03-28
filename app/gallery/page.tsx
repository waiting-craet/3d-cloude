'use client'

import { useState } from 'react'
import GalleryTopNavbar from '@/components/GalleryTopNavbar'
import FilterBar from '@/components/gallery/FilterBar'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { FilterType } from '@/lib/types/homepage-gallery'

export default function GalleryPage() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark')
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])

  const handleThemeToggle = () => {
    setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  const handleFilterChange = (filters: FilterType[]) => {
    setActiveFilters(filters)
  }

  const handleCreateClick = () => {
    console.log('开始创作')
  }

  const handleCommunityClick = () => {
    console.log('社区')
  }

  return (
    <div
      style={{
        background: currentTheme === 'dark'
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
        minHeight: '100vh',
        transition: 'background 0.3s ease',
      }}
    >
      {/* 导航栏 */}
      <GalleryTopNavbar
        currentTheme={currentTheme}
        onThemeToggle={handleThemeToggle}
        onCreateClick={handleCreateClick}
        onCommunityClick={handleCommunityClick}
      />

      {/* 主内容区域 */}
      <div
        style={{
          paddingTop: '70px',
          minHeight: '100vh',
        }}
      >
        {/* 筛选栏 */}
        <div
          style={{
            padding: '20px 30px',
            borderBottom: currentTheme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            background: currentTheme === 'dark'
              ? 'rgba(20, 20, 20, 0.5)'
              : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <FilterBar
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            theme={currentTheme}
          />
        </div>

        {/* 广场网格 */}
        <div
          style={{
            padding: '30px',
          }}
        >
          <GalleryGrid
            filters={activeFilters}
            theme={currentTheme}
          />
        </div>
      </div>
    </div>
  )
}
