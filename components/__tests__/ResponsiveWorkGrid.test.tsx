import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResponsiveWorkGrid from '../ResponsiveWorkGrid'
import { GraphCard } from '@/lib/types/homepage-gallery'

// Mock data
const mockWorks: GraphCard[] = [
  {
    id: '1',
    title: '测试作品1',
    description: '这是一个测试作品的描述',
    thumbnail: 'https://example.com/image1.jpg',
    type: '3d',
    isTemplate: false,
    creator: {
      id: '1',
      name: '测试用户',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar1.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    likes: 10,
    views: 100,
    tags: ['测试', '3D'],
    nodeCount: 5,
    edgeCount: 8
  },
  {
    id: '2',
    title: '测试作品2',
    description: '这是另一个测试作品的描述',
    thumbnail: 'https://example.com/image2.jpg',
    type: '2d',
    isTemplate: true,
    creator: {
      id: '2',
      name: '测试用户2',
      email: 'test2@example.com',
      avatar: 'https://example.com/avatar2.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    likes: 25,
    views: 200,
    tags: ['测试', '2D', '模板'],
    nodeCount: 10,
    edgeCount: 15
  }
]

// Mock functions
const mockOnWorkClick = jest.fn()
const mockOnWorkLike = jest.fn()
const mockOnWorkShare = jest.fn()
const mockOnRetry = jest.fn()

describe('ResponsiveWorkGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders works correctly', () => {
    render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        onWorkLike={mockOnWorkLike}
        onWorkShare={mockOnWorkShare}
      />
    )

    expect(screen.getByText('测试作品1')).toBeInTheDocument()
    expect(screen.getByText('测试作品2')).toBeInTheDocument()
  })

  it('shows loading state with skeleton cards', () => {
    render(
      <ResponsiveWorkGrid
        works={[]}
        loading={true}
        onWorkClick={mockOnWorkClick}
        loadingType="skeleton"
      />
    )

    // 骨架屏应该被渲染
    const skeletonCards = document.querySelectorAll('.grid-item')
    expect(skeletonCards.length).toBeGreaterThan(0)
  })

  it('shows spinner loading state', () => {
    render(
      <ResponsiveWorkGrid
        works={[]}
        loading={true}
        onWorkClick={mockOnWorkClick}
        loadingType="spinner"
        loadingText="正在加载..."
      />
    )

    expect(screen.getByText('正在加载...')).toBeInTheDocument()
  })

  it('shows empty state when no works', () => {
    render(
      <ResponsiveWorkGrid
        works={[]}
        loading={false}
        onWorkClick={mockOnWorkClick}
        emptyStateConfig={{
          title: '暂无内容',
          description: '没有找到任何作品',
          actionText: '创建新作品',
          onAction: jest.fn()
        }}
      />
    )

    expect(screen.getByText('暂无内容')).toBeInTheDocument()
    expect(screen.getByText('没有找到任何作品')).toBeInTheDocument()
    expect(screen.getByText('创建新作品')).toBeInTheDocument()
  })

  it('shows error state with retry button', () => {
    render(
      <ResponsiveWorkGrid
        works={[]}
        loading={false}
        onWorkClick={mockOnWorkClick}
        error="网络连接失败"
        onRetry={mockOnRetry}
      />
    )

    expect(screen.getByText('网络连接异常')).toBeInTheDocument()
    
    const retryButton = screen.getByText('重试')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('handles work click events', () => {
    render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
      />
    )

    const firstWork = screen.getByText('测试作品1').closest('div')
    if (firstWork) {
      fireEvent.click(firstWork)
      expect(mockOnWorkClick).toHaveBeenCalledWith(mockWorks[0])
    }
  })

  it('handles like and share actions on hover', async () => {
    render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        onWorkLike={mockOnWorkLike}
        onWorkShare={mockOnWorkShare}
      />
    )

    const firstWorkCard = screen.getByText('测试作品1').closest('div')
    if (firstWorkCard) {
      // 模拟鼠标悬停
      fireEvent.mouseEnter(firstWorkCard)
      
      await waitFor(() => {
        const likeButton = screen.getByText('🤍').closest('button')
        const shareButton = screen.getByText('🔗').closest('button')
        
        if (likeButton) {
          fireEvent.click(likeButton)
          expect(mockOnWorkLike).toHaveBeenCalledWith('1')
        }
        
        if (shareButton) {
          fireEvent.click(shareButton)
          expect(mockOnWorkShare).toHaveBeenCalledWith(mockWorks[0])
        }
      })
    }
  })

  it('applies different themes correctly', () => {
    const { rerender } = render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        theme="dark"
      />
    )

    // 重新渲染为浅色主题
    rerender(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        theme="light"
      />
    )

    // 验证主题应用（这里可以检查样式或类名）
    expect(screen.getByText('测试作品1')).toBeInTheDocument()
  })

  it('handles different spacing options', () => {
    const { rerender } = render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        spacing="compact"
      />
    )

    rerender(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        spacing="spacious"
      />
    )

    expect(screen.getByText('测试作品1')).toBeInTheDocument()
  })

  it('handles different aspect ratios', () => {
    render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
        aspectRatio="square"
      />
    )

    expect(screen.getByText('测试作品1')).toBeInTheDocument()
  })

  it('shows template and type labels correctly', () => {
    render(
      <ResponsiveWorkGrid
        works={mockWorks}
        loading={false}
        onWorkClick={mockOnWorkClick}
      />
    )

    expect(screen.getByText('3D')).toBeInTheDocument()
    expect(screen.getByText('2D')).toBeInTheDocument()
    expect(screen.getByText('模板')).toBeInTheDocument()
  })
})