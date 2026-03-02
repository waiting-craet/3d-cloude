'use client'

import { useState } from 'react'
import SmartCategoryFilter, { Category } from '../SmartCategoryFilter'

// 示例分类数据
const categories: Category[] = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'tech', name: '科技', icon: '💻', color: '#2196F3' },
  { id: 'education', name: '教育', icon: '🎓', color: '#4CAF50' },
  { id: 'business', name: '商业', icon: '💼', color: '#FF9800' },
  { id: 'art', name: '艺术', icon: '🎨', color: '#E91E63' },
  { id: 'medical', name: '医疗', icon: '⚕️', color: '#009688' },
  { id: 'other', name: '其他', icon: '📋', color: '#607D8B' }
]

// 示例作品数量数据
const workCount = {
  all: 120,
  tech: 45,
  education: 32,
  business: 28,
  art: 15,
  medical: 8,
  other: 12
}

export default function SmartCategoryFilterExample() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [variant, setVariant] = useState<'default' | 'pills' | 'tabs'>('pills')
  const [showCount, setShowCount] = useState(true)
  const [animated, setAnimated] = useState(true)

  const handleCategoryChange = (categoryId: string) => {
    setLoading(true)
    setSelectedCategory(categoryId)
    
    // 模拟加载延迟
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{ padding: '40px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#333' }}>
          SmartCategoryFilter 组件示例
        </h1>

        {/* 控制面板 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>配置选项</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {/* 尺寸选择 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                尺寸:
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>

            {/* 样式变体选择 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                样式变体:
              </label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              >
                <option value="default">默认</option>
                <option value="pills">药丸</option>
                <option value="tabs">标签页</option>
              </select>
            </div>

            {/* 开关选项 */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={showCount}
                  onChange={(e) => setShowCount(e.target.checked)}
                />
                显示作品数量
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                />
                启用动画效果
              </label>
            </div>

            {/* 加载状态测试 */}
            <div>
              <button
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => setLoading(false), 2000)
                }}
                style={{
                  padding: '8px 16px',
                  background: '#00bfa5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                测试加载状态
              </button>
            </div>
          </div>
        </div>

        {/* 组件展示 */}
        <div style={{
          background: 'white',
          padding: '40px 20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <SmartCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            workCount={workCount}
            loading={loading}
            showCount={showCount}
            animated={animated}
            size={size}
            variant={variant}
          />
        </div>

        {/* 当前状态显示 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>当前状态</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <strong>选中分类:</strong> {selectedCategory}
            </div>
            <div>
              <strong>分类名称:</strong> {categories.find(c => c.id === selectedCategory)?.name || '未知'}
            </div>
            <div>
              <strong>作品数量:</strong> {workCount[selectedCategory as keyof typeof workCount] || 0}
            </div>
            <div>
              <strong>加载状态:</strong> {loading ? '加载中...' : '已完成'}
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>使用说明</h3>
          <ul style={{ lineHeight: '1.6', color: '#666' }}>
            <li><strong>鼠标操作:</strong> 点击分类按钮进行切换</li>
            <li><strong>键盘导航:</strong> 使用方向键、Home/End 键导航，Enter/空格键选择</li>
            <li><strong>响应式:</strong> 组件会根据屏幕尺寸自动调整布局</li>
            <li><strong>可访问性:</strong> 支持屏幕阅读器和键盘导航</li>
            <li><strong>自定义:</strong> 支持多种尺寸、样式变体和配置选项</li>
            <li><strong>动画:</strong> 平滑的切换动画和悬停效果</li>
          </ul>
        </div>

        {/* 代码示例 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>代码示例</h3>
          <pre style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
{`import SmartCategoryFilter from '@/components/SmartCategoryFilter'

const categories = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'tech', name: '科技', icon: '💻', color: '#2196F3' },
  // ... 更多分类
]

const workCount = {
  all: 120,
  tech: 45,
  // ... 更多数量
}

function MyComponent() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <SmartCategoryFilter
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      workCount={workCount}
      size="medium"
      variant="pills"
      showCount={true}
      animated={true}
    />
  )
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}