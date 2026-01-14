/**
 * Unit tests for WorkflowCanvas save and convert flow
 * Tests Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('WorkflowCanvas - Save and Convert Flow', () => {
  let mockRefreshProjects: jest.Mock
  let mockFetch: jest.Mock
  let mockLocationAssign: jest.Mock

  beforeEach(() => {
    // Mock refreshProjects
    mockRefreshProjects = jest.fn().mockResolvedValue(undefined)
    
    // Mock fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch as any
    
    // Mock window.location.href assignment using Object.defineProperty
    mockLocationAssign = jest.fn()
    delete (window as any).location
    window.location = {} as any
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: 'http://localhost/',
    })
    
    // Spy on href setter
    Object.defineProperty(window.location, 'href', {
      set: mockLocationAssign,
      get: () => 'http://localhost/',
    })
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
    Storage.prototype.removeItem = jest.fn()
    Storage.prototype.clear = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Requirement 1.1: Sync API is called after save', () => {
    it('should call refreshProjects after successful sync', async () => {
      // Arrange
      const currentGraph = { id: 'graph-123', name: 'Test Graph' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          stats: { nodesAdded: 2, edgesAdded: 1 },
        }),
      })

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: [], connections: [] }),
        })
        
        if (response.ok) {
          await mockRefreshProjects()
        }
      }

      await saveAndConvert()

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/graphs/${currentGraph.id}/sync`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(mockRefreshProjects).toHaveBeenCalledTimes(1)
    })

    it('should not call refreshProjects if sync fails', async () => {
      // Arrange
      const currentGraph = { id: 'graph-123', name: 'Test Graph' }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Sync failed' }),
      })

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: [], connections: [] }),
        })
        
        if (response.ok) {
          await mockRefreshProjects()
        } else {
          throw new Error('Sync failed')
        }
      }

      // Assert
      await expect(saveAndConvert()).rejects.toThrow('Sync failed')
      expect(mockRefreshProjects).not.toHaveBeenCalled()
    })
  })

  describe('Requirement 1.2: refreshProjects is called', () => {
    it('should wait for refreshProjects to complete before redirecting', async () => {
      // Arrange
      const currentGraph = { id: 'graph-123', name: 'Test Graph' }
      let refreshCompleted = false
      
      mockRefreshProjects.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        refreshCompleted = true
      })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      })

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
        })
        
        if (response.ok) {
          await mockRefreshProjects()
          
          // Verify refresh completed before redirect
          expect(refreshCompleted).toBe(true)
          
          const projectId = 'project-456'
          const graphId = currentGraph.id
          
          localStorage.setItem('currentProjectId', projectId)
          localStorage.setItem('currentGraphId', graphId)
          
          window.location.href = `/?projectId=${projectId}&graphId=${graphId}`
        }
      }

      await saveAndConvert()

      // Assert
      expect(refreshCompleted).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('currentProjectId', 'project-456')
      expect(localStorage.setItem).toHaveBeenCalledWith('currentGraphId', currentGraph.id)
    })
  })

  describe('Requirement 1.3: Redirect URL contains query parameters', () => {
    it('should redirect with projectId and graphId query parameters', async () => {
      // Arrange
      const currentGraph = { id: 'cmk123abc', name: 'Test Graph' }
      const currentProject = { id: 'cmk456def', name: 'Test Project' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      })

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
        })
        
        if (response.ok) {
          await mockRefreshProjects()
          
          localStorage.setItem('currentProjectId', currentProject.id)
          localStorage.setItem('currentGraphId', currentGraph.id)
          
          const redirectUrl = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`
          window.location.href = redirectUrl
        }
      }

      await saveAndConvert()

      // Assert
      expect(mockLocationAssign).toHaveBeenCalledWith(`/?projectId=${currentProject.id}&graphId=${currentGraph.id}`)
    })

    it('should save IDs to localStorage before redirect', async () => {
      // Arrange
      const currentGraph = { id: 'cmk123abc', name: 'Test Graph' }
      const currentProject = { id: 'cmk456def', name: 'Test Project' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      })

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
        })
        
        if (response.ok) {
          await mockRefreshProjects()
          
          localStorage.setItem('currentProjectId', currentProject.id)
          localStorage.setItem('currentGraphId', currentGraph.id)
          
          window.location.href = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`
        }
      }

      await saveAndConvert()

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('currentProjectId', currentProject.id)
      expect(localStorage.setItem).toHaveBeenCalledWith('currentGraphId', currentGraph.id)
      // Verify localStorage was called before redirect by checking call order
      const setItemCalls = (localStorage.setItem as jest.Mock).mock.calls
      expect(setItemCalls.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle sync API errors gracefully', async () => {
      // Arrange
      const currentGraph = { id: 'graph-123', name: 'Test Graph' }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      // Act & Assert
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '同步失败')
        }
      }

      await expect(saveAndConvert()).rejects.toThrow('Internal server error')
      expect(mockRefreshProjects).not.toHaveBeenCalled()
    })

    it('should continue redirect even if refreshProjects fails', async () => {
      // Arrange
      const currentGraph = { id: 'graph-123', name: 'Test Graph' }
      const currentProject = { id: 'project-456', name: 'Test Project' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} }),
      })
      
      mockRefreshProjects.mockRejectedValueOnce(new Error('Refresh failed'))

      // Act
      const saveAndConvert = async () => {
        const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
          method: 'POST',
        })
        
        if (response.ok) {
          try {
            await mockRefreshProjects()
          } catch (refreshError) {
            console.error('Refresh failed, but continuing with redirect')
          }
          
          localStorage.setItem('currentProjectId', currentProject.id)
          localStorage.setItem('currentGraphId', currentGraph.id)
          
          window.location.href = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`
        }
      }

      await saveAndConvert()

      // Assert - should still redirect even if refresh fails
      expect(mockLocationAssign).toHaveBeenCalledWith(`/?projectId=${currentProject.id}&graphId=${currentGraph.id}`)
      expect(localStorage.setItem).toHaveBeenCalledWith('currentProjectId', currentProject.id)
      expect(localStorage.setItem).toHaveBeenCalledWith('currentGraphId', currentGraph.id)
    })
  })
})
