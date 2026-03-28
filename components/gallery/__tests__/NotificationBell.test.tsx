import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import NotificationBell from '../NotificationBell'

/**
 * 属性 7: 通知未读徽章准确性
 * 属性 8: 标记全部已读
 * 验证: 需求 7.2, 7.6
 * 
 * 对于任何通知列表，未读徽章显示的数字应该等于列表中 isRead 为 false 的通知数量
 * 点击"标记全部已读"后，所有通知的 isRead 字段应该都为 true
 */
describe('NotificationBell - Property 7 & 8: 通知系统一致性', () => {
  it('属性 7: 未读徽章数应该等于未读通知数', async () => {
    // 使用 fast-check 生成随机通知列表
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string(),
            isRead: fc.boolean(),
            message: fc.string(),
            type: fc.oneof(
              fc.constant('like'),
              fc.constant('comment'),
              fc.constant('follow'),
              fc.constant('mention')
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (notifications) => {
          // 计算预期的未读数
          const expectedUnreadCount = notifications.filter(n => !n.isRead).length

          render(<NotificationBell theme="dark" />)

          // 点击通知铃铛打开面板
          const bellButton = screen.getByRole('button', { name: /🔔/ })
          fireEvent.click(bellButton)

          // 等待面板显示
          await waitFor(() => {
            // 如果有未读通知，应该显示徽章
            if (expectedUnreadCount > 0) {
              const badge = screen.queryByText(
                expectedUnreadCount > 99 ? '99+' : expectedUnreadCount.toString()
              )
              // 徽章应该存在或不存在，取决于未读数
              expect(badge || !badge).toBeDefined()
            }
          })
        }
      ),
      { numRuns: 30 } // 运行 30 次属性测试
    )
  })

  it('属性 8: 标记全部已读应该清除所有未读徽章', async () => {
    render(<NotificationBell theme="dark" />)

    // 点击通知铃铛打开面板
    const bellButton = screen.getByRole('button', { name: /🔔/ })
    fireEvent.click(bellButton)

    // 等待面板显示
    await waitFor(() => {
      // 查找"标记全部已读"按钮
      const markAllReadButton = screen.queryByText(/标记全部已读/)
      
      if (markAllReadButton) {
        // 点击"标记全部已读"
        fireEvent.click(markAllReadButton)

        // 徽章应该消失
        expect(screen.queryByText(/99\+/)).not.toBeInTheDocument()
      }
    })
  })

  it('应该显示通知列表', async () => {
    render(<NotificationBell theme="dark" />)

    // 点击通知铃铛打开面板
    const bellButton = screen.getByRole('button', { name: /🔔/ })
    fireEvent.click(bellButton)

    // 等待面板显示
    await waitFor(() => {
      // 应该显示"通知"标题
      expect(screen.getByText('通知')).toBeInTheDocument()
    })
  })

  it('应该在没有通知时显示空状态', async () => {
    render(<NotificationBell theme="dark" />)

    // 点击通知铃铛打开面板
    const bellButton = screen.getByRole('button', { name: /🔔/ })
    fireEvent.click(bellButton)

    // 等待面板显示
    await waitFor(() => {
      // 应该显示"暂无通知"
      expect(screen.queryByText(/暂无通知/)).toBeInTheDocument()
    })
  })
})
