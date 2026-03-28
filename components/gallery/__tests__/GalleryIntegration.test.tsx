import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GalleryTopNavbar from '../../GalleryTopNavbar'
import FilterBar from '../FilterBar'

// 模拟 Next.js 路由
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
 * 集成测试: 首页广场完整流程
 * 验证: 需求 1.1, 2.1, 3.1, 4.1, 5.1
 */
describe('首页广场集成测试', () => {
  describe('7.1 首页完整加载流程', () => {
    it('应该正确加载导航栏和筛选栏', () => {
      const { container } = render(
        <>
          <GalleryTopNavbar
            currentTheme="dark"
            onThemeToggle={jest.fn()}
            onCreateClick={jest.fn()}
            onCommunityClick={jest.fn()}
          />
          <FilterBar
            activeFilters={[]}
            onFilterChange={jest.fn()}
            theme="dark"
          />
        </>
      )

      // 验证导航栏存在
      expect(screen.getByText(/知识图谱广场/)).toBeInTheDocument()

      // 验证筛选栏存在
      expect(screen.getByText(/3D/)).toBeInTheDocument()
    })

    it('应该正确显示导航栏中的所有功能按钮', () => {
      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      // 验证开始创作按钮
      expect(screen.getByText(/开始创作/)).toBeInTheDocument()

      // 验证社区按钮
      expect(screen.getByText(/社区/)).toBeInTheDocument()
    })
  })

  describe('7.1 筛选和搜索交互', () => {
    it('应该能够切换筛选条件', async () => {
      const handleFilterChange = jest.fn()

      render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={handleFilterChange}
          theme="dark"
        />
      )

      // 点击 3D 筛选按钮
      const filter3DButton = screen.getByText(/3D/)
      fireEvent.click(filter3DButton)

      // 验证回调被调用
      await waitFor(() => {
        expect(handleFilterChange).toHaveBeenCalled()
      })
    })

    it('应该能够同时选择多个筛选条件', async () => {
      const handleFilterChange = jest.fn()

      render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={handleFilterChange}
          theme="dark"
        />
      )

      // 点击多个筛选按钮
      const filter3DButton = screen.getByText(/3D/)
      const filter2DButton = screen.getByText(/2D/)

      fireEvent.click(filter3DButton)
      fireEvent.click(filter2DButton)

      // 验证回调被多次调用
      await waitFor(() => {
        expect(handleFilterChange).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('7.1 用户菜单操作', () => {
    it('应该在未登录时显示登录按钮', () => {
      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      // 验证登录按钮存在（未登录状态）
      expect(screen.getByText(/登录/)).toBeInTheDocument()
    })

    it('应该在登录时显示用户菜单按钮', () => {
      // 模拟登录状态
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('adminUsername', 'testuser')

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      // 验证用户菜单按钮存在（已登录状态）
      expect(screen.getByText(/👤/)).toBeInTheDocument()

      // 清理
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('adminUsername')
    })

    it('应该能够点击开始创作按钮（已登录）', async () => {
      const handleCreateClick = jest.fn()

      // 模拟登录状态
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('adminUsername', 'testuser')

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={handleCreateClick}
          onCommunityClick={jest.fn()}
        />
      )

      const createButton = screen.getByText(/开始创作/)
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(handleCreateClick).toHaveBeenCalled()
      })

      // 清理
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('adminUsername')
    })
  })

  describe('7.1 响应式交互', () => {
    it('应该在移动设备上显示汉堡菜单', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      // 验证汉堡菜单按钮存在
      expect(screen.getByText(/☰/)).toBeInTheDocument()
    })

    it('应该能够打开和关闭移动菜单', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={jest.fn()}
        />
      )

      const hamburgerButton = screen.getByText(/☰/)

      // 打开菜单
      fireEvent.click(hamburgerButton)

      // 验证菜单项出现
      await waitFor(() => {
        expect(screen.getByText(/开始创作/)).toBeInTheDocument()
      })

      // 关闭菜单
      fireEvent.click(hamburgerButton)
    })
  })

  describe('7.1 主题切换', () => {
    it('应该正确处理主题变化', () => {
      const { rerender } = render(
        <FilterBar
          activeFilters={[]}
          onFilterChange={jest.fn()}
          theme="dark"
        />
      )

      // 验证深色主题
      expect(screen.getByText(/3D/)).toBeInTheDocument()

      // 切换到浅色主题
      rerender(
        <FilterBar
          activeFilters={[]}
          onFilterChange={jest.fn()}
          theme="light"
        />
      )

      // 验证浅色主题
      expect(screen.getByText(/3D/)).toBeInTheDocument()
    })
  })

  describe('7.1 导航功能', () => {
    it('应该能够点击社区按钮', async () => {
      // 确保在桌面模式
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      const handleCommunityClick = jest.fn()

      render(
        <GalleryTopNavbar
          currentTheme="dark"
          onThemeToggle={jest.fn()}
          onCreateClick={jest.fn()}
          onCommunityClick={handleCommunityClick}
        />
      )

      const communityButton = screen.getByText(/社区/)
      fireEvent.click(communityButton)

      await waitFor(() => {
        expect(handleCommunityClick).toHaveBeenCalled()
      })
    })
  })
})
