'use client'

import React, { useState } from 'react'
import EnhancedWorkCard from '../EnhancedWorkCard'
import { GraphCard } from '@/lib/types/homepage-gallery'

// 示例数据
const sampleWorks: GraphCard[] = [
  {
    id: '1',
    title: '人工智能知识图谱',
    description: '探索人工智能领域的核心概念、技术发展历程和未来趋势，包含机器学习、深度学习、自然语言处理等关键技术节点。',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    type: '3d',
    isTemplate: false,
    creator: {
      id: 'user1',
      name: 'AI研究员',
      email: 'ai@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01'),
    likes: 156,
    views: 2340,
    tags: ['人工智能', '机器学习', '深度学习', '科技'],
    nodeCount: 45,
    edgeCount: 78
  },
  {
    id: '2',
    title: '生物学基础概念图',
    description: '系统梳理生物学基础概念，从细胞结构到生态系统，构建完整的生物学知识体系。',
    thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    type: '2d',
    isTemplate: true,
    creator: {
      id: 'user2',
      name: '生物老师',
      email: 'bio@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2023-11-15'),
    likes: 89,
    views: 1567,
    tags: ['生物学', '教育', '模板'],
    nodeCount: 32,
    edgeCount: 56
  },
  {
    id: '3',
    title: '区块链技术架构',
    description: '深入解析区块链技术的核心架构，包括共识机制、智能合约、去中心化应用等关键组件。',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
    type: '3d',
    isTemplate: false,
    creator: {
      id: 'user3',
      name: '区块链开发者',
      email: 'blockchain@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    createdAt: new Date('2023-10-20'),
    updatedAt: new Date('2023-10-20'),
    likes: 234,
    views: 3456,
    tags: ['区块链', '技术', '架构', '去中心化'],
    nodeCount: 67,
    edgeCount: 123
  }
]

const EnhancedWorkCardExample: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [aspectRatio, setAspectRatio] = useState<'auto' | 'square' | '4:3' | '16:9' | '3:2'>('auto')
  const [showStats, setShowStats] = useState(true)
  const [showTags, setShowTags] = useState(true)
  const [maxTags, setMaxTags] = useState(3)

  const handleWorkClick = (work: GraphCard) => {
    console.log('点击作品:', work.title)
    alert(`查看作品: ${work.title}`)
  }

  const handleLike = (workId: string) => {
    console.log('点赞作品:', workId)
    alert(`点赞作品: ${workId}`)
  }

  const handleShare = (work: GraphCard) => {
    console.log('分享作品:', work.title)
    alert(`分享作品: ${work.title}`)
  }

  return (
    <div style={{ 
      padding: '20px', 
      background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        color: theme === 'dark' ? '#fff' : '#000',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        EnhancedWorkCard 组件示例
      </h1>

      {/* 控制面板 */}
      <div style={{
        background: theme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
            主题:
          </label>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            style={{ padding: '5px 10px', borderRadius: '4px' }}
          >
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </div>

        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
            尺寸:
          </label>
          <select 
            value={size} 
            onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
            style={{ padding: '5px 10px', borderRadius: '4px' }}
          >
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>

        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
            宽高比:
          </label>
          <select 
            value={aspectRatio} 
            onChange={(e) => setAspectRatio(e.target.value as any)}
            style={{ padding: '5px 10px', borderRadius: '4px' }}
          >
            <option value="auto">自动 (4:3)</option>
            <option value="square">正方形 (1:1)</option>
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
            <option value="3:2">3:2</option>
          </select>
        </div>

        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000', marginRight: '10px' }}>
            最大标签数:
          </label>
          <input 
            type="number" 
            value={maxTags} 
            onChange={(e) => setMaxTags(parseInt(e.target.value))}
            min="1"
            max="10"
            style={{ padding: '5px 10px', borderRadius: '4px', width: '60px' }}
          />
        </div>

        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            <input 
              type="checkbox" 
              checked={showStats} 
              onChange={(e) => setShowStats(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            显示统计信息
          </label>
        </div>

        <div>
          <label style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
            <input 
              type="checkbox" 
              checked={showTags} 
              onChange={(e) => setShowTags(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            显示标签
          </label>
        </div>
      </div>

      {/* 卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 普通卡片 */}
        <EnhancedWorkCard
          work={sampleWorks[0]}
          onClick={() => handleWorkClick(sampleWorks[0])}
          onLike={() => handleLike(sampleWorks[0].id)}
          onShare={() => handleShare(sampleWorks[0])}
          theme={theme}
          size={size}
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={maxTags}
        />

        {/* 特色卡片 */}
        <EnhancedWorkCard
          work={sampleWorks[1]}
          onClick={() => handleWorkClick(sampleWorks[1])}
          onLike={() => handleLike(sampleWorks[1].id)}
          onShare={() => handleShare(sampleWorks[1])}
          featured={true}
          theme={theme}
          size={size}
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={maxTags}
        />

        {/* 无操作按钮的卡片 */}
        <EnhancedWorkCard
          work={sampleWorks[2]}
          onClick={() => handleWorkClick(sampleWorks[2])}
          theme={theme}
          size={size}
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={maxTags}
        />

        {/* 无图片的卡片 */}
        <EnhancedWorkCard
          work={{
            ...sampleWorks[0],
            id: '4',
            title: '无图片示例',
            thumbnail: '',
            description: '这是一个没有缩略图的作品示例，展示占位符的效果。'
          }}
          onClick={() => handleWorkClick(sampleWorks[0])}
          onLike={() => handleLike('4')}
          onShare={() => handleShare(sampleWorks[0])}
          theme={theme}
          size={size}
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={maxTags}
          placeholder="🔬"
        />

        {/* 自定义样式的卡片 */}
        <EnhancedWorkCard
          work={{
            ...sampleWorks[1],
            id: '5',
            title: '自定义样式示例',
            tags: ['标签1', '标签2', '标签3', '标签4', '标签5']
          }}
          onClick={() => handleWorkClick(sampleWorks[1])}
          onLike={() => handleLike('5')}
          onShare={() => handleShare(sampleWorks[1])}
          theme={theme}
          size={size}
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={maxTags}
          className="custom-card"
        />

        {/* 小尺寸卡片 */}
        <EnhancedWorkCard
          work={{
            ...sampleWorks[2],
            id: '6',
            title: '小尺寸卡片示例'
          }}
          onClick={() => handleWorkClick(sampleWorks[2])}
          onLike={() => handleLike('6')}
          onShare={() => handleShare(sampleWorks[2])}
          theme={theme}
          size="small"
          aspectRatio={aspectRatio}
          showStats={showStats}
          showTags={showTags}
          maxTags={2}
        />
      </div>

      {/* 使用说明 */}
      <div style={{
        background: theme === 'dark' ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '40px',
        color: theme === 'dark' ? '#fff' : '#000'
      }}>
        <h2>使用说明</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>基础用法:</strong> 传入 work 对象和 onClick 回调函数</li>
          <li><strong>交互功能:</strong> 可选的 onLike 和 onShare 回调函数</li>
          <li><strong>视觉定制:</strong> 支持 theme、size、aspectRatio 等属性</li>
          <li><strong>内容控制:</strong> 可控制是否显示统计信息、标签等</li>
          <li><strong>特色标识:</strong> 设置 featured=true 显示特色标签</li>
          <li><strong>响应式:</strong> 自动适配不同屏幕尺寸</li>
          <li><strong>可访问性:</strong> 支持键盘导航和屏幕阅读器</li>
          <li><strong>图片处理:</strong> 支持懒加载、错误处理和占位符</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedWorkCardExample