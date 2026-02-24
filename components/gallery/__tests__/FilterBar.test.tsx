import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import FilterBar from '../FilterBar'
import { FilterType } from '@/lib/types/homepage-gallery'

/**
 * 属性 1: 3D 筛选一致性
 * 属性 2: 2D 筛选一致性
 * 属性 3: 模板筛选一致性
 * 属性 4: 多条件筛选组合
 * 属性 5: 筛选清除幂等性
 * 验证: 需求 2.2, 2.3, 2.4, 2.5, 2.6
 */
describe('FilterBar - 筛选一致性属性测试', () => {
  it('属性 1: 3D 筛选应该只显示 3D 图谱', () => {
    const mockOnFilterChange = jest.fn()

    render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 点击 3D 图谱按钮
    const button3d = screen.getByText(/3D 图谱/)
    fireEvent.click(button3d)

    // 应该调用 onFilterChange，传入 ['3d']
    expect(mockOnFilterChange).toHaveBeenCalledWith(['3d'])
  })

  it('属性 2: 2D 筛选应该只显示 2D 图谱', () => {
    const mockOnFilterChange = jest.fn()

    render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 点击 2D 图谱按钮
    const button2d = screen.getByText(/2D 图谱/)
    fireEvent.click(button2d)

    // 应该调用 onFilterChange，传入 ['2d']
    expect(mockOnFilterChange).toHaveBeenCalledWith(['2d'])
  })

  it('属性 3: 模板筛选应该只显示模板', () => {
    const mockOnFilterChange = jest.fn()

    render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 点击热门模板按钮
    const buttonTemplate = screen.getByText(/热门模板/)
    fireEvent.click(buttonTemplate)

    // 应该调用 onFilterChange，传入 ['template']
    expect(mockOnFilterChange).toHaveBeenCalledWith(['template'])
  })

  it('属性 4: 多条件筛选应该支持组合', () => {
    const mockOnFilterChange = jest.fn()

    render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 点击 3D 图谱
    const button3d = screen.getByText(/3D 图谱/)
    fireEvent.click(button3d)

    expect(mockOnFilterChange).toHaveBeenLastCalledWith(['3d'])

    // 再点击 2D 图谱
    const button2d = screen.getByText(/2D 图谱/)
    fireEvent.click(button2d)

    // 应该包含两个筛选条件
    expect(mockOnFilterChange).toHaveBeenLastCalledWith(['3d', '2d'])
  })

  it('属性 5: 筛选清除应该是幂等的', () => {
    const mockOnFilterChange = jest.fn()

    const { rerender } = render(
      <FilterBar
        activeFilters={['3d', '2d']}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 点击清除筛选
    const clearButton = screen.getByText(/清除筛选/)
    fireEvent.click(clearButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith([])

    // 重新渲染，清除筛选后再清除一次
    rerender(
      <FilterBar
        activeFilters={[]}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 清除按钮不应该存在
    expect(screen.queryByText(/清除筛选/)).not.toBeInTheDocument()
  })

  it('应该显示活跃筛选指示器', () => {
    render(
      <FilterBar
        activeFilters={['3d']}
        onFilterChange={jest.fn()}
        theme="dark"
      />
    )

    // 应该显示"已应用 1 个筛选"
    expect(screen.getByText(/已应用 1 个筛选/)).toBeInTheDocument()
  })

  it('应该支持切换筛选', () => {
    const mockOnFilterChange = jest.fn()

    render(
      <FilterBar
        activeFilters={['3d']}
        onFilterChange={mockOnFilterChange}
        theme="dark"
      />
    )

    // 再次点击 3D 图谱应该移除筛选
    const button3d = screen.getByText(/3D 图谱/)
    fireEvent.click(button3d)

    // 应该调用 onFilterChange，传入空数组
    expect(mockOnFilterChange).toHaveBeenCalledWith([])
  })

  it('应该支持亮色和暗色主题', () => {
    const { rerender } = render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={jest.fn()}
        theme="dark"
      />
    )

    // 暗色主题应该正常渲染
    expect(screen.getByText(/筛选:/)).toBeInTheDocument()

    // 重新渲染为亮色主题
    rerender(
      <FilterBar
        activeFilters={[]}
        onFilterChange={jest.fn()}
        theme="light"
      />
    )

    // 亮色主题也应该正常渲染
    expect(screen.getByText(/筛选:/)).toBeInTheDocument()
  })

  it('应该在没有筛选时不显示清除按钮', () => {
    render(
      <FilterBar
        activeFilters={[]}
        onFilterChange={jest.fn()}
        theme="dark"
      />
    )

    // 清除按钮不应该存在
    expect(screen.queryByText(/清除筛选/)).not.toBeInTheDocument()
  })

  it('应该在有筛选时显示清除按钮', () => {
    render(
      <FilterBar
        activeFilters={['3d']}
        onFilterChange={jest.fn()}
        theme="dark"
      />
    )

    // 清除按钮应该存在
    expect(screen.getByText(/清除筛选/)).toBeInTheDocument()
  })

  it('属性测试: 随机筛选组合应该正确处理', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.constant('3d' as FilterType),
            fc.constant('2d' as FilterType),
            fc.constant('template' as FilterType)
          ),
          { maxLength: 3, uniqueBy: (x) => x }
        ),
        async (filters) => {
          const mockOnFilterChange = jest.fn()

          render(
            <FilterBar
              activeFilters={filters}
              onFilterChange={mockOnFilterChange}
              theme="dark"
            />
          )

          // 如果有筛选，应该显示清除按钮
          if (filters.length > 0) {
            expect(screen.getByText(/清除筛选/)).toBeInTheDocument()
            expect(screen.getByText(new RegExp(`已应用 ${filters.length} 个筛选`))).toBeInTheDocument()
          } else {
            expect(screen.queryByText(/清除筛选/)).not.toBeInTheDocument()
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})
