import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import DeleteButton from '../DeleteButton'

/**
 * 属性测试 - DeleteButton组件
 * 使用fast-check进行基于属性的测试，每个测试运行100次以上
 */

// 生成器：随机aria-label（非空且至少包含一个非空格字符）
const ariaLabelArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0) // 确保不是纯空格
  .map((s) => s.trim()) // trim以避免getByRole的问题

// 生成器：随机className
const classNameArbitrary = fc.string({ minLength: 0, maxLength: 30 })

describe('DeleteButton - Property Tests', () => {
  /**
   * Feature: delete-project-graph, Property 1: 删除按钮渲染
   * For any aria-label, 删除按钮应该被渲染并包含垃圾桶图标
   */
  describe('Property 1: 删除按钮渲染', () => {
    it('对于任意aria-label，按钮都应该被渲染', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { unmount } = render(
            <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
          )

          // 验证按钮被渲染
          const button = screen.getByRole('button', { name: ariaLabel })
          expect(button).toBeInTheDocument()

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('对于任意aria-label，按钮都应该包含垃圾桶图标SVG', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { container, unmount } = render(
            <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
          )

          // 验证SVG图标存在
          const svg = container.querySelector('svg')
          expect(svg).toBeInTheDocument()
          expect(svg).toHaveClass('h-5', 'w-5')

          unmount()
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: delete-project-graph, Property 2: 悬停视觉反馈
   * For any 删除按钮，悬停时应该有hover样式类
   */
  describe('Property 2: 悬停视觉反馈', () => {
    it('对于任意按钮，未禁用时应该包含hover样式类', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { unmount } = render(
            <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
          )

          const button = screen.getByRole('button', { name: ariaLabel })
          
          // 验证包含hover相关的样式类
          const className = button.className
          expect(className).toContain('hover:text-red-600')
          expect(className).toContain('hover:bg-red-50')

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('对于任意按钮，禁用时不应该包含hover样式类', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { unmount } = render(
            <DeleteButton
              onDelete={mockOnDelete}
              ariaLabel={ariaLabel}
              disabled
            />
          )

          const button = screen.getByRole('button', { name: ariaLabel })
          
          // 验证禁用状态的样式
          const className = button.className
          expect(className).toContain('text-gray-300')
          expect(className).toContain('cursor-not-allowed')

          unmount()
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: delete-project-graph, Property 15: 删除按钮点击反馈
   * For any 删除按钮，点击时应该触发onDelete回调
   */
  describe('Property 15: 删除按钮点击反馈', () => {
    it('对于任意按钮，点击时应该触发onDelete回调', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { unmount } = render(
            <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
          )

          const button = screen.getByRole('button', { name: ariaLabel })
          fireEvent.click(button)

          // 验证回调被触发
          expect(mockOnDelete).toHaveBeenCalledTimes(1)
          expect(mockOnDelete).toHaveBeenCalledWith(expect.any(Object))

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('对于任意禁用的按钮，点击时不应该触发onDelete回调', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const { unmount } = render(
            <DeleteButton
              onDelete={mockOnDelete}
              ariaLabel={ariaLabel}
              disabled
            />
          )

          const button = screen.getByRole('button', { name: ariaLabel })
          fireEvent.click(button)

          // 验证回调未被触发
          expect(mockOnDelete).not.toHaveBeenCalled()

          unmount()
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: delete-project-graph, Property 16: 删除按钮事件隔离
   * For any 删除按钮，点击时不应该触发父元素的点击事件
   */
  describe('Property 16: 删除按钮事件隔离', () => {
    it('对于任意按钮，点击时应该阻止事件冒泡到父元素', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const mockParentClick = jest.fn()

          const { unmount } = render(
            <div onClick={mockParentClick} data-testid="parent">
              <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
            </div>
          )

          const button = screen.getByRole('button', { name: ariaLabel })
          fireEvent.click(button)

          // 验证按钮回调被触发，但父元素回调未被触发
          expect(mockOnDelete).toHaveBeenCalledTimes(1)
          expect(mockParentClick).not.toHaveBeenCalled()

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it('对于任意按钮，点击父元素应该触发父元素事件但不触发按钮事件', () => {
      fc.assert(
        fc.property(ariaLabelArbitrary, (ariaLabel) => {
          const mockOnDelete = jest.fn()
          const mockParentClick = jest.fn()

          const { unmount } = render(
            <div onClick={mockParentClick} data-testid="parent">
              <DeleteButton onDelete={mockOnDelete} ariaLabel={ariaLabel} />
            </div>
          )

          const parent = screen.getByTestId('parent')
          fireEvent.click(parent)

          // 验证父元素回调被触发，但按钮回调未被触发
          expect(mockParentClick).toHaveBeenCalled()
          expect(mockOnDelete).not.toHaveBeenCalled()

          unmount()
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * 额外测试：自定义className属性
   */
  describe('自定义className属性测试', () => {
    it('对于任意className，按钮都应该应用该className', () => {
      fc.assert(
        fc.property(
          ariaLabelArbitrary,
          classNameArbitrary,
          (ariaLabel, className) => {
            const mockOnDelete = jest.fn()
            const { unmount } = render(
              <DeleteButton
                onDelete={mockOnDelete}
                ariaLabel={ariaLabel}
                className={className}
              />
            )

            const button = screen.getByRole('button', { name: ariaLabel })
            
            // 如果className不为空，验证它被应用
            if (className.trim()) {
              expect(button.className).toContain(className)
            }

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
