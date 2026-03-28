'use client'

import { useState } from 'react'
import EnhancedNavbar from '../EnhancedNavbar'

/**
 * Example component showing how to integrate EnhancedNavbar
 * This demonstrates the basic usage and props handling
 */
export default function EnhancedNavbarExample() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    console.log('Search query changed:', query)
  }

  const handleSearchSubmit = () => {
    console.log('Search submitted:', searchQuery)
    // Here you would typically trigger a search API call or navigation
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navbar */}
      <EnhancedNavbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Example content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            EnhancedNavbar 示例
          </h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">功能特性</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>响应式设计，支持桌面端和移动端</li>
                <li>集成搜索功能，支持实时查询</li>
                <li>用户认证状态管理</li>
                <li>移动端汉堡菜单</li>
                <li>现代化的视觉设计</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">当前搜索查询</h2>
              <p className="text-gray-600">
                {searchQuery || '(无搜索内容)'}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">使用方法</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import EnhancedNavbar from '@/components/EnhancedNavbar'

function MyPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      <EnhancedNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => console.log('Search:', searchQuery)}
      />
      {/* 页面内容 */}
    </div>
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}