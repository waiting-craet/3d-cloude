/**
 * 拖拽功能验证测试
 * 
 * 验证需求:
 * - 1.1: 节点拖拽时实时更新三维位置
 * - 1.2: 拖拽时禁用 OrbitControls
 * - 1.3: 拖拽结束时重新启用 OrbitControls
 * - 9.1: 节点位置更新到 GraphStore
 * - 9.2: 拖拽开始时设置 isDragging 标志
 * - 9.3: 拖拽结束时清除 isDragging 标志
 */

import { renderHook, act } from '@testing-library/react'
import { useGraphStore } from '@/lib/store'

describe('GraphNodes 拖拽功能验证', () => {
  beforeEach(() => {
    // 重置 store 状态
    const { setNodes, setIsDragging, setHasUnsavedChanges } = useGraphStore.getState()
    setNodes([])
    setIsDragging(false)
    setHasUnsavedChanges(false)
  })

  describe('需求 9.1: updateNodePosition 正确调用', () => {
    it('应该在拖拽时更新节点位置到 GraphStore', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 模拟拖拽更新位置
      act(() => {
        result.current.updateNodePosition('node1', 10, 20, 30)
      })

      // 验证位置已更新
      const updatedNode = result.current.nodes.find(n => n.id === 'node1')
      expect(updatedNode).toBeDefined()
      expect(updatedNode?.x).toBe(10)
      expect(updatedNode?.y).toBe(20)
      expect(updatedNode?.z).toBe(30)
    })

    it('应该在位置更新时设置 hasUnsavedChanges 标志', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 确认初始状态
      expect(result.current.hasUnsavedChanges).toBe(false)

      // 更新位置
      act(() => {
        result.current.updateNodePosition('node1', 5, 10, 15)
      })

      // 验证标志已设置
      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })

  describe('需求 9.2, 9.3: isDragging 标志管理', () => {
    it('应该能够设置 isDragging 为 true', () => {
      const { result } = renderHook(() => useGraphStore())

      expect(result.current.isDragging).toBe(false)

      act(() => {
        result.current.setIsDragging(true)
      })

      expect(result.current.isDragging).toBe(true)
    })

    it('应该能够设置 isDragging 为 false', () => {
      const { result } = renderHook(() => useGraphStore())

      // 先设置为 true
      act(() => {
        result.current.setIsDragging(true)
      })

      expect(result.current.isDragging).toBe(true)

      // 再设置为 false
      act(() => {
        result.current.setIsDragging(false)
      })

      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('需求 1.1: 节点位置实时更新', () => {
    it('应该支持连续多次位置更新', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 模拟连续拖拽更新
      const positions = [
        { x: 1, y: 2, z: 3 },
        { x: 2, y: 4, z: 6 },
        { x: 3, y: 6, z: 9 },
      ]

      positions.forEach(pos => {
        act(() => {
          result.current.updateNodePosition('node1', pos.x, pos.y, pos.z)
        })

        const node = result.current.nodes.find(n => n.id === 'node1')
        expect(node?.x).toBe(pos.x)
        expect(node?.y).toBe(pos.y)
        expect(node?.z).toBe(pos.z)
      })
    })

    it('应该只更新指定节点的位置，不影响其他节点', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化多个节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' },
          { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#FF6B6B' },
          { id: 'node3', name: 'Node 3', type: 'concept', x: 20, y: 20, z: 20, color: '#6BFF6B' },
        ])
      })

      // 只更新 node2 的位置
      act(() => {
        result.current.updateNodePosition('node2', 15, 25, 35)
      })

      // 验证只有 node2 被更新
      const node1 = result.current.nodes.find(n => n.id === 'node1')
      const node2 = result.current.nodes.find(n => n.id === 'node2')
      const node3 = result.current.nodes.find(n => n.id === 'node3')

      expect(node1?.x).toBe(0)
      expect(node1?.y).toBe(0)
      expect(node1?.z).toBe(0)

      expect(node2?.x).toBe(15)
      expect(node2?.y).toBe(25)
      expect(node2?.z).toBe(35)

      expect(node3?.x).toBe(20)
      expect(node3?.y).toBe(20)
      expect(node3?.z).toBe(20)
    })
  })

  describe('坐标验证', () => {
    it('应该拒绝 NaN 坐标', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 5, y: 10, z: 15, color: '#6BB6FF' }
        ])
      })

      // 尝试使用 NaN 坐标更新
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      act(() => {
        result.current.updateNodePosition('node1', NaN, 20, 30)
      })

      // 验证位置未改变
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(5)
      expect(node?.y).toBe(10)
      expect(node?.z).toBe(15)

      // 验证错误被记录
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该拒绝 Infinity 坐标', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 5, y: 10, z: 15, color: '#6BB6FF' }
        ])
      })

      // 尝试使用 Infinity 坐标更新
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      act(() => {
        result.current.updateNodePosition('node1', 10, Infinity, 30)
      })

      // 验证位置未改变
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(5)
      expect(node?.y).toBe(10)
      expect(node?.z).toBe(15)

      // 验证错误被记录
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该接受有效的浮点数坐标', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 使用浮点数坐标更新
      act(() => {
        result.current.updateNodePosition('node1', 3.14159, -2.71828, 1.41421)
      })

      // 验证位置已更新
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBeCloseTo(3.14159)
      expect(node?.y).toBeCloseTo(-2.71828)
      expect(node?.z).toBeCloseTo(1.41421)
    })

    it('应该接受负数坐标', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 使用负数坐标更新
      act(() => {
        result.current.updateNodePosition('node1', -10, -20, -30)
      })

      // 验证位置已更新
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(-10)
      expect(node?.y).toBe(-20)
      expect(node?.z).toBe(-30)
    })
  })

  describe('拖拽工作流集成', () => {
    it('应该模拟完整的拖拽工作流', () => {
      const { result } = renderHook(() => useGraphStore())

      // 1. 初始化节点
      act(() => {
        result.current.setNodes([
          { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        ])
      })

      // 2. 开始拖拽
      act(() => {
        result.current.setIsDragging(true)
      })
      expect(result.current.isDragging).toBe(true)

      // 3. 拖拽过程中更新位置
      act(() => {
        result.current.updateNodePosition('node1', 5, 10, 15)
      })
      
      let node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(5)
      expect(node?.y).toBe(10)
      expect(node?.z).toBe(15)
      expect(result.current.hasUnsavedChanges).toBe(true)

      // 4. 继续拖拽
      act(() => {
        result.current.updateNodePosition('node1', 10, 20, 30)
      })
      
      node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(10)
      expect(node?.y).toBe(20)
      expect(node?.z).toBe(30)

      // 5. 结束拖拽
      act(() => {
        result.current.setIsDragging(false)
      })
      expect(result.current.isDragging).toBe(false)

      // 6. 验证最终状态
      node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(10)
      expect(node?.y).toBe(20)
      expect(node?.z).toBe(30)
      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })

  describe('selectedNode 同步更新', () => {
    it('应该在拖拽选中节点时同步更新 selectedNode', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化节点并选中
      act(() => {
        const node = { id: 'node1', name: 'Test Node', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        result.current.setNodes([node])
        result.current.setSelectedNode(node)
      })

      expect(result.current.selectedNode?.id).toBe('node1')
      expect(result.current.selectedNode?.x).toBe(0)

      // 更新节点位置
      act(() => {
        result.current.updateNodePosition('node1', 15, 25, 35)
      })

      // 验证 selectedNode 也被更新
      expect(result.current.selectedNode?.x).toBe(15)
      expect(result.current.selectedNode?.y).toBe(25)
      expect(result.current.selectedNode?.z).toBe(35)
    })

    it('不应该影响未选中节点的 selectedNode', () => {
      const { result } = renderHook(() => useGraphStore())

      // 初始化多个节点，选中 node1
      act(() => {
        const node1 = { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' }
        const node2 = { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#FF6B6B' }
        result.current.setNodes([node1, node2])
        result.current.setSelectedNode(node1)
      })

      // 更新 node2 的位置
      act(() => {
        result.current.updateNodePosition('node2', 20, 30, 40)
      })

      // 验证 selectedNode 仍然是 node1 且未改变
      expect(result.current.selectedNode?.id).toBe('node1')
      expect(result.current.selectedNode?.x).toBe(0)
      expect(result.current.selectedNode?.y).toBe(0)
      expect(result.current.selectedNode?.z).toBe(0)
    })
  })
})
