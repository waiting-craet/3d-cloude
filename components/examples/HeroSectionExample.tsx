'use client'

import React, { useState } from 'react'
import HeroSection from '../HeroSection'

/**
 * HeroSection 组件使用示例
 * 
 * 这个示例展示了 HeroSection 组件的各种配置选项和使用方式
 */
const HeroSectionExample: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [currentBackground, setCurrentBackground] = useState<'gradient' | 'pattern' | 'solid' | 'image'>('gradient')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSearchSubmit = () => {
    console.log('搜索查询:', searchQuery)
    // 这里可以实现实际的搜索逻辑
  }

  const handleCreateClick = () => {
    console.log('开始创作按钮被点击')
    // 这里可以导航到创作页面
  }

  const handleBrowseClick = () => {
    console.log('浏览作品按钮被点击')
    // 这里可以滚动到作品区域
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* 控制面板 */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minWidth: '200px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>控制面板</h3>
        
        {/* 主题切换 */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
            主题:
          </label>
          <select
            value={currentTheme}
            onChange={(e) => setCurrentTheme(e.target.value as 'light' | 'dark')}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              fontSize: '12px'
            }}
          >
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>

        {/* 背景类型切换 */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
            背景类型:
          </label>
          <select
            value={currentBackground}
            onChange={(e) => setCurrentBackground(e.target.value as any)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              fontSize: '12px'
            }}
          >
            <option value="gradient">渐变背景</option>
            <option value="pattern">图案背景</option>
            <option value="solid">纯色背景</option>
            <option value="image">图片背景</option>
          </select>
        </div>

        {/* 搜索查询显示 */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
            当前搜索:
          </label>
          <div
            style={{
              padding: '6px 8px',
              background: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#666',
              minHeight: '20px'
            }}
          >
            {searchQuery || '无'}
          </div>
        </div>
      </div>

      {/* 基础示例 */}
      <HeroSection
        title="知识图谱作品广场"
        subtitle="发现、创建和分享知识的无限可能"
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        primaryAction={{
          text: "开始创作",
          onClick: handleCreateClick
        }}
        secondaryAction={{
          text: "浏览作品",
          onClick: handleBrowseClick
        }}
        backgroundType={currentBackground}
        backgroundImage={currentBackground === 'image' ? '/images/hero-bg.jpg' : undefined}
        theme={currentTheme}
        showSearch={true}
        animated={true}
      />

      {/* 其他内容区域 */}
      <div
        style={{
          padding: '80px 20px',
          background: currentTheme === 'dark' ? '#2a2a2a' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#333333',
          textAlign: 'center'
        }}
      >
        <h2 style={{ marginBottom: '24px' }}>其他页面内容</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          这里是页面的其他内容区域。HeroSection 组件可以很好地与其他内容配合使用，
          提供一个引人注目的页面顶部区域。
        </p>
        
        {/* 示例作品网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '40px',
            maxWidth: '800px',
            margin: '40px auto 0'
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={{
                background: currentTheme === 'dark' ? '#3a3a3a' : '#f8f8f8',
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${currentTheme === 'dark' ? '#4a4a4a' : '#e0e0e0'}`
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '120px',
                  background: `linear-gradient(135deg, ${
                    item % 4 === 0 ? '#00bfa5, #00d4b8' :
                    item % 4 === 1 ? '#667eea, #764ba2' :
                    item % 4 === 2 ? '#56ab2f, #a8e063' :
                    '#434343, #000000'
                  })`,
                  borderRadius: '8px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}
              >
                {item % 4 === 0 ? '🎯' : item % 4 === 1 ? '📊' : item % 4 === 2 ? '🚀' : '🤝'}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>示例作品 {item}</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>这是一个示例作品的描述</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeroSectionExample

/**
 * 使用说明:
 * 
 * 1. 基础使用:
 * <HeroSection />
 * 
 * 2. 自定义标题和副标题:
 * <HeroSection
 *   title="自定义标题"
 *   subtitle="自定义副标题"
 * />
 * 
 * 3. 自定义按钮:
 * <HeroSection
 *   primaryAction={{
 *     text: "立即开始",
 *     onClick: () => console.log('主要按钮点击')
 *   }}
 *   secondaryAction={{
 *     text: "了解更多",
 *     onClick: () => console.log('次要按钮点击')
 *   }}
 * />
 * 
 * 4. 搜索功能:
 * <HeroSection
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   onSearchSubmit={() => console.log('搜索:', searchQuery)}
 *   showSearch={true}
 * />
 * 
 * 5. 主题和背景:
 * <HeroSection
 *   theme="dark"
 *   backgroundType="gradient"
 *   backgroundImage="/path/to/image.jpg"
 * />
 * 
 * 6. 禁用动画:
 * <HeroSection animated={false} />
 */