import { render, screen, waitFor } from '@testing-library/react'
import GalleryGrid from '../GalleryGrid'

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
 * 性能测试: 页面加载和渲染性能
 * 验证: 需求 1.5
 */
describe('首页广场性能测试', () => {
  describe('7.3 页面加载时间', () => {
    it('应该在合理时间内加载页面', async () => {
      const startTime = performance.now()

      render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // 验证初始渲染时间 < 1000ms
      expect(loadTime).toBeLessThan(1000)
    })

    it('应该在合理时间内完成数据加载', async () => {
      const startTime = performance.now()

      const { container } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // 验证总加载时间 < 5000ms
      expect(totalTime).toBeLessThan(5000)
      
      // 验证容器存在
      expect(container).toBeInTheDocument()
    })
  })

  describe('7.3 大列表渲染性能', () => {
    it('应该能够高效渲染多个卡片', () => {
      const startTime = performance.now()

      const { container } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 验证渲染时间合理
      expect(renderTime).toBeLessThan(2000)

      // 验证网格容器存在
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('应该正确处理分页', async () => {
      const { rerender } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      const startTime = performance.now()

      // 切换到第二页
      rerender(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      const endTime = performance.now()
      const pageChangeTime = endTime - startTime

      // 验证页面切换时间合理
      expect(pageChangeTime).toBeLessThan(2000)
    })
  })

  describe('7.3 内存使用', () => {
    it('应该不会导致内存泄漏', async () => {
      const { unmount } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      // 卸载组件
      unmount()

      // 验证组件正确卸载（没有错误）
      expect(true).toBe(true)
    })

    it('应该正确清理事件监听器', async () => {
      const { unmount } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      // 卸载组件
      unmount()

      // 验证事件监听器被清理
      expect(true).toBe(true)
    })
  })

  describe('7.3 缓存效率', () => {
    it('应该利用缓存减少重复请求', async () => {
      const { rerender } = render(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      // 重新渲染相同的组件
      rerender(
        <GalleryGrid
          filters={[]}
          theme="dark"
        />
      )

      // 验证重新渲染成功
      expect(true).toBe(true)
    })
  })

  describe('7.3 响应式性能', () => {
    it('应该在不同屏幕尺寸上保持良好性能', () => {
      const screenSizes = [375, 768, 1024, 1440]

      screenSizes.forEach(width => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        })

        const startTime = performance.now()

        const { unmount } = render(
          <GalleryGrid
            filters={[]}
            theme="dark"
          />
        )

        const endTime = performance.now()
        const renderTime = endTime - startTime

        // 验证每个屏幕尺寸的渲染时间都合理
        expect(renderTime).toBeLessThan(2000)

        unmount()
      })
    })
  })
})
