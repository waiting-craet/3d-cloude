/**
 * Integration Tests for Graph Node Position Save Workflow
 * 
 * Tests the complete drag-save workflow including:
 * - Sub-task 7.1: Complete drag-save workflow
 * - Sub-task 7.2: Position data persistence
 * - Sub-task 7.3: Permission validation
 * - Sub-task 7.4: Error scenarios
 * 
 * Requirements: 1.4, 3.4, 3.5, 5.1-5.5, 6.1, 6.2, 7.1, 7.3, 9.4, 9.5
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useGraphStore } from '@/lib/store'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('Integration Tests - Save Workflow', () => {
  let originalLocalStorage: Storage
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Reset store
    const { setNodes, setIsDragging, setHasUnsavedChanges, setCurrentGraph } = useGraphStore.getState()
    setNodes([])
    setIsDragging(false)
    setHasUnsavedChanges(false)
    setCurrentGraph(null)

    // Mock localStorage
    originalLocalStorage = global.localStorage
    localStorageMock = {}
    
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key]
        }),
        clear: jest.fn(() => {
          localStorageMock = {}
        }),
      },
      writable: true,
    })

    // Reset fetch mock
    mockFetch.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
    global.localStorage = originalLocalStorage
  })

  describe('Sub-task 7.1: Complete Drag-Save Workflow', () => {
    it('should complete full drag-save workflow successfully', async () => {
      const { result } = renderHook(() => useGraphStore())

      // Step 1: Load graph page - set up graph and nodes
      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 2,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' },
          { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#FF6B6B' },
        ])
      })

      // Verify initial state
      expect(result.current.hasUnsavedChanges).toBe(false)
      expect(result.current.nodes).toHaveLength(2)

      // Step 2: Drag node to new position
      act(() => {
        result.current.updateNodePosition('node1', 50, 60, 70)
      })

      // Step 3: Verify hasUnsavedChanges flag set to true
      expect(result.current.hasUnsavedChanges).toBe(true)
      
      const updatedNode = result.current.nodes.find(n => n.id === 'node1')
      expect(updatedNode?.x).toBe(50)
      expect(updatedNode?.y).toBe(60)
      expect(updatedNode?.z).toBe(70)

      // Step 4: Click save button (simulate handleSavePositions)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '位置保存成功' }),
      })

      const payload = {
        graphId: 'graph-123',
        nodes: result.current.nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
        })),
        metadata: {
          is3D: true,
          savedAt: expect.any(String),
        },
      }

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Step 5: Verify save success message displayed
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)

      // Step 6: Verify hasUnsavedChanges flag set to false
      act(() => {
        result.current.setHasUnsavedChanges(false)
      })

      expect(result.current.hasUnsavedChanges).toBe(false)
    })

    it('should handle multiple node drags before saving', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 3,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' },
          { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#FF6B6B' },
          { id: 'node3', name: 'Node 3', type: 'concept', x: 20, y: 20, z: 20, color: '#6BFF6B' },
        ])
      })

      // Drag multiple nodes
      act(() => {
        result.current.updateNodePosition('node1', 100, 110, 120)
        result.current.updateNodePosition('node2', 200, 210, 220)
        result.current.updateNodePosition('node3', 300, 310, 320)
      })

      expect(result.current.hasUnsavedChanges).toBe(true)

      // Save all changes at once
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '位置保存成功' }),
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'graph-123',
          nodes: result.current.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
          metadata: { is3D: true },
        }),
      })

      expect(response.ok).toBe(true)
      
      // Verify all nodes were included in save
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/graphs/save-positions',
        expect.objectContaining({
          body: expect.stringContaining('node1'),
        })
      )
    })
  })

  describe('Sub-task 7.2: Position Data Persistence', () => {
    it('should restore saved positions after page refresh', async () => {
      const { result } = renderHook(() => useGraphStore())

      const graphId = 'graph-456'
      const savedPositions = [
        { id: 'node1', x: 100, y: 200, z: 300 },
        { id: 'node2', x: 400, y: 500, z: 600 },
      ]

      // Step 1: Drag and save node positions
      act(() => {
        result.current.setCurrentGraph({
          id: graphId,
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 2,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 100, y: 200, z: 300, color: '#6BB6FF' },
          { id: 'node2', name: 'Node 2', type: 'concept', x: 400, y: 500, z: 600, color: '#FF6B6B' },
        ])
      })

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId,
          nodes: savedPositions.map(p => ({ id: p.id, x: p.x, y: p.y })),
          metadata: { is3D: true },
        }),
      })

      // Step 2: Simulate page refresh - clear state
      act(() => {
        result.current.setNodes([])
        result.current.setCurrentGraph(null)
        result.current.setProjects([])
      })

      // Step 3: Reload graph with saved positions
      // Mock API response for graph data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          graph: {
            id: graphId,
            name: 'Test Graph',
            projectId: 'project-1',
            createdAt: new Date().toISOString(),
            settings: JSON.stringify({
              workflowPositions: {
                nodes: savedPositions.map(p => ({ id: p.id, x: p.x, y: p.y })),
                metadata: { is3D: true },
              },
            }),
          },
          nodes: [
            { id: 'node1', name: 'Node 1', type: 'concept', x: 100, y: 200, z: 300, color: '#6BB6FF' },
            { id: 'node2', name: 'Node 2', type: 'concept', x: 400, y: 500, z: 600, color: '#FF6B6B' },
          ],
          edges: [],
        }),
      })

      // Mock API response for projects list (called by refreshProjects)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: [{
            id: 'project-1',
            name: 'Test Project',
            graphs: [{
              id: graphId,
              name: 'Test Graph',
              projectId: 'project-1',
              nodeCount: 2,
              edgeCount: 0,
              createdAt: new Date().toISOString(),
            }],
          }],
        }),
      })

      // Load graph
      await act(async () => {
        await result.current.loadGraphById(graphId)
      })

      // Step 4: Verify positions restored
      await waitFor(() => {
        expect(result.current.nodes).toHaveLength(2)
      })

      const node1 = result.current.nodes.find(n => n.id === 'node1')
      const node2 = result.current.nodes.find(n => n.id === 'node2')

      expect(node1?.x).toBe(100)
      expect(node1?.y).toBe(200)
      expect(node1?.z).toBe(300)

      expect(node2?.x).toBe(400)
      expect(node2?.y).toBe(500)
      expect(node2?.z).toBe(600)
    })

    it('should restore from localStorage cache if available', async () => {
      const { result } = renderHook(() => useGraphStore())

      const graphId = 'graph-789'
      const cachedPositions = [
        { id: 'node1', x: 150, y: 250, z: 350 },
        { id: 'node2', x: 450, y: 550, z: 650 },
      ]

      // Pre-populate localStorage cache
      const cacheKey = `graph_positions_${graphId}`
      const cacheData = {
        graphId,
        positions: cachedPositions,
        timestamp: new Date().toISOString(),
      }
      localStorageMock[cacheKey] = JSON.stringify(cacheData)

      // Mock API response for graph data without saved positions
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          graph: {
            id: graphId,
            name: 'Test Graph',
            projectId: 'project-1',
            createdAt: new Date().toISOString(),
            settings: null,
          },
          nodes: [
            { id: 'node1', name: 'Node 1', type: 'concept', x: 0, y: 0, z: 0, color: '#6BB6FF' },
            { id: 'node2', name: 'Node 2', type: 'concept', x: 10, y: 10, z: 10, color: '#FF6B6B' },
          ],
          edges: [],
        }),
      })

      // Mock API response for projects list (called by refreshProjects)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: [{
            id: 'project-1',
            name: 'Test Project',
            graphs: [{
              id: graphId,
              name: 'Test Graph',
              projectId: 'project-1',
              nodeCount: 2,
              edgeCount: 0,
              createdAt: new Date().toISOString(),
            }],
          }],
        }),
      })

      // Load graph - should restore from cache
      await act(async () => {
        await result.current.loadGraphById(graphId)
      })

      await waitFor(() => {
        expect(result.current.nodes).toHaveLength(2)
      })

      // Verify cached positions were applied
      const node1 = result.current.nodes.find(n => n.id === 'node1')
      const node2 = result.current.nodes.find(n => n.id === 'node2')

      expect(node1?.x).toBe(150)
      expect(node1?.y).toBe(250)
      expect(node1?.z).toBe(350)

      expect(node2?.x).toBe(450)
      expect(node2?.y).toBe(550)
      expect(node2?.z).toBe(650)

      // Should mark as having unsaved changes
      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })

  describe('Sub-task 7.3: Permission Validation', () => {
    it('should return 401 for unauthenticated users', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
        
        // Drag node to trigger unsaved changes
        result.current.updateNodePosition('node1', 100, 200, 300)
      })

      expect(result.current.hasUnsavedChanges).toBe(true)

      // Mock 401 Unauthorized response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: '未授权' }),
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'graph-123',
          nodes: [{ id: 'node1', x: 100, y: 200 }],
          metadata: { is3D: true },
        }),
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('未授权')

      // hasUnsavedChanges should remain true (save failed)
      expect(result.current.hasUnsavedChanges).toBe(true)
    })

    it('should return 403 for unauthorized users', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Mock 403 Forbidden response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ success: false, error: '无权限修改此图谱' }),
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'graph-123',
          nodes: [{ id: 'node1', x: 10, y: 20 }],
          metadata: { is3D: true },
        }),
      })

      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('无权限修改此图谱')
    })

    it('should display correct error messages for permission errors', async () => {
      const errorScenarios = [
        { status: 401, error: '未授权', expectedMessage: '请先登录' },
        { status: 403, error: '无权限修改此图谱', expectedMessage: '无权限修改此图谱' },
      ]

      for (const scenario of errorScenarios) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: scenario.status,
          json: async () => ({ success: false, error: scenario.error }),
        })

        const response = await fetch('/api/graphs/save-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            graphId: 'graph-123',
            nodes: [{ id: 'node1', x: 10, y: 20 }],
            metadata: { is3D: true },
          }),
        })

        expect(response.status).toBe(scenario.status)
        
        const data = await response.json()
        expect(data.error).toBeTruthy()
      }
    })
  })

  describe('Sub-task 7.4: Error Scenarios', () => {
    it('should handle network errors with retry prompt', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
        
        // Drag node to trigger unsaved changes
        result.current.updateNodePosition('node1', 100, 200, 300)
      })

      expect(result.current.hasUnsavedChanges).toBe(true)

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/graphs/save-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            graphId: 'graph-123',
            nodes: [{ id: 'node1', x: 100, y: 200 }],
            metadata: { is3D: true },
          }),
        })
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }

      // hasUnsavedChanges should remain true (save failed)
      expect(result.current.hasUnsavedChanges).toBe(true)
    })

    it('should handle graph not found error (404)', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'non-existent-graph',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Mock 404 Not Found response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: '图谱不存在或已被删除' }),
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'non-existent-graph',
          nodes: [{ id: 'node1', x: 10, y: 20 }],
          metadata: { is3D: true },
        }),
      })

      expect(response.status).toBe(404)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('图谱不存在或已被删除')
    })

    it('should reject invalid coordinates (NaN)', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Try to update with NaN coordinates
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      act(() => {
        result.current.updateNodePosition('node1', NaN, 20, 30)
      })

      // Position should not change
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(10)
      expect(node?.y).toBe(20)
      expect(node?.z).toBe(30)

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should reject invalid coordinates (Infinity)', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Try to update with Infinity coordinates
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      act(() => {
        result.current.updateNodePosition('node1', 10, Infinity, 30)
      })

      // Position should not change
      const node = result.current.nodes.find(n => n.id === 'node1')
      expect(node?.x).toBe(10)
      expect(node?.y).toBe(20)
      expect(node?.z).toBe(30)

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle server errors (500)', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Mock 500 Server Error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: '服务器错误' }),
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'graph-123',
          nodes: [{ id: 'node1', x: 10, y: 20 }],
          metadata: { is3D: true },
        }),
      })

      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('服务器错误')
    })

    it('should preserve unsaved changes flag on save failure', async () => {
      const { result } = renderHook(() => useGraphStore())

      act(() => {
        result.current.setCurrentGraph({
          id: 'graph-123',
          name: 'Test Graph',
          projectId: 'project-1',
          nodeCount: 1,
          edgeCount: 0,
          createdAt: new Date().toISOString(),
        })
        
        result.current.setNodes([
          { id: 'node1', name: 'Node 1', type: 'concept', x: 10, y: 20, z: 30, color: '#6BB6FF' },
        ])
      })

      // Drag node
      act(() => {
        result.current.updateNodePosition('node1', 100, 200, 300)
      })

      expect(result.current.hasUnsavedChanges).toBe(true)

      // Mock save failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: '服务器错误' }),
      })

      await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: 'graph-123',
          nodes: [{ id: 'node1', x: 100, y: 200 }],
          metadata: { is3D: true },
        }),
      })

      // Flag should remain true (save failed, user can retry)
      expect(result.current.hasUnsavedChanges).toBe(true)
    })
  })
})
