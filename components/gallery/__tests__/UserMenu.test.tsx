import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import UserMenu from '../UserMenu'

/**
 * 属性 14: 用户菜单完整性
 * 验证: 需求 5.3
 * 
 * 对于任何已登录用户，点击头像/用户名后显示的菜单应该包含
 * "我的作品"、"账户设置"、"退出登录"这三个选项
 */
describe('UserMenu - Property 14: 用户菜单完整性', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('属性 14: 已登录用户菜单应该包含所有必需选项', async () => {
    // 使用 fast-check 生成随机用户名
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (username) => {
          // 设置登录状态
          localStorage.setItem('isAdmin', 'true')
          localStorage.setItem('adminUsername', username)

          render(
            <UserMenu
              isLoggedIn={true}
              currentUser={{ name: username }}
              theme="dark"
            />
          )

          // 点击用户菜单按钮
          const userButton = screen.getByRole('button', { name: /👤/ })
          fireEvent.click(userButton)

          // 等待菜单显示
          await waitFor(() => {
            // 验证所有必需的菜单项都存在
            expect(screen.getByText('我的作品')).toBeInTheDocument()
            expect(screen.getByText('账户设置')).toBeInTheDocument()
            expect(screen.getByText('退出登录')).toBeInTheDocument()
          })
        }
      ),
      { numRuns: 20 } // 运行 20 次属性测试
    )
  })

  it('未登录用户应该显示登录按钮', () => {
    render(
      <UserMenu
        isLoggedIn={false}
        theme="dark"
      />
    )

    // 应该显示登录按钮
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('已登录用户应该显示用户信息', () => {
    const testUser = { name: 'TestUser' }

    render(
      <UserMenu
        isLoggedIn={true}
        currentUser={testUser}
        theme="dark"
      />
    )

    // 点击用户菜单按钮
    const userButton = screen.getByRole('button', { name: /👤/ })
    fireEvent.click(userButton)

    // 应该显示用户名
    expect(screen.getByText('TestUser')).toBeInTheDocument()
    expect(screen.getByText('已登录')).toBeInTheDocument()
  })

  it('点击菜单项应该关闭菜单', async () => {
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminUsername', 'TestUser')

    render(
      <UserMenu
        isLoggedIn={true}
        currentUser={{ name: 'TestUser' }}
        theme="dark"
      />
    )

    // 点击用户菜单按钮打开菜单
    const userButton = screen.getByRole('button', { name: /👤/ })
    fireEvent.click(userButton)

    // 等待菜单显示
    await waitFor(() => {
      expect(screen.getByText('我的作品')).toBeInTheDocument()
    })

    // 点击"我的作品"
    const myWorksButton = screen.getByText('我的作品')
    fireEvent.click(myWorksButton)

    // 菜单应该关闭（"账户设置"不应该再显示）
    await waitFor(() => {
      expect(screen.queryByText('账户设置')).not.toBeInTheDocument()
    })
  })

  it('退出登录应该清除登录状态', async () => {
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminUsername', 'TestUser')

    const { rerender } = render(
      <UserMenu
        isLoggedIn={true}
        currentUser={{ name: 'TestUser' }}
        theme="dark"
      />
    )

    // 点击用户菜单按钮
    const userButton = screen.getByRole('button', { name: /👤/ })
    fireEvent.click(userButton)

    // 等待菜单显示
    await waitFor(() => {
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })

    // 点击"退出登录"
    const logoutButton = screen.getByText('退出登录')
    fireEvent.click(logoutButton)

    // localStorage 应该被清空
    expect(localStorage.getItem('isAdmin')).toBeNull()
    expect(localStorage.getItem('adminUsername')).toBeNull()
  })
})
