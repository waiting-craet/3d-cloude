import React from 'react'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import NodeDetailPanel from '../NodeDetailPanel'
import { useGraphStore } from '@/lib/store'

/**
 * Bug Condition Exploration Test - NodeDetailPanel只读模式
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * 这个测试在未修复的代码上运行，用于确认bug存在。
 * 测试编码了预期行为 - 在实现修复后，这些测试应该通过。
 * 
 * Bug条件：当navigationMode为'readonly'时，节点详情弹窗应该：
 * - 禁用名称输入框（disabled=true）
 * - 禁用描述输入框（disabled=true）
 * - 隐藏编辑按钮（不在DOM中）
 * - 隐藏删除按钮（不在DOM中）
 * 
 * 预期结果：在未修复的代码上，这些测试会失败，证明bug存在。
 */

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock store with navigationMode
jest.mock('@/lib/store', () => {
  const actualStore = jest.requireActual('@/lib/store')
  return {
    ...actualStore,
    useGraphStore: jest.fn(),
  }
})

describe('NodeDetailPanel - Bug Condition Exploration (只读模式)', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  /**
   * Property 1: Fault Condition - 只读模式下禁用编辑功能
   * 
   * 测试只读模式下输入框应该被禁用
   * 在未修复的代码上，这个测试会失败，因为输入框没有被禁用
   */
  describe('Property 1: 只读模式下输入框应该被禁用', () => {
    it('只读模式下名称输入框应该被禁用 (需求 2.1)', () => {
      // 设置只读模式
      const mockStore = {
        selectedNode: {
          id: 'test-node-1',
          name: '测试节点',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly', // 只读模式
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      // 设置isAdmin为true，确保按钮会被渲染（如果不是只读模式）
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找名称输入框
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      
      // 断言：名称输入框应该被禁用
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(true)
    })

    it('只读模式下描述输入框应该被禁用 (需求 2.2)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-2',
          name: '测试节点2',
          description: '测试描述2',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找描述输入框（textarea）
      const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
      
      // 断言：描述输入框应该被禁用
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.disabled).toBe(true)
    })
  })

  /**
   * Property 1: Fault Condition - 只读模式下隐藏编辑按钮
   * 
   * 测试只读模式下编辑和删除按钮应该被隐藏
   * 在未修复的代码上，这个测试会失败，因为按钮仍然显示
   */
  describe('Property 1: 只读模式下按钮应该被隐藏', () => {
    it('只读模式下编辑按钮应该被隐藏 (需求 2.3)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-3',
          name: '测试节点3',
          description: '测试描述3',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找编辑按钮（包含"编辑"文本的按钮）
      const editButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('编辑')
      )
      
      // 断言：编辑按钮不应该在DOM中
      expect(editButton).toBeUndefined()
    })

    it('只读模式下删除按钮应该被隐藏 (需求 2.4)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-4',
          name: '测试节点4',
          description: '测试描述4',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找删除按钮（包含"删除"文本的按钮）
      const deleteButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('删除')
      )
      
      // 断言：删除按钮不应该在DOM中
      expect(deleteButton).toBeUndefined()
    })

    it('只读模式下按钮容器应该被隐藏 (需求 2.3, 2.4)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-5',
          name: '测试节点5',
          description: '测试描述5',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找所有按钮
      const buttons = container.querySelectorAll('button')
      
      // 应该只有关闭按钮（✕），不应该有编辑和删除按钮
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent?.trim())
      
      expect(buttonTexts).not.toContain('编辑')
      expect(buttonTexts).not.toContain('删除')
    })
  })

  /**
   * Property-Based Test: 对于任意节点数据，只读模式下都应该禁用编辑功能
   * 
   * 使用fast-check生成随机节点数据，验证只读模式下的行为
   */
  describe('Property-Based Test: 只读模式下禁用编辑功能', () => {
    // 生成器：随机节点数据
    const nodeArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 0, maxLength: 200 }),
      type: fc.constantFrom('concept', 'entity', 'relation'),
      x: fc.double({ min: -1000, max: 1000 }),
      y: fc.double({ min: -1000, max: 1000 }),
      z: fc.double({ min: -1000, max: 1000 }),
      color: fc.constantFrom('#6BB6FF', '#FF6B6B', '#6BFF6B', '#FFD700'),
    })

    it('对于任意节点，只读模式下输入框都应该被禁用', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const mockStore = {
            selectedNode: node,
            navigationMode: 'readonly',
            setSelectedNode: jest.fn(),
            deleteNode: jest.fn(),
            fetchGraph: jest.fn(),
            updateNodeLocal: jest.fn(),
            updateNode: jest.fn(),
            theme: 'light',
          }

          ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
          mockLocalStorage.setItem('isAdmin', 'true')

          const { container, unmount } = render(<NodeDetailPanel />)

          // 验证名称输入框被禁用
          const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
          expect(nameInput).toBeInTheDocument()
          expect(nameInput.disabled).toBe(true)

          // 验证描述输入框被禁用
          const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
          expect(descriptionInput).toBeInTheDocument()
          expect(descriptionInput.disabled).toBe(true)

          unmount()
        }),
        { numRuns: 50 } // 运行50次以覆盖各种节点数据
      )
    })

    it('对于任意节点，只读模式下编辑和删除按钮都应该被隐藏', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const mockStore = {
            selectedNode: node,
            navigationMode: 'readonly',
            setSelectedNode: jest.fn(),
            deleteNode: jest.fn(),
            fetchGraph: jest.fn(),
            updateNodeLocal: jest.fn(),
            updateNode: jest.fn(),
            theme: 'light',
          }

          ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
          mockLocalStorage.setItem('isAdmin', 'true')

          const { container, unmount } = render(<NodeDetailPanel />)

          // 验证编辑按钮不存在
          const editButton = Array.from(container.querySelectorAll('button')).find(
            button => button.textContent?.includes('编辑')
          )
          expect(editButton).toBeUndefined()

          // 验证删除按钮不存在
          const deleteButton = Array.from(container.querySelectorAll('button')).find(
            button => button.textContent?.includes('删除')
          )
          expect(deleteButton).toBeUndefined()

          unmount()
        }),
        { numRuns: 50 }
      )
    })
  })

  /**
   * 边缘情况测试：非管理员用户在只读模式下
   * 
   * 即使不是管理员，只读模式下也应该禁用输入框
   */
  describe('边缘情况：非管理员用户在只读模式下', () => {
    it('非管理员在只读模式下输入框应该被禁用', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-6',
          name: '测试节点6',
          description: '测试描述6',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'false') // 非管理员

      const { container } = render(<NodeDetailPanel />)

      // 验证输入框被禁用
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
      
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(true)
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.disabled).toBe(true)
    })
  })
})
