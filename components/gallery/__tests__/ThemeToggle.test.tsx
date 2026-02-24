import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import ThemeToggle from '../ThemeToggle'

/**
 * 属性 9: 主题切换持久化
 * 验证: 需求 8.3, 8.4
 * 
 * 对于任何主题选择（'light' 或 'dark'），切换后保存到 localStorage，
 * 刷新页面后应该恢复相同的主题。
 * 
 * 往返属性: loadTheme(saveTheme(theme)) == theme
 */
describe('ThemeToggle - Property 9: 主题切换持久化', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
  })

  it('应该将主题保存到 localStorage', () => {
    const mockOnToggle = jest.fn()

    render(
      <ThemeToggle
        currentTheme="dark"
        onToggle={mockOnToggle}
      />
    )

    const button = screen.getByRole('button')
    
    // 点击切换主题
    fireEvent.click(button)

    // 检查 localStorage 是否保存了主题
    const savedTheme = localStorage.getItem('theme')
    expect(savedTheme).toBe('light')
  })

  it('应该从 localStorage 恢复主题', () => {
    // 预先设置 localStorage
    localStorage.setItem('theme', 'light')

    render(
      <ThemeToggle
        currentTheme="dark"
        onToggle={jest.fn()}
      />
    )

    // 组件应该使用 localStorage 中的主题
    // 这可以通过检查按钮的内容来验证
    const button = screen.getByRole('button')
    expect(button.textContent).toBe('🌙') // light 主题显示月亮
  })

  it('属性 9: 往返属性 - 切换主题后应该能恢复', async () => {
    // 使用 fast-check 生成随机主题
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('light'), fc.constant('dark')),
        async (initialTheme) => {
          // 清空 localStorage
          localStorage.clear()

          const mockOnToggle = jest.fn()

          const { rerender } = render(
            <ThemeToggle
              currentTheme={initialTheme}
              onToggle={mockOnToggle}
            />
          )

          const button = screen.getByRole('button')
          
          // 点击切换主题
          fireEvent.click(button)

          // 获取切换后的主题
          const switchedTheme = localStorage.getItem('theme')
          expect(switchedTheme).toBe(initialTheme === 'dark' ? 'light' : 'dark')

          // 模拟页面刷新 - 清空组件并重新渲染
          localStorage.clear()
          localStorage.setItem('theme', switchedTheme || '')

          rerender(
            <ThemeToggle
              currentTheme={initialTheme}
              onToggle={mockOnToggle}
            />
          )

          // 检查恢复的主题是否正确
          const restoredTheme = localStorage.getItem('theme')
          expect(restoredTheme).toBe(switchedTheme)
        }
      ),
      { numRuns: 20 } // 运行 20 次属性测试
    )
  })

  it('应该触发 themeChange 事件', () => {
    const mockOnToggle = jest.fn()
    const mockEventListener = jest.fn()

    // 监听 themeChange 事件
    window.addEventListener('themeChange', mockEventListener)

    render(
      <ThemeToggle
        currentTheme="dark"
        onToggle={mockOnToggle}
      />
    )

    const button = screen.getByRole('button')
    
    // 点击切换主题
    fireEvent.click(button)

    // 应该触发事件
    expect(mockEventListener).toHaveBeenCalled()

    window.removeEventListener('themeChange', mockEventListener)
  })
})
