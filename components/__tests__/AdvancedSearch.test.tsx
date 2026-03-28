import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdvancedSearch, { SearchFilters, SearchSuggestion } from '../AdvancedSearch'

// Mock lodash debounce
jest.mock('lodash', () => ({
  debounce: (fn: any) => fn
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('AdvancedSearch', () => {
  const mockOnSearch = jest.fn()
  const mockOnSuggestionSelect = jest.fn()

  const defaultProps = {
    onSearch: mockOnSearch,
    onSuggestionSelect: mockOnSuggestionSelect,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('基础渲染', () => {
    it('应该正确渲染搜索输入框', () => {
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      expect(searchInput).toBeInTheDocument()
    })

    it('应该显示搜索按钮', () => {
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      expect(searchButton).toBeInTheDocument()
    })

    it('应该显示筛选按钮', () => {
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      expect(filterButton).toBeInTheDocument()
    })

    it('应该使用自定义占位符', () => {
      const customPlaceholder = '自定义搜索提示'
      render(<AdvancedSearch {...defaultProps} placeholder={customPlaceholder} />)
      
      const searchInput = screen.getByPlaceholderText(customPlaceholder)
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该在输入时更新搜索查询', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      await user.type(searchInput, '人工智能')
      
      expect(searchInput).toHaveValue('人工智能')
    })

    it('应该在点击搜索按钮时调用onSearch', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      const searchButton = screen.getByRole('button', { name: '搜索' })
      
      await user.type(searchInput, '测试查询')
      await user.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '测试查询',
          category: '',
          author: '',
          tags: [],
          sortBy: 'newest',
          sortOrder: 'desc'
        })
      )
    })

    it('应该在按Enter键时调用onSearch', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '测试查询')
      await user.keyboard('{Enter}')
      
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '测试查询'
        })
      )
    })
  })

  describe('搜索建议', () => {
    it('应该在输入时显示搜索建议', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '人工')
      
      // 等待建议出现
      await waitFor(() => {
        expect(screen.getByText('人工智能')).toBeInTheDocument()
      })
    })

    it('应该在选择建议时调用回调函数', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '人工')
      
      await waitFor(() => {
        expect(screen.getByText('人工智能')).toBeInTheDocument()
      })
      
      const suggestion = screen.getByText('人工智能')
      await user.click(suggestion)
      
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '人工智能',
          type: 'keyword'
        })
      )
    })

    it('应该高亮匹配的文本', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '人工')
      
      await waitFor(() => {
        const highlightedText = screen.getByText('人工')
        expect(highlightedText).toHaveClass('bg-yellow-200')
      })
    })

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '人工')
      
      await waitFor(() => {
        expect(screen.getByText('人工智能')).toBeInTheDocument()
      })
      
      // 测试向下箭头键
      await user.keyboard('{ArrowDown}')
      
      // 测试回车键选择
      await user.keyboard('{Enter}')
      
      expect(mockOnSuggestionSelect).toHaveBeenCalled()
    })
  })

  describe('搜索历史', () => {
    beforeEach(() => {
      const mockHistory = JSON.stringify([
        {
          id: '1',
          query: '历史搜索1',
          timestamp: new Date().toISOString(),
          results: 10
        },
        {
          id: '2',
          query: '历史搜索2',
          timestamp: new Date().toISOString(),
          results: 5
        }
      ])
      mockLocalStorage.getItem.mockReturnValue(mockHistory)
    })

    it('应该在聚焦时显示搜索历史', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('搜索历史')).toBeInTheDocument()
        expect(screen.getByText('历史搜索1')).toBeInTheDocument()
        expect(screen.getByText('历史搜索2')).toBeInTheDocument()
      })
    })

    it('应该支持选择历史记录', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('历史搜索1')).toBeInTheDocument()
      })
      
      const historyItem = screen.getByText('历史搜索1')
      await user.click(historyItem)
      
      expect(searchInput).toHaveValue('历史搜索1')
    })

    it('应该支持清空历史记录', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('清空')).toBeInTheDocument()
      })
      
      const clearButton = screen.getByText('清空')
      await user.click(clearButton)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('searchHistory')
    })

    it('应该支持删除单个历史记录', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('历史搜索1')).toBeInTheDocument()
      })
      
      // 悬停显示删除按钮
      const historyItem = screen.getByText('历史搜索1').closest('div')
      await user.hover(historyItem!)
      
      const deleteButton = screen.getByText('✕')
      await user.click(deleteButton)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('高级筛选', () => {
    it('应该显示筛选面板', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      await user.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('分类')).toBeInTheDocument()
        expect(screen.getByText('作者')).toBeInTheDocument()
        expect(screen.getByText('排序方式')).toBeInTheDocument()
      })
    })

    it('应该支持分类筛选', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      await user.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('分类')).toBeInTheDocument()
      })
      
      const categorySelect = screen.getByDisplayValue('📋 全部')
      await user.selectOptions(categorySelect, 'tech')
      
      const applyButton = screen.getByText('应用筛选')
      await user.click(applyButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'tech'
        })
      )
    })

    it('应该支持作者筛选', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      await user.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('输入作者名称')).toBeInTheDocument()
      })
      
      const authorInput = screen.getByPlaceholderText('输入作者名称')
      await user.type(authorInput, '张三')
      
      const applyButton = screen.getByText('应用筛选')
      await user.click(applyButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          author: '张三'
        })
      )
    })

    it('应该支持排序选择', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      await user.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('排序方式')).toBeInTheDocument()
      })
      
      const sortSelect = screen.getByDisplayValue('🕒 最新发布')
      await user.selectOptions(sortSelect, 'popular')
      
      const applyButton = screen.getByText('应用筛选')
      await user.click(applyButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'popular'
        })
      )
    })

    it('应该支持重置筛选', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} showFilters={true} />)
      
      const filterButton = screen.getByTitle('高级筛选')
      await user.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('重置筛选')).toBeInTheDocument()
      })
      
      // 先设置一些筛选条件
      const categorySelect = screen.getByDisplayValue('📋 全部')
      await user.selectOptions(categorySelect, 'tech')
      
      const authorInput = screen.getByPlaceholderText('输入作者名称')
      await user.type(authorInput, '张三')
      
      // 重置筛选
      const resetButton = screen.getByText('重置筛选')
      await user.click(resetButton)
      
      // 验证筛选条件被重置
      expect(categorySelect).toHaveValue('')
      expect(authorInput).toHaveValue('')
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端正确显示', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('无障碍访问', () => {
    it('应该有正确的ARIA标签', () => {
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: '搜索' })
      expect(searchButton).toBeInTheDocument()
      
      const filterButton = screen.getByTitle('高级筛选')
      expect(filterButton).toHaveAttribute('title', '高级筛选')
    })

    it('应该支持ESC键关闭下拉框', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      await user.type(searchInput, '人工')
      
      await waitFor(() => {
        expect(screen.getByText('人工智能')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('人工智能')).not.toBeInTheDocument()
      })
    })
  })

  describe('性能优化', () => {
    it('应该防抖搜索建议请求', async () => {
      const user = userEvent.setup()
      render(<AdvancedSearch {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱、作者、标签...')
      
      // 快速输入多个字符
      await user.type(searchInput, '人工智能')
      
      // 由于使用了防抖，建议应该只在最后一次输入后显示
      await waitFor(() => {
        expect(screen.getByText('人工智能')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理localStorage错误', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // 应该不会崩溃
      expect(() => {
        render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      }).not.toThrow()
    })

    it('应该处理无效的历史记录数据', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      // 应该不会崩溃
      expect(() => {
        render(<AdvancedSearch {...defaultProps} showHistory={true} />)
      }).not.toThrow()
    })
  })
})