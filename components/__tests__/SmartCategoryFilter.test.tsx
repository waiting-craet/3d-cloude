import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SmartCategoryFilter, { Category, SmartCategoryFilterProps } from '../SmartCategoryFilter'

// 模拟数据
const mockCategories: Category[] = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'tech', name: '科技', icon: '💻', color: '#2196F3' },
  { id: 'education', name: '教育', icon: '🎓', color: '#4CAF50' },
  { id: 'business', name: '商业', icon: '💼', color: '#FF9800' },
  { id: 'art', name: '艺术', icon: '🎨', color: '#E91E63' },
  { id: 'medical', name: '医疗', icon: '⚕️', color: '#009688' },
  { id: 'other', name: '其他', icon: '📋', color: '#607D8B' }
]

const mockWorkCount = {
  all: 120,
  tech: 45,
  education: 32,
  business: 28,
  art: 15,
  medical: 8,
  other: 12
}

const defaultProps: SmartCategoryFilterProps = {
  categories: mockCategories,
  selectedCategory: 'all',
  onCategoryChange: jest.fn(),
  workCount: mockWorkCount
}

describe('SmartCategoryFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染所有分类按钮', () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      mockCategories.forEach(category => {
        expect(screen.getByRole('tab', { name: new RegExp(category.name) })).toBeInTheDocument()
      })
    })

    it('应该显示分类图标', () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      mockCategories.forEach(category => {
        if (category.icon) {
          expect(screen.getByText(category.icon)).toBeInTheDocument()
        }
      })
    })

    it('应该显示作品数量', () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      Object.entries(mockWorkCount).forEach(([categoryId, count]) => {
        const category = mockCategories.find(c => c.id === categoryId)
        if (category) {
          expect(screen.getByLabelText(`${count} 个作品`)).toBeInTheDocument()
        }
      })
    })

    it('应该正确标记选中的分类', () => {
      render(<SmartCategoryFilter {...defaultProps} selectedCategory="tech" />)
      
      const techButton = screen.getByRole('tab', { name: /科技/ })
      expect(techButton).toHaveAttribute('aria-selected', 'true')
      expect(techButton).toHaveAttribute('tabIndex', '0')
      
      const allButton = screen.getByRole('tab', { name: /全部/ })
      expect(allButton).toHaveAttribute('aria-selected', 'false')
      expect(allButton).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('交互功能', () => {
    it('应该在点击分类时调用回调函数', async () => {
      const onCategoryChange = jest.fn()
      render(<SmartCategoryFilter {...defaultProps} onCategoryChange={onCategoryChange} />)
      
      const techButton = screen.getByRole('tab', { name: /科技/ })
      await userEvent.click(techButton)
      
      expect(onCategoryChange).toHaveBeenCalledWith('tech')
    })

    it('应该支持键盘导航', async () => {
      const onCategoryChange = jest.fn()
      render(<SmartCategoryFilter {...defaultProps} onCategoryChange={onCategoryChange} />)
      
      const allButton = screen.getByRole('tab', { name: /全部/ })
      allButton.focus()
      
      // 测试右箭头键
      await userEvent.keyboard('{ArrowRight}')
      expect(screen.getByRole('tab', { name: /科技/ })).toHaveFocus()
      
      // 测试左箭头键
      await userEvent.keyboard('{ArrowLeft}')
      expect(allButton).toHaveFocus()
      
      // 测试 Enter 键选择
      await userEvent.keyboard('{Enter}')
      expect(onCategoryChange).toHaveBeenCalledWith('all')
    })

    it('应该支持 Home 和 End 键导航', async () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      const techButton = screen.getByRole('tab', { name: /科技/ })
      techButton.focus()
      
      // 测试 Home 键
      await userEvent.keyboard('{Home}')
      expect(screen.getByRole('tab', { name: /全部/ })).toHaveFocus()
      
      // 测试 End 键
      await userEvent.keyboard('{End}')
      expect(screen.getByRole('tab', { name: /其他/ })).toHaveFocus()
    })

    it('应该支持空格键选择', async () => {
      const onCategoryChange = jest.fn()
      render(<SmartCategoryFilter {...defaultProps} onCategoryChange={onCategoryChange} />)
      
      const techButton = screen.getByRole('tab', { name: /科技/ })
      techButton.focus()
      
      await userEvent.keyboard(' ')
      expect(onCategoryChange).toHaveBeenCalledWith('tech')
    })
  })

  describe('加载状态', () => {
    it('应该在加载时禁用按钮', () => {
      render(<SmartCategoryFilter {...defaultProps} loading={true} />)
      
      mockCategories.forEach(category => {
        const button = screen.getByRole('tab', { name: new RegExp(category.name) })
        expect(button).toBeDisabled()
      })
    })

    it('应该在加载时显示骨架屏', () => {
      render(<SmartCategoryFilter {...defaultProps} loading={true} />)
      
      const skeletons = document.querySelectorAll('.countSkeleton')
      expect(skeletons).toHaveLength(mockCategories.length)
    })
  })

  describe('配置选项', () => {
    it('应该支持隐藏作品数量', () => {
      render(<SmartCategoryFilter {...defaultProps} showCount={false} />)
      
      Object.values(mockWorkCount).forEach(count => {
        expect(screen.queryByLabelText(`${count} 个作品`)).not.toBeInTheDocument()
      })
    })

    it('应该支持不同的尺寸', () => {
      const { rerender } = render(<SmartCategoryFilter {...defaultProps} size="small" />)
      
      const container = document.querySelector('.container')
      expect(container?.querySelector('.size-small')).toBeInTheDocument()
      
      rerender(<SmartCategoryFilter {...defaultProps} size="large" />)
      expect(container?.querySelector('.size-large')).toBeInTheDocument()
    })

    it('应该支持不同的样式变体', () => {
      const { rerender } = render(<SmartCategoryFilter {...defaultProps} variant="tabs" />)
      
      const container = document.querySelector('.container')
      expect(container?.querySelector('.variant-tabs')).toBeInTheDocument()
      
      rerender(<SmartCategoryFilter {...defaultProps} variant="default" />)
      expect(container?.querySelector('.variant-default')).toBeInTheDocument()
    })

    it('应该支持禁用动画', () => {
      render(<SmartCategoryFilter {...defaultProps} animated={false} />)
      
      const buttons = document.querySelectorAll('.categoryButton')
      buttons.forEach(button => {
        expect(button).not.toHaveClass('animated')
      })
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 属性', () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      const container = screen.getByRole('tablist')
      expect(container).toHaveAttribute('aria-label', '分类筛选器')
      
      mockCategories.forEach(category => {
        const button = screen.getByRole('tab', { name: new RegExp(category.name) })
        expect(button).toHaveAttribute('aria-controls', `category-panel-${category.id}`)
      })
    })

    it('应该支持屏幕阅读器', () => {
      render(<SmartCategoryFilter {...defaultProps} />)
      
      mockCategories.forEach(category => {
        const count = mockWorkCount[category.id]
        if (count !== undefined) {
          expect(screen.getByLabelText(`${count} 个作品`)).toBeInTheDocument()
        }
      })
    })
  })

  describe('边界情况', () => {
    it('应该处理空分类列表', () => {
      render(<SmartCategoryFilter {...defaultProps} categories={[]} />)
      
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    })

    it('应该处理缺失的作品数量', () => {
      render(<SmartCategoryFilter {...defaultProps} workCount={{}} />)
      
      const zeroCountElements = screen.getAllByLabelText('0 个作品')
      expect(zeroCountElements).toHaveLength(mockCategories.length)
    })

    it('应该处理无效的选中分类', () => {
      render(<SmartCategoryFilter {...defaultProps} selectedCategory="invalid" />)
      
      // 所有按钮都应该是未选中状态
      mockCategories.forEach(category => {
        const button = screen.getByRole('tab', { name: new RegExp(category.name) })
        expect(button).toHaveAttribute('aria-selected', 'false')
        expect(button).toHaveAttribute('tabIndex', '-1')
      })
    })
  })

  describe('性能优化', () => {
    it('应该正确处理大量分类', () => {
      const manyCategories = Array.from({ length: 50 }, (_, i) => ({
        id: `category-${i}`,
        name: `分类 ${i}`,
        icon: '📁'
      }))
      
      const manyWorkCount = Object.fromEntries(
        manyCategories.map(cat => [cat.id, Math.floor(Math.random() * 100)])
      )
      
      render(
        <SmartCategoryFilter
          {...defaultProps}
          categories={manyCategories}
          workCount={manyWorkCount}
        />
      )
      
      expect(screen.getAllByRole('tab')).toHaveLength(50)
    })
  })
})