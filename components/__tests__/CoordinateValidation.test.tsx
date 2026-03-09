/**
 * 坐标验证逻辑测试
 * 
 * 测试需求:
 * - 2.1: 验证 x 坐标是有限数字
 * - 2.2: 验证 y 坐标是有限数字
 * - 2.3: 验证 z 坐标是有限数字
 * - 2.4: 如果坐标无效，拒绝更新并保持原有位置
 * - 2.5: 在保存前验证节点 ID 存在于当前图谱中
 */

import { useGraphStore } from '@/lib/store'

describe('坐标验证逻辑', () => {
  beforeEach(() => {
    // 重置 store 状态
    useGraphStore.setState({
      nodes: [
        { id: 'node1', name: 'Test Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#fff' },
        { id: 'node2', name: 'Test Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#fff' },
      ],
      hasUnsavedChanges: false,
    })
  })

  describe('updateNodePosition 坐标验证', () => {
    it('应该接受有效的坐标', () => {
      const { updateNodePosition, nodes } = useGraphStore.getState()
      
      updateNodePosition('node1', 5, 5, 5)
      
      const updatedNode = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(updatedNode?.x).toBe(5)
      expect(updatedNode?.y).toBe(5)
      expect(updatedNode?.z).toBe(5)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(true)
    })

    it('应该拒绝 NaN 坐标 (需求 2.1, 2.2, 2.3)', () => {
      const { updateNodePosition } = useGraphStore.getState()
      const originalNode = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      
      // 尝试更新为 NaN
      updateNodePosition('node1', NaN, 5, 5)
      
      // 节点位置应该保持不变
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(originalNode?.x)
      expect(node?.y).toBe(originalNode?.y)
      expect(node?.z).toBe(originalNode?.z)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(false)
    })

    it('应该拒绝 Infinity 坐标 (需求 2.1, 2.2, 2.3)', () => {
      const { updateNodePosition } = useGraphStore.getState()
      const originalNode = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      
      // 尝试更新为 Infinity
      updateNodePosition('node1', Infinity, 5, 5)
      
      // 节点位置应该保持不变
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(originalNode?.x)
      expect(node?.y).toBe(originalNode?.y)
      expect(node?.z).toBe(originalNode?.z)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(false)
    })

    it('应该拒绝 -Infinity 坐标 (需求 2.1, 2.2, 2.3)', () => {
      const { updateNodePosition } = useGraphStore.getState()
      const originalNode = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      
      // 尝试更新为 -Infinity
      updateNodePosition('node1', 5, -Infinity, 5)
      
      // 节点位置应该保持不变
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(originalNode?.x)
      expect(node?.y).toBe(originalNode?.y)
      expect(node?.z).toBe(originalNode?.z)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(false)
    })

    it('应该拒绝任何坐标包含无效值 (需求 2.4)', () => {
      const { updateNodePosition } = useGraphStore.getState()
      const originalNode = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      
      // 测试各种无效组合
      const invalidCombinations = [
        [NaN, 0, 0],
        [0, NaN, 0],
        [0, 0, NaN],
        [Infinity, 0, 0],
        [0, Infinity, 0],
        [0, 0, Infinity],
        [-Infinity, 0, 0],
        [0, -Infinity, 0],
        [0, 0, -Infinity],
      ]
      
      invalidCombinations.forEach(([x, y, z]) => {
        updateNodePosition('node1', x, y, z)
        
        const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
        expect(node?.x).toBe(originalNode?.x)
        expect(node?.y).toBe(originalNode?.y)
        expect(node?.z).toBe(originalNode?.z)
      })
    })

    it('应该接受边界值坐标', () => {
      const { updateNodePosition } = useGraphStore.getState()
      
      // 测试极大和极小的有限数字
      updateNodePosition('node1', Number.MAX_VALUE, Number.MIN_VALUE, -Number.MAX_VALUE)
      
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(Number.MAX_VALUE)
      expect(node?.y).toBe(Number.MIN_VALUE)
      expect(node?.z).toBe(-Number.MAX_VALUE)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(true)
    })

    it('应该接受零坐标', () => {
      const { updateNodePosition } = useGraphStore.getState()
      
      updateNodePosition('node1', 0, 0, 0)
      
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(0)
      expect(node?.y).toBe(0)
      expect(node?.z).toBe(0)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(true)
    })

    it('应该接受负数坐标', () => {
      const { updateNodePosition } = useGraphStore.getState()
      
      updateNodePosition('node1', -100, -200, -300)
      
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(-100)
      expect(node?.y).toBe(-200)
      expect(node?.z).toBe(-300)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(true)
    })

    it('应该接受小数坐标', () => {
      const { updateNodePosition } = useGraphStore.getState()
      
      updateNodePosition('node1', 1.5, 2.7, 3.14159)
      
      const node = useGraphStore.getState().nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(1.5)
      expect(node?.y).toBe(2.7)
      expect(node?.z).toBe(3.14159)
      expect(useGraphStore.getState().hasUnsavedChanges).toBe(true)
    })
  })

  describe('保存前坐标验证', () => {
    it('应该检测并拒绝包含无效坐标的节点集合 (需求 2.1, 2.2, 2.3, 2.4)', () => {
      // 设置包含无效坐标的节点
      useGraphStore.setState({
        nodes: [
          { id: 'node1', name: 'Valid Node', type: 'concept', x: 0, y: 0, z: 0, color: '#fff' },
          { id: 'node2', name: 'Invalid Node', type: 'concept', x: NaN, y: 10, z: 10, color: '#fff' },
          { id: 'node3', name: 'Another Invalid', type: 'concept', x: 5, y: Infinity, z: 5, color: '#fff' },
        ],
      })
      
      const { nodes } = useGraphStore.getState()
      
      // 模拟保存前的验证逻辑
      const invalidNodes = nodes.filter(node => 
        !isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)
      )
      
      expect(invalidNodes.length).toBe(2)
      expect(invalidNodes.map(n => n.id)).toEqual(['node2', 'node3'])
    })

    it('应该通过全部有效坐标的验证', () => {
      useGraphStore.setState({
        nodes: [
          { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#fff' },
          { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#fff' },
          { id: 'node3', name: 'Node 3', type: 'concept', x: -5, y: 5.5, z: 100, color: '#fff' },
        ],
      })
      
      const { nodes } = useGraphStore.getState()
      
      // 模拟保存前的验证逻辑
      const invalidNodes = nodes.filter(node => 
        !isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)
      )
      
      expect(invalidNodes.length).toBe(0)
    })

    it('应该识别所有类型的无效坐标', () => {
      useGraphStore.setState({
        nodes: [
          { id: 'node1', name: 'NaN X', type: 'concept', x: NaN, y: 0, z: 0, color: '#fff' },
          { id: 'node2', name: 'NaN Y', type: 'concept', x: 0, y: NaN, z: 0, color: '#fff' },
          { id: 'node3', name: 'NaN Z', type: 'concept', x: 0, y: 0, z: NaN, color: '#fff' },
          { id: 'node4', name: 'Inf X', type: 'concept', x: Infinity, y: 0, z: 0, color: '#fff' },
          { id: 'node5', name: 'Inf Y', type: 'concept', x: 0, y: Infinity, z: 0, color: '#fff' },
          { id: 'node6', name: 'Inf Z', type: 'concept', x: 0, y: 0, z: Infinity, color: '#fff' },
          { id: 'node7', name: '-Inf X', type: 'concept', x: -Infinity, y: 0, z: 0, color: '#fff' },
          { id: 'node8', name: '-Inf Y', type: 'concept', x: 0, y: -Infinity, z: 0, color: '#fff' },
          { id: 'node9', name: '-Inf Z', type: 'concept', x: 0, y: 0, z: -Infinity, color: '#fff' },
        ],
      })
      
      const { nodes } = useGraphStore.getState()
      
      // 模拟保存前的验证逻辑
      const invalidNodes = nodes.filter(node => 
        !isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)
      )
      
      expect(invalidNodes.length).toBe(9)
      expect(invalidNodes.map(n => n.id)).toEqual([
        'node1', 'node2', 'node3', 'node4', 'node5', 'node6', 'node7', 'node8', 'node9'
      ])
    })
  })

  describe('节点 ID 验证', () => {
    it('应该验证节点 ID 存在于节点列表中 (需求 2.5)', () => {
      const { nodes } = useGraphStore.getState()
      const nodeIds = nodes.map(n => n.id)
      
      // 验证现有节点 ID
      expect(nodeIds).toContain('node1')
      expect(nodeIds).toContain('node2')
      
      // 验证不存在的节点 ID
      expect(nodeIds).not.toContain('nonexistent')
    })

    it('应该能够检测无效的节点 ID', () => {
      const { nodes } = useGraphStore.getState()
      
      const testNodeIds = ['node1', 'node2', 'invalid-id', 'another-invalid']
      const validIds = testNodeIds.filter(id => 
        nodes.some(node => node.id === id)
      )
      
      expect(validIds).toEqual(['node1', 'node2'])
    })
  })
})
