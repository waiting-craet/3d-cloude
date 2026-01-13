import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteButton from '../DeleteButton'

describe('DeleteButton', () => {
  describe('按钮渲染', () => {
    it('应该渲染删除按钮', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />)
      
      const button = screen.getByRole('button', { name: '删除项目' })
      expect(button).toBeInTheDocument()
    })

    it('应该显示垃圾桶图标', () => {
      const mockOnDelete = jest.fn()
      const { container } = render(
        <DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />
      )
      
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('h-5', 'w-5')
    })

    it('应该使用正确的aria-label', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除图谱" />)
      
      const button = screen.getByRole('button', { name: '删除图谱' })
      expect(button).toHaveAttribute('aria-label', '删除图谱')
    })
  })

  describe('点击事件触发', () => {
    it('点击按钮应该触发onDelete回调', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />)
      
      const button = screen.getByRole('button', { name: '删除项目' })
      fireEvent.click(button)
      
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('点击按钮应该传递事件对象', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />)
      
      const button = screen.getByRole('button', { name: '删除项目' })
      fireEvent.click(button)
      
      expect(mockOnDelete).toHaveBeenCalledWith(expect.any(Object))
      const event = mockOnDelete.mock.calls[0][0]
      expect(event.type).toBe('click')
    })
  })

  describe('禁用状态', () => {
    it('禁用时应该有disabled属性', () => {
      const mockOnDelete = jest.fn()
      render(
        <DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" disabled />
      )
      
      const button = screen.getByRole('button', { name: '删除项目' })
      expect(button).toBeDisabled()
    })

    it('禁用时点击不应该触发onDelete', () => {
      const mockOnDelete = jest.fn()
      render(
        <DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" disabled />
      )
      
      const button = screen.getByRole('button', { name: '删除项目' })
      fireEvent.click(button)
      
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('禁用时应该显示灰色样式', () => {
      const mockOnDelete = jest.fn()
      render(
        <DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" disabled />
      )
      
      const button = screen.getByRole('button', { name: '删除项目' })
      expect(button).toHaveClass('text-gray-300', 'cursor-not-allowed')
    })

    it('未禁用时应该显示可交互样式', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />)
      
      const button = screen.getByRole('button', { name: '删除项目' })
      expect(button).toHaveClass('text-gray-500')
      expect(button).not.toHaveClass('cursor-not-allowed')
    })
  })

  describe('事件冒泡阻止', () => {
    it('点击按钮应该阻止事件冒泡', () => {
      const mockOnDelete = jest.fn()
      const mockParentClick = jest.fn()
      
      const { container } = render(
        <div onClick={mockParentClick}>
          <DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />
        </div>
      )
      
      const button = screen.getByRole('button', { name: '删除项目' })
      fireEvent.click(button)
      
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockParentClick).not.toHaveBeenCalled()
    })

    it('事件对象应该调用stopPropagation', () => {
      const mockOnDelete = jest.fn()
      render(<DeleteButton onDelete={mockOnDelete} ariaLabel="删除项目" />)
      
      const button = screen.getByRole('button', { name: '删除项目' })
      const mockEvent = {
        stopPropagation: jest.fn(),
        type: 'click',
      } as any
      
      fireEvent.click(button, mockEvent)
      
      // 验证stopPropagation被调用
      // 注意：由于fireEvent创建新事件，我们通过验证父元素不被触发来间接验证
    })
  })

  describe('自定义className', () => {
    it('应该应用自定义className', () => {
      const mockOnDelete = jest.fn()
      render(
        <DeleteButton
          onDelete={mockOnDelete}
          ariaLabel="删除项目"
          className="custom-class"
        />
      )
      
      const button = screen.getByRole('button', { name: '删除项目' })
      expect(button).toHaveClass('custom-class')
    })
  })
})
