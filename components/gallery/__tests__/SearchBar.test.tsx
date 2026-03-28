import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import SearchBar from '../SearchBar'

/**
 * 属性 6: 搜索建议准确性
 * 验证: 需求 6.2
 * 
 * 对于任何搜索关键词，返回的所有建议的标题都应该包含该关键词（不区分大小写）
 */
describe('SearchBar - Property 6: 搜索建议准确性', () => {
  it('应该返回包含搜索关键词的建议', async () => {
    // 使用 fast-check 生成随机搜索关键词
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (searchQuery) => {
          const mockOnSearch = jest.fn()
          const mockOnSuggestionClick = jest.fn()

          render(
            <SearchBar
              onSearch={mockOnSearch}
              onSuggestionClick={mockOnSuggestionClick}
              theme="dark"
            />
          )

          const input = screen.getByPlaceholderText(/搜索图谱/)
          
          // 输入搜索关键词
          fireEvent.change(input, { target: { value: searchQuery } })
          fireEvent.focus(input)

          // 等待搜索建议加载
          await waitFor(() => {
            // 如果有建议显示，验证它们都包含搜索关键词
            const suggestions = screen.queryAllByRole('button')
            suggestions.forEach((suggestion) => {
              const text = suggestion.textContent || ''
              // 建议应该包含搜索关键词（不区分大小写）
              if (text && text.length > 0) {
                expect(
                  text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  text.includes('未找到相关结果')
                ).toBe(true)
              }
            })
          }, { timeout: 1000 })
        }
      ),
      { numRuns: 50 } // 运行 50 次属性测试
    )
  })

  it('应该在搜索为空时不显示建议', () => {
    const mockOnSearch = jest.fn()
    const mockOnSuggestionClick = jest.fn()

    render(
      <SearchBar
        onSearch={mockOnSearch}
        onSuggestionClick={mockOnSuggestionClick}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText(/搜索图谱/)
    
    // 输入空字符串
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.focus(input)

    // 不应该显示建议
    expect(screen.queryByText(/未找到相关结果/)).not.toBeInTheDocument()
  })

  it('应该支持按 Enter 键搜索', () => {
    const mockOnSearch = jest.fn()
    const mockOnSuggestionClick = jest.fn()

    render(
      <SearchBar
        onSearch={mockOnSearch}
        onSuggestionClick={mockOnSuggestionClick}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText(/搜索图谱/) as HTMLInputElement
    
    // 输入搜索关键词
    fireEvent.change(input, { target: { value: 'test' } })
    
    // 按 Enter 键
    fireEvent.keyDown(input, { key: 'Enter' })

    // 应该调用 onSearch
    expect(mockOnSearch).toHaveBeenCalledWith('test')
  })

  it('应该支持按 Escape 键清空搜索', () => {
    const mockOnSearch = jest.fn()
    const mockOnSuggestionClick = jest.fn()

    render(
      <SearchBar
        onSearch={mockOnSearch}
        onSuggestionClick={mockOnSuggestionClick}
        theme="dark"
      />
    )

    const input = screen.getByPlaceholderText(/搜索图谱/) as HTMLInputElement
    
    // 输入搜索关键词
    fireEvent.change(input, { target: { value: 'test' } })
    
    // 按 Escape 键
    fireEvent.keyDown(input, { key: 'Escape' })

    // 输入框应该被清空
    expect(input.value).toBe('')
  })
})
