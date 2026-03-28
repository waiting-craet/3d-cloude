import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HelpMenu from '../HelpMenu'

/**
 * 属性 15: 帮助菜单完整性
 * 验证: 需求 9.3
 * 
 * 对于任何用户，点击帮助图标后显示的菜单应该包含
 * "快速入门"、"文档"、"常见问题"、"联系支持"这四个选项
 */
describe('HelpMenu - Property 15: 帮助菜单完整性', () => {
  it('属性 15: 帮助菜单应该包含所有必需选项', async () => {
    render(<HelpMenu theme="dark" />)

    // 点击帮助菜单按钮
    const helpButton = screen.getByRole('button', { name: /❓/ })
    fireEvent.click(helpButton)

    // 等待菜单显示
    await waitFor(() => {
      // 验证所有必需的菜单项都存在
      expect(screen.getByText('快速入门')).toBeInTheDocument()
      expect(screen.getByText('文档')).toBeInTheDocument()
      expect(screen.getByText('常见问题')).toBeInTheDocument()
      expect(screen.getByText('联系支持')).toBeInTheDocument()
    })
  })

  it('应该显示帮助菜单按钮', () => {
    render(<HelpMenu theme="dark" />)

    // 应该显示帮助按钮
    const helpButton = screen.getByRole('button', { name: /❓/ })
    expect(helpButton).toBeInTheDocument()
  })

  it('点击菜单项应该关闭菜单', async () => {
    render(<HelpMenu theme="dark" />)

    // 点击帮助菜单按钮打开菜单
    const helpButton = screen.getByRole('button', { name: /❓/ })
    fireEvent.click(helpButton)

    // 等待菜单显示
    await waitFor(() => {
      expect(screen.getByText('快速入门')).toBeInTheDocument()
    })

    // 点击"快速入门"
    const quickStartButton = screen.getByText('快速入门')
    fireEvent.click(quickStartButton)

    // 菜单应该关闭（"文档"不应该再显示）
    await waitFor(() => {
      expect(screen.queryByText('文档')).not.toBeInTheDocument()
    })
  })

  it('应该支持亮色和暗色主题', () => {
    const { rerender } = render(<HelpMenu theme="dark" />)

    // 暗色主题应该正常渲染
    expect(screen.getByRole('button', { name: /❓/ })).toBeInTheDocument()

    // 重新渲染为亮色主题
    rerender(<HelpMenu theme="light" />)

    // 亮色主题也应该正常渲染
    expect(screen.getByRole('button', { name: /❓/ })).toBeInTheDocument()
  })

  it('点击外部应该关闭菜单', async () => {
    render(
      <div>
        <HelpMenu theme="dark" />
        <div data-testid="outside">Outside</div>
      </div>
    )

    // 点击帮助菜单按钮打开菜单
    const helpButton = screen.getByRole('button', { name: /❓/ })
    fireEvent.click(helpButton)

    // 等待菜单显示
    await waitFor(() => {
      expect(screen.getByText('快速入门')).toBeInTheDocument()
    })

    // 点击外部
    const outside = screen.getByTestId('outside')
    fireEvent.mouseDown(outside)

    // 菜单应该关闭
    await waitFor(() => {
      expect(screen.queryByText('快速入门')).not.toBeInTheDocument()
    })
  })
})
