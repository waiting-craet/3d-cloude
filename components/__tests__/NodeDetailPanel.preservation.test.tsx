import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import NodeDetailPanel from '../NodeDetailPanel'
import { useGraphStore } from '@/lib/store'

/**
 * Preservation Property Test - NodeDetailPanel完整模式
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * 这个测试在未修复的代码上运行，用于观察和记录完整模式下的基线行为。
 * 测试应该在未修复的代码上通过，确认要保持的行为。
 * 
 * 保持性需求：当navigationMode为'full'（或不存在）时，节点详情弹窗应该：
 * - 名称输入框可以正常编辑（disabled=false或undefined）
 * - 描述输入框可以正常编辑（disabled=false或undefined）
 * - 编辑按钮正常显示（在DOM中）
 * - 删除按钮正常显示（在DOM中）
 * - 所有交互功能正常工作
 * 
 * 预期结果：在未修复的代码上，这些测试应该通过，确认基线行为。
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

// Mock store
jest.mock('@/lib/store', () => {
  const actualStore = jest.requireActual('@/lib/store')
  return {
    ...actualStore,
    useGraphStore: jest.fn(),
  }
})

describe('NodeDetailPanel - Preservation Property (完整模式保持性)', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  /**
   * Property 2: Preservation - 完整模式下输入框可编辑
   * 
   * 观察完整模式下（navigationMode='full'或不存在）输入框的行为
   * 在未修复的代码上，输入框应该可编辑（disabled=false或undefined）
   */
  describe('Property 2: 完整模式下输入框应该可编辑', () => {
    it('完整模式下名称输入框应该可编辑 (需求 3.1)', () => {
      // 设置完整模式（navigationMode='full'）
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
        navigationMode: 'full', // 完整模式
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

      // 查找名称输入框
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      
      // 断言：名称输入框应该可编辑（disabled=false或undefined）
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(false)
    })

    it('完整模式下描述输入框应该可编辑 (需求 3.2)', () => {
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
        navigationMode: 'full',
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
      
      // 断言：描述输入框应该可编辑（disabled=false或undefined）
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.disabled).toBe(false)
    })

    it('未修复代码下（无navigationMode）名称输入框应该可编辑 (需求 3.1)', () => {
      // 模拟未修复的代码：store中没有navigationMode字段
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
        // 注意：没有navigationMode字段
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

      // 查找名称输入框
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      
      // 断言：名称输入框应该可编辑
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(false)
    })

    it('未修复代码下（无navigationMode）描述输入框应该可编辑 (需求 3.2)', () => {
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

      // 查找描述输入框
      const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
      
      // 断言：描述输入框应该可编辑
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.disabled).toBe(false)
    })
  })

  /**
   * Property 2: Preservation - 完整模式下按钮应该显示
   * 
   * 观察完整模式下（navigationMode='full'或不存在）按钮的显示行为
   * 在未修复的代码上，按钮应该正常显示
   */
  describe('Property 2: 完整模式下按钮应该显示', () => {
    it('完整模式下编辑按钮应该显示 (需求 3.3)', () => {
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
        navigationMode: 'full',
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

      // 查找编辑按钮
      const editButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('编辑')
      )
      
      // 断言：编辑按钮应该在DOM中
      expect(editButton).toBeDefined()
      expect(editButton).toBeInTheDocument()
    })

    it('完整模式下删除按钮应该显示 (需求 3.4)', () => {
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
        navigationMode: 'full',
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

      // 查找删除按钮
      const deleteButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('删除')
      )
      
      // 断言：删除按钮应该在DOM中
      expect(deleteButton).toBeDefined()
      expect(deleteButton).toBeInTheDocument()
    })

    it('未修复代码下（无navigationMode）编辑按钮应该显示 (需求 3.3)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-7',
          name: '测试节点7',
          description: '测试描述7',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
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

      // 查找编辑按钮
      const editButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('编辑')
      )
      
      // 断言：编辑按钮应该在DOM中
      expect(editButton).toBeDefined()
      expect(editButton).toBeInTheDocument()
    })

    it('未修复代码下（无navigationMode）删除按钮应该显示 (需求 3.4)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-8',
          name: '测试节点8',
          description: '测试描述8',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
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

      // 查找删除按钮
      const deleteButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('删除')
      )
      
      // 断言：删除按钮应该在DOM中
      expect(deleteButton).toBeDefined()
      expect(deleteButton).toBeInTheDocument()
    })
  })

  /**
   * Property 2: Preservation - 完整模式下交互功能正常
   * 
   * 测试完整模式下的交互功能（编辑、输入等）
   */
  describe('Property 2: 完整模式下交互功能正常', () => {
    it('完整模式下可以修改名称输入框的值 (需求 3.1)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-9',
          name: '原始名称',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
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

      // 查找名称输入框
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      
      // 修改输入框的值
      fireEvent.change(nameInput, { target: { value: '新名称' } })
      
      // 断言：输入框的值应该被更新
      expect(nameInput.value).toBe('新名称')
    })

    it('完整模式下可以修改描述输入框的值 (需求 3.2)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-10',
          name: '测试节点',
          description: '原始描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
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

      // 查找描述输入框
      const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
      
      // 修改输入框的值
      fireEvent.change(descriptionInput, { target: { value: '新描述' } })
      
      // 断言：输入框的值应该被更新
      expect(descriptionInput.value).toBe('新描述')
    })

    it('完整模式下可以点击编辑按钮进入编辑模式 (需求 3.3)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-11',
          name: '测试节点',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
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

      // 查找编辑按钮
      const editButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('编辑')
      ) as HTMLButtonElement
      
      // 点击编辑按钮
      fireEvent.click(editButton)
      
      // 断言：应该进入编辑模式（标题变为"编辑节点"）
      const header = container.querySelector('h2')
      expect(header?.textContent).toContain('编辑节点')
    })
  })

  /**
   * Property-Based Test: 对于任意节点数据，完整模式下都应该保持编辑功能
   * 
   * 使用fast-check生成随机节点数据，验证完整模式下的行为
   */
  describe('Property-Based Test: 完整模式下保持编辑功能', () => {
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

    // 生成器：navigationMode（包括'full'和undefined）
    const navigationModeArbitrary = fc.constantFrom('full', undefined)

    it('对于任意节点和navigationMode，完整模式下输入框都应该可编辑', () => {
      fc.assert(
        fc.property(nodeArbitrary, navigationModeArbitrary, (node, navigationMode) => {
          const mockStore: any = {
            selectedNode: node,
            setSelectedNode: jest.fn(),
            deleteNode: jest.fn(),
            fetchGraph: jest.fn(),
            updateNodeLocal: jest.fn(),
            updateNode: jest.fn(),
            theme: 'light',
          }

          // 只有当navigationMode不是undefined时才添加到store
          if (navigationMode !== undefined) {
            mockStore.navigationMode = navigationMode
          }

          ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
          mockLocalStorage.setItem('isAdmin', 'true')

          const { container, unmount } = render(<NodeDetailPanel />)

          // 验证名称输入框可编辑
          const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
          expect(nameInput).toBeInTheDocument()
          expect(nameInput.disabled).toBe(false)

          // 验证描述输入框可编辑
          const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
          expect(descriptionInput).toBeInTheDocument()
          expect(descriptionInput.disabled).toBe(false)

          unmount()
        }),
        { numRuns: 50 } // 运行50次以覆盖各种节点数据和模式组合
      )
    })

    it('对于任意节点和navigationMode，完整模式下按钮都应该显示', () => {
      fc.assert(
        fc.property(nodeArbitrary, navigationModeArbitrary, (node, navigationMode) => {
          const mockStore: any = {
            selectedNode: node,
            setSelectedNode: jest.fn(),
            deleteNode: jest.fn(),
            fetchGraph: jest.fn(),
            updateNodeLocal: jest.fn(),
            updateNode: jest.fn(),
            theme: 'light',
          }

          if (navigationMode !== undefined) {
            mockStore.navigationMode = navigationMode
          }

          ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
          mockLocalStorage.setItem('isAdmin', 'true')

          const { container, unmount } = render(<NodeDetailPanel />)

          // 验证编辑按钮存在
          const editButton = Array.from(container.querySelectorAll('button')).find(
            button => button.textContent?.includes('编辑')
          )
          expect(editButton).toBeDefined()
          expect(editButton).toBeInTheDocument()

          // 验证删除按钮存在
          const deleteButton = Array.from(container.querySelectorAll('button')).find(
            button => button.textContent?.includes('删除')
          )
          expect(deleteButton).toBeDefined()
          expect(deleteButton).toBeInTheDocument()

          unmount()
        }),
        { numRuns: 50 }
      )
    })

    it('对于任意节点和navigationMode，完整模式下可以修改输入框的值', () => {
      fc.assert(
        fc.property(
          nodeArbitrary,
          navigationModeArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (node, navigationMode, newName) => {
            const mockStore: any = {
              selectedNode: node,
              setSelectedNode: jest.fn(),
              deleteNode: jest.fn(),
              fetchGraph: jest.fn(),
              updateNodeLocal: jest.fn(),
              updateNode: jest.fn(),
              theme: 'light',
            }

            if (navigationMode !== undefined) {
              mockStore.navigationMode = navigationMode
            }

            ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
            mockLocalStorage.setItem('isAdmin', 'true')

            const { container, unmount } = render(<NodeDetailPanel />)

            // 查找名称输入框
            const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
            
            // 修改输入框的值
            fireEvent.change(nameInput, { target: { value: newName } })
            
            // 验证输入框的值被更新
            expect(nameInput.value).toBe(newName)

            unmount()
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  /**
   * Property 2: Preservation - 非管理员用户在完整模式下
   * 
   * 测试非管理员用户在完整模式下的行为
   * 非管理员用户应该看不到编辑和删除按钮，但输入框应该可编辑
   */
  describe('Property 2: 非管理员用户在完整模式下', () => {
    it('非管理员在完整模式下输入框应该可编辑 (需求 3.5)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-12',
          name: '测试节点',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
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

      // 验证输入框可编辑
      const nameInput = container.querySelector('input[placeholder="输入节点名称"]') as HTMLInputElement
      const descriptionInput = container.querySelector('textarea[placeholder="输入节点描述"]') as HTMLTextAreaElement
      
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(false)
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.disabled).toBe(false)
    })

    it('非管理员在完整模式下不应该看到编辑和删除按钮 (需求 3.5)', () => {
      const mockStore = {
        selectedNode: {
          id: 'test-node-13',
          name: '测试节点',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'false')

      const { container } = render(<NodeDetailPanel />)

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
    })
  })

  /**
   * Property 2: Preservation - 关闭弹窗功能正常
   * 
   * 测试完整模式下关闭弹窗的功能（需求 3.5, 3.6）
   */
  describe('Property 2: 关闭弹窗功能正常', () => {
    it('完整模式下可以点击关闭按钮关闭弹窗 (需求 3.5)', () => {
      const mockSetSelectedNode = jest.fn()
      const mockStore = {
        selectedNode: {
          id: 'test-node-14',
          name: '测试节点',
          description: '测试描述',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
        },
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      // 查找关闭按钮（✕）
      const closeButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('✕')
      ) as HTMLButtonElement
      
      expect(closeButton).toBeInTheDocument()
      
      // 点击关闭按钮
      fireEvent.click(closeButton)
      
      // 验证setSelectedNode被调用，参数为null
      expect(mockSetSelectedNode).toHaveBeenCalledWith(null)
    })
  })
})
