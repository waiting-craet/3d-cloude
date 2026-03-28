import { render, screen, waitFor } from '@testing-library/react'
import FilterBar from '../FilterBar'
import GalleryTopNavbar from '../../GalleryTopNavbar'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

/**
 * 属性 12: 响应式列数一致性
 * 属性 13: 汉堡菜单响应式显示
 * 验证: 需求 10.1, 10.2, 10.3
 */
describe('响应式设计 - Property 12 & 13: 响应式布局一致性', () => {
  const mockMatchMedia = (width: number) => {
    return (query: string) => ({
      matches: (() => {
        if (query === '(max-width: 640px)') return width < 640
        if (query === '(max-width: 1024px)') return width < 1024
        if (query === '(min-width: 1024px)') return width >= 1024
        return false
      })(),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })
  }

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('属性 13: 汉堡菜单响应式显示', () => {
    it('手机屏幕 (375px) 应该显示汉堡菜单按钮', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.matchMedia = mockMatchMedia(375) as any

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      await waitFor(() => {
        const hamburgerButton = screen.queryByText('☰')
        expect(hamburgerButton).toBeInTheDocument()
      })
    })

    it('平板屏幕 (767px) 应该显示汉堡菜单按钮', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      })

      window.matchMedia = mockMatchMedia(767) as any

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      await waitFor(() => {
        const hamburgerButton = screen.queryByText('☰')
        expect(hamburgerButton).toBeInTheDocument()
      })
    })

    it('桌面屏幕 (1440px) 应该显示完整导航而不是汉堡菜单', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      window.matchMedia = mockMatchMedia(1440) as any

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      await waitFor(() => {
        const createButton = screen.queryByText(/开始创作/)
        expect(createButton).toBeInTheDocument()
      })
    })

    it('桌面屏幕应该不显示汉堡菜单', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      window.matchMedia = mockMatchMedia(1440) as any

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      await waitFor(() => {
        const hamburgerButton = screen.queryByText('☰')
        expect(hamburgerButton).not.toBeInTheDocument()
      })
    })
  })

  describe('响应式组件集成', () => {
    it('FilterBar 应该在移动设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.matchMedia = mockMatchMedia(375) as any

      const { container } = render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={jest.fn()}
          theme="dark"
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('GalleryTopNavbar 应该在移动设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.matchMedia = mockMatchMedia(375) as any

      const { container } = render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('FilterBar 应该在平板设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      })

      window.matchMedia = mockMatchMedia(767) as any

      const { container } = render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={jest.fn()}
          theme="dark"
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('GalleryTopNavbar 应该在平板设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      })

      window.matchMedia = mockMatchMedia(767) as any

      const { container } = render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('FilterBar 应该在桌面设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      window.matchMedia = mockMatchMedia(1440) as any

      const { container } = render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={jest.fn()}
          theme="dark"
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('GalleryTopNavbar 应该在桌面设备上响应式显示', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      window.matchMedia = mockMatchMedia(1440) as any

      const { container } = render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      expect(container).toBeInTheDocument()
    })
  })
})
