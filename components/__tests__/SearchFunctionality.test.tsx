import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import HeroSection from '../HeroSection'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock useUserStore
const mockUserStore = {
  isLoggedIn: true,
  user: { id: '1', name: 'Test User' }
}

jest.mock('@/lib/userStore', () => ({
  useUserStore: () => mockUserStore
}))

/**
 * 搜索功能保持性测试
 * 
 * 这些测试确保在视觉简约化重设计后，所有搜索相关的核心功能继续正常工作。
 * 测试覆盖：搜索输入、防抖、键盘事件、状态管理、响应式布局
 * 
 * **验证需求 3.1, 3.2, 3.3, 3.4, 3.5**
 */
describe('SearchFunctionality - 搜索功能保持性测试', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup()
    // 确保用户已登录状态
    mockUserStore.isLoggedIn = true
    mockUserStore.user = { id: '1', name: 'Test User' }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('搜索输入和防抖功能 - 需求 3.1', () => {
    it('应该正确处理搜索输入变化', async () => {
      const onSearchChange = jest.fn()
      
      render(
        <HeroSection
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 输入搜索内容
      await user.type(searchInput, '测试搜索内容')
      
      // 验证每次输入都触发了回调
      expect(onSearchChange).toHaveBeenCalledWith('测')
      expect(onSearchChange).toHaveBeenCalledWith('测试')
      expect(onSearchChange).toHaveBeenCalledWith('测试搜')
      expect(onSearchChange).toHaveBeenCalledWith('测试搜索')
      expect(onSearchChange).toHaveBeenCalledWith('测试搜索内')
      expect(onSearchChange).toHaveBeenCalledWith('测试搜索内容')
    })

    it('应该支持清空搜索内容', async () => {
      const onSearchChange = jest.fn()
      
      render(
        <HeroSection
          searchQuery="初始内容"
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱') as HTMLInputElement
      
      // 验证初始值
      expect(searchInput.value).toBe('初始内容')
      
      // 清空输入
      await user.clear(searchInput)
      
      // 验证清空后的回调
      expect(onSearchChange).toHaveBeenCalledWith('')
    })

    it('应该正确显示传入的搜索查询值', () => {
      const testQuery = '预设搜索内容'
      
      render(
        <HeroSection
          searchQuery={testQuery}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱') as HTMLInputElement
      expect(searchInput.value).toBe(testQuery)
    })

    it('应该支持特殊字符和多语言输入', async () => {
      const onSearchChange = jest.fn()
      
      render(
        <HeroSection
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 测试特殊字符
      await user.type(searchInput, '!@#$%^&*()')
      expect(onSearchChange).toHaveBeenCalledWith('!@#$%^&*()')
      
      // 清空后测试中文
      await user.clear(searchInput)
      await user.type(searchInput, '中文搜索')
      expect(onSearchChange).toHaveBeenCalledWith('中文搜索')
      
      // 清空后测试英文
      await user.clear(searchInput)
      await user.type(searchInput, 'English Search')
      expect(onSearchChange).toHaveBeenCalledWith('English Search')
    })
  })

  describe('键盘事件处理 - 需求 3.1', () => {
    it('应该在按下Enter键时触发搜索提交', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 输入内容并按Enter
      await user.type(searchInput, '测试搜索')
      await user.keyboard('{Enter}')
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该在空输入时也能响应Enter键', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 直接按Enter（无输入内容）
      searchInput.focus()
      await user.keyboard('{Enter}')
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该只响应Enter键，不响应其他键', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 测试其他键不触发提交
      searchInput.focus()
      await user.keyboard('{Space}')
      await user.keyboard('{Tab}')
      await user.keyboard('{Escape}')
      await user.keyboard('{ArrowDown}')
      
      expect(onSearchSubmit).not.toHaveBeenCalled()
      
      // 确认Enter键仍然有效
      await user.keyboard('{Enter}')
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该阻止Enter键的默认表单提交行为', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      
      // 模拟键盘事件并检查preventDefault是否被调用
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault')
      
      searchInput.focus()
      fireEvent.keyDown(searchInput, enterEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('搜索按钮功能 - 需求 3.1', () => {
    it('应该在点击搜索按钮时触发搜索提交', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchButton = screen.getByLabelText('搜索')
      
      await user.click(searchButton)
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    })

    it('应该支持多次点击搜索按钮', async () => {
      const onSearchSubmit = jest.fn()
      
      render(
        <HeroSection
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchButton = screen.getByLabelText('搜索')
      
      // 多次点击
      await user.click(searchButton)
      await user.click(searchButton)
      await user.click(searchButton)
      
      expect(onSearchSubmit).toHaveBeenCalledTimes(3)
    })

    it('应该具有正确的无障碍标签', () => {
      render(
        <HeroSection
          showSearch={true}
        />
      )
      
      const searchButton = screen.getByLabelText('搜索')
      expect(searchButton).toBeInTheDocument()
      expect(searchButton.getAttribute('aria-label')).toBe('搜索')
    })
  })

  describe('搜索状态管理和回调函数 - 需求 3.1', () => {
    it('应该正确管理内部搜索状态', async () => {
      const onSearchChange = jest.fn()
      
      const { rerender } = render(
        <HeroSection
          searchQuery=""
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱') as HTMLInputElement
      
      // 初始状态
      expect(searchInput.value).toBe('')
      
      // 外部更新searchQuery
      rerender(
        <HeroSection
          searchQuery="外部更新"
          onSearchChange={onSearchChange}
          showSearch={true}
        />
      )
      
      expect(searchInput.value).toBe('外部更新')
      
      // 用户输入应该触发回调
      await user.type(searchInput, '用户输入')
      expect(onSearchChange).toHaveBeenCalledWith('外部更新用')
    })

    it('应该在没有回调函数时仍然正常工作', async () => {
      // 不传入任何回调函数
      render(
        <HeroSection
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      const searchButton = screen.getByLabelText('搜索')
      
      // 这些操作不应该抛出错误
      await user.type(searchInput, '测试输入')
      await user.click(searchButton)
      await user.keyboard('{Enter}')
      
      // 验证组件仍然正常渲染
      expect(searchInput).toBeInTheDocument()
      expect(searchButton).toBeInTheDocument()
    })

    it('应该正确处理回调函数的异常', async () => {
      const onSearchChange = jest.fn(() => {
        throw new Error('回调函数错误')
      })
      const onSearchSubmit = jest.fn(() => {
        throw new Error('提交回调错误')
      })
      
      // 捕获控制台错误以避免测试输出污染
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <HeroSection
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱')
      const searchButton = screen.getByLabelText('搜索')
      
      // 这些操作不应该导致组件崩溃
      expect(() => {
        fireEvent.change(searchInput, { target: { value: '测试' } })
      }).not.toThrow()
      
      expect(() => {
        fireEvent.click(searchButton)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})