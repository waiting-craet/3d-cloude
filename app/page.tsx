'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BANNER_IMAGE_URL } from '@/lib/config/banner'
import GalleryTopNavbar from '@/components/GalleryTopNavbar'
import FilterBar from '@/components/gallery/FilterBar'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { FilterType } from '@/lib/types/homepage-gallery'

const THEME = 'light'

export default function Home() {
  const router = useRouter()
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])
  const [bannerImageError, setBannerImageError] = useState(false)

  const handleFilterChange = (filters: FilterType[]) => {
    setActiveFilters(filters)
  }

  const handleCreateClick = () => {
    router.push('/creation')
  }

  const handleCommunityClick = () => {
    console.log('Community')
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Navigation Bar */}
      <GalleryTopNavbar
        currentTheme={THEME}
        onThemeToggle={() => {}}
        onCreateClick={handleCreateClick}
        onCommunityClick={handleCommunityClick}
      />

      {/* Top Visual Banner Area */}
      <div
        style={{
          width: '100%',
          height: '400px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Banner Image */}
        {!bannerImageError && (
          <img
            src={BANNER_IMAGE_URL}
            alt="Knowledge Graph Gallery"
            onError={() => setBannerImageError(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              margin: 0,
              padding: 0,
            }}
          />
        )}

        {/* Decorative Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
            opacity: 0.85,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 470px)',
        }}
      >
        {/* Filter Bar */}
        <div
          style={{
            padding: '20px 30px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <FilterBar
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            theme={THEME}
          />
        </div>

        {/* Gallery Grid */}
        <div
          style={{
            padding: '30px',
          }}
        >
          <GalleryGrid
            filters={activeFilters}
            theme={THEME}
          />
        </div>
      </div>
    </div>
  )
}
