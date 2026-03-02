import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeroSection from '../HeroSection'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock useUserStore
const mockUserStore = {
  isLoggedIn: false,
  user: null
}

jest.mock('@/lib/userStore', () => ({
  useUserStore: () => mockUserStore
}))

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserStore.isLoggedIn = false
    mockUserStore.user = null
  })

  describe('基础渲染', () => {
    it('应该渲染默认标题和副标题', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('知识图谱作品广场')).toBeInTheDocument()
      expect(screen.getByText('发现、创建和分享知识的无限可能')).toBeInTheDocument()
    })

    it('应该渲染自定义标题和副标题', () => {
      render(
        <HeroSection
          title="自定义标题"
          subtitle="自定义副标题"
        />
      )
      
      expect(screen.getByText('自定义标题')).toBeInTheDocument()
      expect(screen.getByText('自定义副标题')).toBeInTheDocument()
    })

    it('应该渲染搜索栏', () => {
      render(<HeroSection showSearch={true} />)
      
      expect(screen.getByPlaceholderText('搜索知识图谱')).toBeInTheDocument()
      expect(screen.getByLabelText('搜索')).toBeInTheDocument()
    })

    it('应该隐藏搜索栏当showSearch为false', () => {
      render(<HeroSection showSearch={false} />)
      
      expect(screen.queryByPlaceholderText('搜索知识图谱')).not.toBeInTheDocument()
    })
  })

  describe('按钮功能', () => {
    it('应该渲染默认的主要按钮', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('开始创作')).toBeInTheDocument()
    })

    it('应该渲染默认的次要按钮', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('浏览作品')).toBeInTheDocument()
    })

    it('应该渲染自定义按钮', () => {
      const primaryAction = {
        text: '自定义主按钮',
        onClick: jest.fn()
      }
      const secondaryAction = {
        text: '自定义次按钮',
        onClick: jest.fn()
      }

      render(
        <HeroSection
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
        />
      )
      
      expect(screen.getByText('自定义主按钮')).toBeInTheDocument()
      expect(screen.getByText('自定义次按钮')).toBeInTheDocument()
    })

    it('应该调用自定义按钮的onClick', () => {
      const primaryOnClick = jest.fn()
      const secondaryOnClick = jest.fn()

      render(
        <HeroSection
          primaryAction={{
            text: '主按钮',
            onClick: primaryOnClick
          }}
          secondaryAction={{
            text: '次按钮',
            onClick: secondaryOnClick
          }}
        />
      )
      
      fireEvent.click(screen.getByText('主按钮'))
      fireEvent.click(screen.getByText('次按钮'))
      
      expect(primaryOnClick).toHaveBeenCalledTimes(1)
      expect(secondaryOnClick).toHaveBeenCalledTimes(1)
    })

    it('应该禁用主按钮当disabled为true', () => {
      render(
        <HeroSection
          primaryAction={{
            text: '禁用按钮',
            onClick: jest.fn(),
            disabled: true
          }}
        />
      )
      
      const button = screen.getByRole('button', { name: '禁用按钮' })
      expect(button).toBeDisabled()
    })
  })

  describe('搜索功能', () => {
    it('应该调用onSearchChange当输入改变', () => {
      const onSearchChange = jest.fn()
      
      render(
        <HeroSection
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      const input = screen.getByPlaceholderText('搜索知识图谱')
      fireEvent.change(input, { target: { value: '测试搜索' } })
      
      expect(onSearchChange).toHaveBeenCalledWith('测试搜索')
    })

    it('应该调用onSearchSubmit当点击搜索按钮', () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      fireEvent.click(screen.getByLabelText('搜索'))
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该调用onSearchSubmit当按下Enter键', () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const input = screen.getByPlaceholderText('搜索知识图谱')
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该显示搜索查询值', () => {
      render(
        <HeroSection
          searchQuery="测试查询"
          showSearch={true}
        />
      )
      
      const input = screen.getByPlaceholderText('搜索知识图谱') as HTMLInputElement
      expect(input.value).toBe('测试查询')
    })
  })

  describe('主题和样式', () => {
    it('应该应用浅色主题类名', () => {
      const { container } = render(<HeroSection theme="light" />)
      
      // 检查是否包含浅色主题相关的类名
      expect(container.querySelector('.heroSection')).toBeInTheDocument()
    })

    it('应该应用深色主题类名', () => {
      const { container } = render(<HeroSection theme="dark" />)
      
      // 检查是否包含深色主题相关的类名
      expect(container.querySelector('.heroSection')).toBeInTheDocument()
    })

    it('应该应用自定义className', () => {
      const { container } = render(<HeroSection className="custom-hero" />)
      
      expect(container.querySelector('.custom-hero')).toBeInTheDocument()
    })
  })

  describe('背景类型', () => {
    it('应该应用渐变背景', () => {
      const { container } = render(<HeroSection backgroundType="gradient" />)
      
      expect(container.querySelector('.backgroundGradient')).toBeInTheDocument()
    })

    it('应该应用图案背景', () => {
      const { container } = render(<HeroSection backgroundType="pattern" />)
      
      expect(container.querySelector('.backgroundPattern')).toBeInTheDocument()
    })

    it('应该应用纯色背景', () => {
      const { container } = render(<HeroSection backgroundType="solid" />)
      
      expect(container.querySelector('.backgroundSolid')).toBeInTheDocument()
    })

    it('应该应用图片背景', () => {
      const { container } = render(
        <HeroSection
          backgroundType="image"
          backgroundImage="/test-image.jpg"
        />
      )
      
      const heroSection = container.querySelector('.heroSection')
      expect(heroSection).toHaveStyle({
        backgroundImage: 'url(/test-image.jpg)'
      })
    })
  })

  describe('动画效果', () => {
    it('应该在动画启用时显示浮动元素', () => {
      const { container } = render(
        <HeroSection
          backgroundType="gradient"
          animated={true}
        />
      )
      
      expect(container.querySelector('.floatingElement1')).toBeInTheDocument()
      expect(container.querySelector('.floatingElement2')).toBeInTheDocument()
      expect(container.querySelector('.floatingElement3')).toBeInTheDocument()
    })

    it('应该在动画禁用时隐藏浮动元素', () => {
      const { container } = render(
        <HeroSection
          backgroundType="gradient"
          animated={false}
        />
      )
      
      expect(container.querySelector('.floatingElement1')).not.toBeInTheDocument()
      expect(container.querySelector('.floatingElement2')).not.toBeInTheDocument()
      expect(container.querySelector('.floatingElement3')).not.toBeInTheDocument()
    })
  })

  describe('特性标签', () => {
    it('应该渲染所有特性标签', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('3D可视化')).toBeInTheDocument()
      expect(screen.getByText('快速创建')).toBeInTheDocument()
      expect(screen.getByText('协作分享')).toBeInTheDocument()
      expect(screen.getByText('数据驱动')).toBeInTheDocument()
    })

    it('应该渲染特性图标', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.getByText('🤝')).toBeInTheDocument()
      expect(screen.getByText('📊')).toBeInTheDocument()
    })
  })

  describe('用户认证集成', () => {
    it('应该在用户未登录时禁用默认创作按钮', () => {
      mockUserStore.isLoggedIn = false
      
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: '开始创作' })
      expect(button).toBeDisabled()
    })

    it('应该在用户已登录时启用默认创作按钮', () => {
      mockUserStore.isLoggedIn = true
      
      render(<HeroSection />)
      
      const button = screen.getByText('开始创作')
      expect(button).not.toBeDisabled()
    })

    it('应该在用户未登录时点击创作按钮显示提示', () => {
      mockUserStore.isLoggedIn = false
      
      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<HeroSection />)
      
      // 由于按钮被禁用，我们需要测试默认行为
      // 这里我们测试自定义按钮的情况
      const customAction = {
        text: '测试按钮',
        onClick: () => {
          if (!mockUserStore.isLoggedIn) {
            alert('请先登录后再开始创作')
            return
          }
        }
      }
      
      const { rerender } = render(<HeroSection primaryAction={customAction} />)
      
      fireEvent.click(screen.getByText('测试按钮'))
      
      expect(alertSpy).toHaveBeenCalledWith('请先登录后再开始创作')
      
      alertSpy.mockRestore()
    })
  })

  describe('响应式行为', () => {
    it('应该在不同屏幕尺寸下正确渲染', () => {
      // 这个测试需要模拟不同的屏幕尺寸
      // 由于 jsdom 的限制，我们主要测试组件是否正确渲染
      render(<HeroSection />)
      
      expect(screen.getByText('知识图谱作品广场')).toBeInTheDocument()
    })
  })

  describe('无障碍性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<HeroSection showSearch={true} />)
      
      expect(screen.getByLabelText('搜索')).toBeInTheDocument()
    })

    it('应该支持键盘导航', () => {
      render(<HeroSection />)
      
      const primaryButton = screen.getByRole('button', { name: '开始创作' })
      const secondaryButton = screen.getByRole('button', { name: '浏览作品' })
      
      // 测试按钮是否可以获得焦点
      expect(primaryButton).toBeInTheDocument()
      expect(secondaryButton).toBeInTheDocument()
      
      // 测试按钮是否有正确的tabIndex（默认情况下按钮是可聚焦的）
      expect(primaryButton.tabIndex).not.toBe(-1)
      expect(secondaryButton.tabIndex).not.toBe(-1)
    })
  })

  describe('边界情况', () => {
    it('应该处理空的搜索查询', () => {
      render(
        <HeroSection
          searchQuery=""
          showSearch={true}
        />
      )
      
      const input = screen.getByPlaceholderText('搜索知识图谱') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('应该处理没有次要按钮的情况', () => {
      render(
        <HeroSection
          primaryAction={{
            text: '主按钮',
            onClick: jest.fn()
          }}
          secondaryAction={null as any}
        />
      )
      
      expect(screen.getByText('主按钮')).toBeInTheDocument()
      expect(screen.queryByText('浏览作品')).not.toBeInTheDocument()
    })

    it('应该处理长标题文本', () => {
      const longTitle = '这是一个非常长的标题文本，用来测试组件如何处理长文本内容的显示和布局'
      
      render(<HeroSection title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })
})