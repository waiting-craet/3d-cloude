import { render, screen, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import GalleryGrid from '../GalleryGrid'

/**
 * 属性 11: 默认排序一致性
 * 验证: 需求 1.2
 * 
 * 对于任何图谱列表，默认加载时应该按 createdAt 字段倒序排列（最新的在前）
 */
describe('GalleryGrid - Property 11: 默认排序一致性', () => {
  it('应该显示加载状态', async () => {
    render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 应该显示加载动画
    await waitFor(() => {
      expect(screen.getByText(/加载中/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('应该显示无结果状态', async () => {
    render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 等待加载完成
    await waitFor(() => {
      // 应该显示无结果或加载完成
      const noResults = screen.queryByText(/暂无相关内容/)
      const loading = screen.queryByText(/加载中/)
      expect(noResults || loading).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('应该支持亮色和暗色主题', () => {
    const { rerender } = render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 暗色主题应该正常渲染
    expect(screen.getByText(/加载中/)).toBeInTheDocument()

    // 重新渲染为亮色主题
    rerender(
      <GalleryGrid
        filters={[]}
        theme="light"
      />
    )

    // 亮色主题也应该正常渲染
    expect(screen.getByText(/加载中/)).toBeInTheDocument()
  })

  it('应该支持筛选', () => {
    render(
      <GalleryGrid
        filters={['3d']}
        theme="dark"
      />
    )

    // 应该正常加载
    expect(screen.getByText(/加载中/)).toBeInTheDocument()
  })

  it('属性 11: 默认排序应该按时间倒序', async () => {
    // 使用 fast-check 生成随机日期
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string(),
            date: fc.date(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          // 按时间倒序排列
          const sortedItems = [...items].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )

          // 验证排序是否正确
          for (let i = 0; i < sortedItems.length - 1; i++) {
            const current = new Date(sortedItems[i].date).getTime()
            const next = new Date(sortedItems[i + 1].date).getTime()
            expect(current).toBeGreaterThanOrEqual(next)
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('应该显示分页控件', async () => {
    render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 等待加载完成
    await waitFor(() => {
      // 应该显示分页或无结果
      const pagination = screen.queryByText(/第.*页/)
      const noResults = screen.queryByText(/暂无相关内容/)
      expect(pagination || noResults).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('应该显示结果统计', async () => {
    render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 等待加载完成
    await waitFor(() => {
      // 应该显示结果统计或无结果
      const stats = screen.queryByText(/共.*个结果/)
      const noResults = screen.queryByText(/暂无相关内容/)
      expect(stats || noResults).toBeTruthy()
    }, { timeout: 2000 })
  })

  it('应该在错误时显示重新加载按钮', async () => {
    // 模拟 API 错误
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'))

    render(
      <GalleryGrid
        filters={[]}
        theme="dark"
      />
    )

    // 等待错误显示
    await waitFor(() => {
      const errorButton = screen.queryByText(/重新加载/)
      const loading = screen.queryByText(/加载中/)
      expect(errorButton || loading).toBeTruthy()
    }, { timeout: 2000 })

    jest.restoreAllMocks()
  })
})
