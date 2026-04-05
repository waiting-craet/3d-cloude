'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterType } from '@/lib/types/homepage-gallery'
import UIIcon from '../UIIcon'

interface FilterBarProps {
  activeFilters?: FilterType[]
  onFilterChange?: (filters: FilterType[]) => void
  theme?: 'light' | 'dark'
}

function FilterBarContent({
  activeFilters = [],
  onFilterChange,
  theme = 'dark',
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterType[]>(activeFilters)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  const themeConfig = {
    background: 'rgba(255, 255, 255, 0.98)',
    border: 'rgba(0, 0, 0, 0.08)',
    text: '#1a1a1a',
    buttonBackground: 'rgba(0, 0, 0, 0.04)',
    buttonHover: 'rgba(0, 0, 0, 0.08)',
    activeButtonBackground: 'rgba(102, 126, 234, 0.1)',
    activeButtonBorder: 'rgba(102, 126, 234, 0.4)',
  }

  // 检查是否为移动设备
  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 从 URL 查询参数恢复筛选状态
  useEffect(() => {
    if (!mounted) return
    const filterParam = searchParams.get('filter')
    if (filterParam) {
      const filterList = filterParam.split(',') as FilterType[]
      setFilters(filterList)
    }
  }, [searchParams, mounted])

  const filterOptions: Array<{ value: FilterType; label: string; icon: 'target' | 'chart' | 'star' }> = [
    { value: '3d', label: '3D 图谱', icon: 'target' },
    { value: '2d', label: '2D 图谱', icon: 'chart' },
    { value: 'template', label: '热门模板', icon: 'star' },
  ]

  const handleFilterToggle = (filter: FilterType) => {
    let newFilters: FilterType[]

    if (filters.includes(filter)) {
      // 如果已选中，则取消筛选（显示所有）
      newFilters = []
    } else {
      // 单选模式：只选择一个筛选项
      newFilters = [filter]
    }

    setFilters(newFilters)
    updateURL(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleClearFilters = () => {
    setFilters([])
    updateURL([])
    onFilterChange?.([])
  }

  const updateURL = (newFilters: FilterType[]) => {
    const params = new URLSearchParams(searchParams)
    
    if (newFilters.length > 0) {
      params.set('filter', newFilters.join(','))
    } else {
      params.delete('filter')
    }

    // 重置到第一页
    params.delete('page')

    router.push(`?${params.toString()}`)
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: '70px',
        background: themeConfig.background,
        borderBottom: `1px solid ${themeConfig.border}`,
        padding: isMobile ? '12px 16px' : '16px 30px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '12px',
        flexWrap: 'wrap',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 筛选标签 */}
      <div
        style={{
          color: themeConfig.text,
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
        }}
      >
        筛选:
      </div>

      {/* 筛选按钮 */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '6px' : '10px',
          flexWrap: 'wrap',
          flex: 1,
        }}
      >
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterToggle(option.value)}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              background: filters.includes(option.value)
                ? themeConfig.activeButtonBackground
                : themeConfig.buttonBackground,
              border: filters.includes(option.value)
                ? `1px solid ${themeConfig.activeButtonBorder}`
                : `1px solid ${themeConfig.border}`,
              borderRadius: '8px',
              color: filters.includes(option.value) ? '#4A9EFF' : themeConfig.text,
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              if (!filters.includes(option.value)) {
                e.currentTarget.style.background = themeConfig.buttonHover
              }
            }}
            onMouseOut={(e) => {
              if (!filters.includes(option.value)) {
                e.currentTarget.style.background = themeConfig.buttonBackground
              }
            }}
          >
            <span style={{ display: 'inline-flex' }}><UIIcon name={option.icon} size={14} /></span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* 清除筛选按钮 */}
      {filters.length > 0 && (
        <button
          onClick={handleClearFilters}
          style={{
            padding: isMobile ? '6px 12px' : '8px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '500',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
        >
          ✕ 清除筛选
        </button>
      )}

      {/* 活跃筛选指示器 */}
      {filters.length > 0 && (
        <div
          style={{
            marginLeft: 'auto',
            color: '#4A9EFF',
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
          }}
        >
          已应用 {filters.length} 个筛选
        </div>
      )}
    </div>
  )
}

export default function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={<div style={{ padding: '16px 30px' }}>加载筛选栏...</div>}>
      <FilterBarContent {...props} />
    </Suspense>
  )
}
