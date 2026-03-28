import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EnhancedWorkCard from '../EnhancedWorkCard'
import { GraphCard } from '@/lib/types/homepage-gallery'

// Mock work data
const mockWork: GraphCard = {
  id: '1',
  title: '测试知识图谱',
  description: '这是一个测试用的知识图谱描述',
  thumbnail: 'https://example.com/thumbnail.jpg',
  type: '3d',
  isTemplate: false,
  creator: {
    id: 'user1',
    name: '测试用户',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  likes: 42,
  views: 123,
  tags: ['科技', '教育', '人工智能'],
  nodeCount: 15,
  edgeCount: 20
}

const mockFeaturedWork: GraphCard = {
  ...mockWork,
  id: '2',
  title: '特色知识图谱',
  isTemplate: true
}

describe('EnhancedWorkCard', () => {
  const mockOnClick = jest.fn()
  const mockOnLike = jest.fn()
  const mockOnShare = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染基本信息', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('测试知识图谱')).toBeInTheDocument()
      expect(screen.getByText('这是一个测试用的知识图谱描述')).toBeInTheDocument()
      expect(screen.getByText('测试用户')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('3D')).toBeInTheDocument()
    })

    it('应该正确渲染统计信息', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          showStats={true}
        />
      )

      expect(screen.getByText('📍 15 节点')).toBeInTheDocument()
      expect(screen.getByText('🔗 20 关系')).toBeInTheDocument()
      expect(screen.getByText('👁️ 123 浏览')).toBeInTheDocument()
    })

    it('应该正确渲染标签', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          showTags={true}
        />
      )

      expect(screen.getByText('#科技')).toBeInTheDocument()
      expect(screen.getByText('#教育')).toBeInTheDocument()
      expect(screen.getByText('#人工智能')).toBeInTheDocument()
    })

    it('应该限制显示的标签数量', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          showTags={true}
          maxTags={2}
        />
      )

      expect(screen.getByText('#科技')).toBeInTheDocument()
      expect(screen.getByText('#教育')).toBeInTheDocument()
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.queryByText('#人工智能')).not.toBeInTheDocument()
    })
  })

  describe('特色作品', () => {
    it('应该显示特色标签', () => {
      render(
        <EnhancedWorkCard
          work={mockFeaturedWork}
          onClick={mockOnClick}
          featured={true}
        />
      )

      expect(screen.getByText('特色')).toBeInTheDocument()
    })

    it('应该显示模板标签', () => {
      render(
        <EnhancedWorkCard
          work={mockFeaturedWork}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('模板')).toBeInTheDocument()
    })
  })

  describe('交互功能', () => {
    it('应该响应点击事件', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /查看作品/ }))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('应该响应键盘事件', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button', { name: /查看作品/ })
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(mockOnClick).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(card, { key: ' ' })
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('应该响应点赞功能', async () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          onLike={mockOnLike}
        />
      )

      // 悬停以显示操作按钮
      const card = screen.getByRole('button', { name: /查看作品/ })
      fireEvent.mouseEnter(card)

      await waitFor(() => {
        const likeButton = screen.getByRole('button', { name: /点赞/ })
        expect(likeButton).toBeInTheDocument()
      })

      const likeButton = screen.getByRole('button', { name: /点赞/ })
      fireEvent.click(likeButton)
      expect(mockOnLike).toHaveBeenCalledTimes(1)
    })

    it('应该响应分享功能', async () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          onShare={mockOnShare}
        />
      )

      // 悬停以显示操作按钮
      const card = screen.getByRole('button', { name: /查看作品/ })
      fireEvent.mouseEnter(card)

      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /分享作品/ })
        expect(shareButton).toBeInTheDocument()
      })

      const shareButton = screen.getByRole('button', { name: /分享作品/ })
      fireEvent.click(shareButton)
      expect(mockOnShare).toHaveBeenCalledTimes(1)
    })
  })

  describe('图片处理', () => {
    it('应该处理图片加载成功', async () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      const image = screen.getByAltText('测试知识图谱')
      fireEvent.load(image)

      await waitFor(() => {
        expect(image).toHaveStyle({ opacity: '1' })
      })
    })

    it('应该处理图片加载失败', async () => {
      const workWithoutThumbnail = { ...mockWork, thumbnail: '' }
      render(
        <EnhancedWorkCard
          work={workWithoutThumbnail}
          onClick={mockOnClick}
        />
      )

      // 查找占位符图标容器
      const placeholderContainer = document.querySelector('.placeholderIcon')
      expect(placeholderContainer).toBeInTheDocument()
      expect(placeholderContainer).toHaveTextContent('🎯')
    })

    it('应该显示自定义占位符', () => {
      const workWithoutThumbnail = { ...mockWork, thumbnail: '' }
      render(
        <EnhancedWorkCard
          work={workWithoutThumbnail}
          onClick={mockOnClick}
          placeholder="🔬"
        />
      )

      expect(screen.getByText('🔬')).toBeInTheDocument()
    })
  })

  describe('主题支持', () => {
    it('应该支持浅色主题', () => {
      const { container } = render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          theme="light"
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveStyle({
        background: 'rgba(255, 255, 255, 0.9)'
      })
    })

    it('应该支持深色主题', () => {
      const { container } = render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          theme="dark"
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveStyle({
        background: 'rgba(40, 40, 40, 0.9)'
      })
    })
  })

  describe('尺寸变体', () => {
    it('应该支持小尺寸', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          size="small"
        />
      )

      const title = screen.getByText('测试知识图谱')
      expect(title).toHaveStyle({ fontSize: '14px' })
    })

    it('应该支持大尺寸', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          size="large"
        />
      )

      const title = screen.getByText('测试知识图谱')
      expect(title).toHaveStyle({ fontSize: '18px' })
    })
  })

  describe('宽高比', () => {
    it('应该支持正方形宽高比', () => {
      const { container } = render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          aspectRatio="square"
        />
      )

      const thumbnailContainer = container.querySelector('.thumbnailContainer')
      expect(thumbnailContainer).toHaveStyle({ paddingBottom: '100%' })
    })

    it('应该支持16:9宽高比', () => {
      const { container } = render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
          aspectRatio="16:9"
        />
      )

      const thumbnailContainer = container.querySelector('.thumbnailContainer')
      expect(thumbnailContainer).toHaveStyle({ paddingBottom: '56.25%' })
    })
  })

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button', { name: '查看作品: 测试知识图谱' })
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('应该有正确的图片alt文本', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      const image = screen.getByAltText('测试知识图谱')
      expect(image).toBeInTheDocument()
    })

    it('应该有正确的title属性', () => {
      render(
        <EnhancedWorkCard
          work={mockWork}
          onClick={mockOnClick}
        />
      )

      const title = screen.getByText('测试知识图谱')
      expect(title).toHaveAttribute('title', '测试知识图谱')

      const description = screen.getByText('这是一个测试用的知识图谱描述')
      expect(description).toHaveAttribute('title', '这是一个测试用的知识图谱描述')
    })
  })

  describe('边界情况', () => {
    it('应该处理空描述', () => {
      const workWithoutDescription = { ...mockWork, description: '' }
      render(
        <EnhancedWorkCard
          work={workWithoutDescription}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('暂无描述')).toBeInTheDocument()
    })

    it('应该处理空标签数组', () => {
      const workWithoutTags = { ...mockWork, tags: [] }
      render(
        <EnhancedWorkCard
          work={workWithoutTags}
          onClick={mockOnClick}
          showTags={true}
        />
      )

      expect(screen.queryByText('#科技')).not.toBeInTheDocument()
    })

    it('应该处理没有头像的创建者', () => {
      const workWithoutAvatar = {
        ...mockWork,
        creator: { ...mockWork.creator, avatar: '' }
      }
      render(
        <EnhancedWorkCard
          work={workWithoutAvatar}
          onClick={mockOnClick}
        />
      )

      expect(screen.getByText('👤')).toBeInTheDocument()
    })
  })
})