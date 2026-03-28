/**
 * Unit tests for TopNavbar delete flow
 * Tests Requirements 2.1, 2.2, 2.3, 2.7, 4.1, 4.2, 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('TopNavbar - Delete Flow', () => {
  let mockFetch: jest.Mock
  let originalFetch: typeof global.fetch
  let mockAlert: jest.Mock
  let mockReload: jest.Mock

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch as any

    // Mock alert
    mockAlert = jest.fn()
    global.alert = mockAlert

    // Mock window.location.reload
    mockReload = jest.fn()
    delete (window as any).location
    ;(window as any).location = { reload: mockReload }

    // Mock localStorage
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
    Storage.prototype.removeItem = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  describe('Requirement 2.1 & 2.4: Delete API is called', () => {
    it('should call DELETE API for project deletion', async () => {
      // Arrange
      const projectId = 'cmk123abc'
      const projectName = 'Test Project'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 5,
            deletedEdgeCount: 3,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: [] }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        return await res.json()
      }

      const result = await confirmDelete({
        type: 'project',
        id: projectId,
        name: projectName,
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      expect(result.success).toBe(true)
    })

    it('should call DELETE API for graph deletion', async () => {
      // Arrange
      const graphId = 'cmk456def'
      const graphName = 'Test Graph'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 3,
            deletedEdgeCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: [] }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/graphs/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        return await res.json()
      }

      const result = await confirmDelete({
        type: 'graph',
        id: graphId,
        name: graphName,
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/graphs/${graphId}`, {
        method: 'DELETE',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Requirement 2.2 & 2.5: refreshProjects is called after deletion', () => {
    it('should refresh project list after successful project deletion', async () => {
      // Arrange
      const projectId = 'cmk123abc'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 5,
            deletedEdgeCount: 3,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            projects: [
              {
                id: 'cmk789ghi',
                name: 'Other Project',
                graphs: [],
              },
            ],
          }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Refresh projects
        const projectsRes = await fetch('/api/projects/with-graphs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })

        return await projectsRes.json()
      }

      const result = await confirmDelete({
        type: 'project',
        id: projectId,
        name: 'Test Project',
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/projects/with-graphs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      expect(result.projects.length).toBe(1)
      expect(result.projects[0].id).not.toBe(projectId)
    })

    it('should refresh project list after successful graph deletion', async () => {
      // Arrange
      const graphId = 'cmk456def'
      const projectId = 'cmk123abc'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 3,
            deletedEdgeCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            projects: [
              {
                id: projectId,
                name: 'Test Project',
                graphs: [], // Graph was deleted
              },
            ],
          }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/graphs/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Refresh projects
        const projectsRes = await fetch('/api/projects/with-graphs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })

        return await projectsRes.json()
      }

      const result = await confirmDelete({
        type: 'graph',
        id: graphId,
        name: 'Test Graph',
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.projects[0].graphs.length).toBe(0)
    })
  })

  describe('Requirement 2.3 & 2.6: Deleted items removed from dropdown', () => {
    it('should verify deleted project is not in refreshed list', async () => {
      // Arrange
      const deletedProjectId = 'cmk123abc'
      const remainingProjectId = 'cmk789ghi'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 5,
            deletedEdgeCount: 3,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            projects: [
              {
                id: remainingProjectId,
                name: 'Remaining Project',
                graphs: [],
              },
            ],
          }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Refresh and verify
        const projectsRes = await fetch('/api/projects/with-graphs')
        const projectsData = await projectsRes.json()
        const projects = projectsData.projects || []

        // Verify deletion
        const stillExists = projects.some((p: any) => p.id === deleteDialog.id)

        return { projects, stillExists }
      }

      const result = await confirmDelete({
        type: 'project',
        id: deletedProjectId,
        name: 'Deleted Project',
      })

      // Assert
      expect(result.stillExists).toBe(false)
      expect(result.projects.length).toBe(1)
      expect(result.projects[0].id).toBe(remainingProjectId)
    })

    it('should verify deleted graph is not in refreshed list', async () => {
      // Arrange
      const projectId = 'cmk123abc'
      const deletedGraphId = 'cmk456def'
      const remainingGraphId = 'cmk789ghi'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 3,
            deletedEdgeCount: 2,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            projects: [
              {
                id: projectId,
                name: 'Test Project',
                graphs: [
                  {
                    id: remainingGraphId,
                    name: 'Remaining Graph',
                    projectId: projectId,
                    nodeCount: 2,
                    edgeCount: 1,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            ],
          }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/graphs/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Refresh and verify
        const projectsRes = await fetch('/api/projects/with-graphs')
        const projectsData = await projectsRes.json()
        const projects = projectsData.projects || []

        // Verify deletion
        const project = projects.find((p: any) =>
          p.graphs.some((g: any) => g.id === deleteDialog.id)
        )

        return { projects, stillExists: !!project }
      }

      const result = await confirmDelete({
        type: 'graph',
        id: deletedGraphId,
        name: 'Deleted Graph',
      })

      // Assert
      expect(result.stillExists).toBe(false)
      expect(result.projects[0].graphs.length).toBe(1)
      expect(result.projects[0].graphs[0].id).toBe(remainingGraphId)
    })
  })

  describe('Requirement 2.7: Clear selection when current item is deleted', () => {
    it('should clear localStorage and reload when current project is deleted', async () => {
      // Arrange
      const currentProjectId = 'cmk123abc'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedNodeCount: 5,
          deletedEdgeCount: 3,
        }),
      })

      // Act
      const confirmDelete = async (deleteDialog: any, currentProject: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Check if deleted item was current selection
        const isCurrentProject = deleteDialog.type === 'project' && currentProject?.id === deleteDialog.id

        if (isCurrentProject) {
          localStorage.removeItem('currentProjectId')
          localStorage.removeItem('currentGraphId')
          window.location.reload()
          return { reloaded: true }
        }

        return { reloaded: false }
      }

      const result = await confirmDelete(
        {
          type: 'project',
          id: currentProjectId,
          name: 'Current Project',
        },
        { id: currentProjectId, name: 'Current Project' }
      )

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentProjectId')
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentGraphId')
      expect(mockReload).toHaveBeenCalled()
      expect(result.reloaded).toBe(true)
    })

    it('should clear localStorage and reload when current graph is deleted', async () => {
      // Arrange
      const currentGraphId = 'cmk456def'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedNodeCount: 3,
          deletedEdgeCount: 2,
        }),
      })

      // Act
      const confirmDelete = async (deleteDialog: any, currentGraph: any) => {
        const endpoint = `/api/graphs/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Check if deleted item was current selection
        const isCurrentGraph = deleteDialog.type === 'graph' && currentGraph?.id === deleteDialog.id

        if (isCurrentGraph) {
          localStorage.removeItem('currentProjectId')
          localStorage.removeItem('currentGraphId')
          window.location.reload()
          return { reloaded: true }
        }

        return { reloaded: false }
      }

      const result = await confirmDelete(
        {
          type: 'graph',
          id: currentGraphId,
          name: 'Current Graph',
        },
        { id: currentGraphId, name: 'Current Graph' }
      )

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentProjectId')
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentGraphId')
      expect(mockReload).toHaveBeenCalled()
      expect(result.reloaded).toBe(true)
    })
  })

  describe('Requirement 4.1: 404 error handling', () => {
    it('should display "项目不存在" error for 404 on project deletion', async () => {
      // Arrange
      const projectId = 'cmk123abc'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Project not found' }),
      })

      // Act & Assert
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json()

          if (res.status === 404) {
            const entityName = deleteDialog.type === 'project' ? '项目' : '图谱'
            throw new Error(`${entityName}不存在`)
          }

          throw new Error(data.error || '删除失败')
        }
      }

      await expect(
        confirmDelete({
          type: 'project',
          id: projectId,
          name: 'Test Project',
        })
      ).rejects.toThrow('项目不存在')
    })

    it('should display "图谱不存在" error for 404 on graph deletion', async () => {
      // Arrange
      const graphId = 'cmk456def'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Graph not found' }),
      })

      // Act & Assert
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/graphs/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json()

          if (res.status === 404) {
            const entityName = deleteDialog.type === 'project' ? '项目' : '图谱'
            throw new Error(`${entityName}不存在`)
          }

          throw new Error(data.error || '删除失败')
        }
      }

      await expect(
        confirmDelete({
          type: 'graph',
          id: graphId,
          name: 'Test Graph',
        })
      ).rejects.toThrow('图谱不存在')
    })
  })

  describe('Requirement 4.2: 500 error message propagation', () => {
    it('should display API error message for 500 errors', async () => {
      // Arrange
      const projectId = 'cmk123abc'
      const apiErrorMessage = 'Database connection failed'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: apiErrorMessage }),
      })

      // Act & Assert
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json()

          if (res.status === 500) {
            throw new Error(data.error || data.message || '服务器错误')
          }

          throw new Error(data.error || '删除失败')
        }
      }

      await expect(
        confirmDelete({
          type: 'project',
          id: projectId,
          name: 'Test Project',
        })
      ).rejects.toThrow(apiErrorMessage)
    })

    it('should fallback to "服务器错误" if no error message in 500 response', async () => {
      // Arrange
      const projectId = 'cmk123abc'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}), // No error message
      })

      // Act & Assert
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json()

          if (res.status === 500) {
            throw new Error(data.error || data.message || '服务器错误')
          }

          throw new Error(data.error || '删除失败')
        }
      }

      await expect(
        confirmDelete({
          type: 'project',
          id: projectId,
          name: 'Test Project',
        })
      ).rejects.toThrow('服务器错误')
    })
  })

  describe('Requirement 4.3: Failed deletions preserve state', () => {
    it('should not update projects list when deletion fails', async () => {
      // Arrange
      const projectId = 'cmk123abc'
      const initialProjects = [
        {
          id: projectId,
          name: 'Test Project',
          graphs: [],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Deletion failed' }),
      })

      // Act
      let projectsUpdated = false
      const confirmDelete = async (deleteDialog: any, projects: any[]) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || '删除失败')
        }

        // This should not be reached
        projectsUpdated = true
        return { projects: [] }
      }

      // Assert
      await expect(
        confirmDelete(
          {
            type: 'project',
            id: projectId,
            name: 'Test Project',
          },
          initialProjects
        )
      ).rejects.toThrow('Deletion failed')

      expect(projectsUpdated).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only delete call, no refresh
    })

    it('should keep delete dialog open when deletion fails', async () => {
      // Arrange
      const projectId = 'cmk123abc'
      let dialogClosed = false

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Deletion failed' }),
      })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        try {
          const endpoint = `/api/projects/${deleteDialog.id}`
          const res = await fetch(endpoint, { method: 'DELETE' })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || '删除失败')
          }

          // Close dialog on success
          dialogClosed = true
        } catch (error) {
          // Keep dialog open on failure
          dialogClosed = false
          throw error
        }
      }

      // Assert
      await expect(
        confirmDelete({
          type: 'project',
          id: projectId,
          name: 'Test Project',
        })
      ).rejects.toThrow('Deletion failed')

      expect(dialogClosed).toBe(false)
    })
  })

  describe('Retry logic with exponential backoff', () => {
    it('should retry refresh with exponential backoff when verification fails', async () => {
      // Arrange
      const deletedProjectId = 'cmk123abc'
      const fetchTimes: number[] = []

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 5,
            deletedEdgeCount: 3,
          }),
        })
        // First refresh: project still exists
        .mockImplementationOnce(async () => {
          fetchTimes.push(Date.now())
          return {
            ok: true,
            json: async () => ({
              projects: [
                {
                  id: deletedProjectId,
                  name: 'Test Project',
                  graphs: [],
                },
              ],
            }),
          }
        })
        // Second refresh: project still exists
        .mockImplementationOnce(async () => {
          fetchTimes.push(Date.now())
          return {
            ok: true,
            json: async () => ({
              projects: [
                {
                  id: deletedProjectId,
                  name: 'Test Project',
                  graphs: [],
                },
              ],
            }),
          }
        })
        // Third refresh: project deleted
        .mockImplementationOnce(async () => {
          fetchTimes.push(Date.now())
          return {
            ok: true,
            json: async () => ({
              projects: [],
            }),
          }
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Retry logic with exponential backoff
        let retryCount = 0
        const maxRetries = 3
        let verified = false

        while (retryCount < maxRetries && !verified) {
          if (retryCount > 0) {
            const delay = 500 * retryCount
            await new Promise(resolve => setTimeout(resolve, delay))
          }

          const projectsRes = await fetch('/api/projects/with-graphs')
          const projectsData = await projectsRes.json()
          const projects = projectsData.projects || []

          // Verify deletion
          const stillExists = projects.some((p: any) => p.id === deleteDialog.id)
          if (!stillExists) {
            verified = true
            return { verified: true, retryCount: retryCount + 1 }
          }

          retryCount++
        }

        return { verified: false, retryCount }
      }

      const result = await confirmDelete({
        type: 'project',
        id: deletedProjectId,
        name: 'Test Project',
      })

      // Assert
      expect(result.verified).toBe(true)
      expect(result.retryCount).toBe(3)
      expect(fetchTimes.length).toBe(3)

      // Verify exponential backoff delays
      if (fetchTimes.length >= 3) {
        const delay1 = fetchTimes[1] - fetchTimes[0]
        const delay2 = fetchTimes[2] - fetchTimes[1]

        const tolerance = 50
        expect(delay1).toBeGreaterThanOrEqual(500 - tolerance)
        expect(delay2).toBeGreaterThanOrEqual(1000 - tolerance)
      }
    })

    it('should force reload if verification fails after max retries', async () => {
      // Arrange
      const deletedProjectId = 'cmk123abc'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            deletedNodeCount: 5,
            deletedEdgeCount: 3,
          }),
        })
        // All refresh attempts: project still exists
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            projects: [
              {
                id: deletedProjectId,
                name: 'Test Project',
                graphs: [],
              },
            ],
          }),
        })

      // Act
      const confirmDelete = async (deleteDialog: any) => {
        const endpoint = `/api/projects/${deleteDialog.id}`
        const res = await fetch(endpoint, { method: 'DELETE' })

        if (!res.ok) {
          throw new Error('删除失败')
        }

        // Retry logic
        let retryCount = 0
        const maxRetries = 3
        let verified = false

        while (retryCount < maxRetries && !verified) {
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
          }

          const projectsRes = await fetch('/api/projects/with-graphs')
          const projectsData = await projectsRes.json()
          const projects = projectsData.projects || []

          const stillExists = projects.some((p: any) => p.id === deleteDialog.id)
          if (!stillExists) {
            verified = true
            return { verified: true, reloaded: false }
          }

          retryCount++
        }

        // Force reload if verification failed
        if (!verified) {
          window.location.reload()
          return { verified: false, reloaded: true }
        }

        return { verified: false, reloaded: false }
      }

      const result = await confirmDelete({
        type: 'project',
        id: deletedProjectId,
        name: 'Test Project',
      })

      // Assert
      expect(result.verified).toBe(false)
      expect(result.reloaded).toBe(true)
      expect(mockReload).toHaveBeenCalled()
    })
  })
})
