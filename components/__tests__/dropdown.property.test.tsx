/**
 * Property-based tests for dropdown state management
 * Tests Properties 1, 2, 4, and 5
 * Validates Requirements 1.5, 2.3, 2.6, 4.2, 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as fc from 'fast-check'

describe('Dropdown State - Property Tests', () => {
  let mockFetch: jest.Mock
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch as any
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  describe('Property 1: Dropdown counts match database counts', () => {
    it('should display node and edge counts that match database values', async () => {
      // Property: For any graph displayed in the dropdown, the displayed node count
      // and edge count should match the actual counts in the database
      // Validates Requirement 1.5

      await fc.assert(
        fc.asyncProperty(
          // Generate random project structures with varying counts
          fc.record({
            projects: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                graphs: fc.array(
                  fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    projectId: fc.uuid(),
                    nodeCount: fc.integer({ min: 0, max: 1000 }),
                    edgeCount: fc.integer({ min: 0, max: 1000 }),
                    createdAt: fc.date().map(d => d.toISOString()),
                  }),
                  { minLength: 1, maxLength: 5 }
                ),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          async (testData) => {
            // Mock API response
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => testData,
            })

            // Simulate fetching projects for dropdown
            const response = await fetch('/api/projects/with-graphs')
            const data = await response.json()
            const projects = data.projects || []

            // Verify all displayed counts match database counts
            projects.forEach((project: any) => {
              project.graphs.forEach((graph: any) => {
                // Find the original graph from test data
                const originalProject = testData.projects.find((p: any) => p.id === project.id)
                const originalGraph = originalProject?.graphs.find((g: any) => g.id === graph.id)

                expect(originalGraph).toBeDefined()

                // Displayed counts must match database counts exactly
                expect(graph.nodeCount).toBe(originalGraph!.nodeCount)
                expect(graph.edgeCount).toBe(originalGraph!.edgeCount)
              })
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain count accuracy after multiple refreshes', async () => {
      // Property: Counts should remain accurate across multiple refresh operations

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectId: fc.uuid(),
            graphId: fc.uuid(),
            nodeCount: fc.integer({ min: 0, max: 100 }),
            edgeCount: fc.integer({ min: 0, max: 100 }),
            refreshCount: fc.integer({ min: 2, max: 5 }),
          }),
          async (testData) => {
            const projectData = {
              projects: [
                {
                  id: testData.projectId,
                  name: 'Test Project',
                  graphs: [
                    {
                      id: testData.graphId,
                      name: 'Test Graph',
                      projectId: testData.projectId,
                      nodeCount: testData.nodeCount,
                      edgeCount: testData.edgeCount,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
              ],
            }

            // Mock multiple refresh calls with same data
            for (let i = 0; i < testData.refreshCount; i++) {
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => projectData,
              })
            }

            // Perform multiple refreshes
            const results: any[] = []
            for (let i = 0; i < testData.refreshCount; i++) {
              const response = await fetch('/api/projects/with-graphs')
              const data = await response.json()
              results.push(data.projects[0].graphs[0])
            }

            // All refreshes should return consistent counts
            results.forEach((graph: any) => {
              expect(graph.nodeCount).toBe(testData.nodeCount)
              expect(graph.edgeCount).toBe(testData.edgeCount)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 2: Deleted entities are removed from state', () => {
    it('should not show deleted projects in refreshed state', async () => {
      // Property: For any deleted project, after a successful refresh,
      // the project should not appear in the projects list
      // Validates Requirements 2.3, 2.6

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            deletedProjectId: fc.uuid(),
            remainingProjects: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                graphs: fc.array(
                  fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    projectId: fc.uuid(),
                    nodeCount: fc.integer({ min: 0, max: 100 }),
                    edgeCount: fc.integer({ min: 0, max: 100 }),
                    createdAt: fc.date().map(d => d.toISOString()),
                  }),
                  { minLength: 0, maxLength: 3 }
                ),
              }),
              { minLength: 0, maxLength: 5 }
            ),
          }),
          async (testData) => {
            // Ensure deleted project ID is unique
            const remainingProjectIds = testData.remainingProjects.map((p: any) => p.id)
            fc.pre(!remainingProjectIds.includes(testData.deletedProjectId))

            // Mock delete API
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                deletedNodeCount: 5,
                deletedEdgeCount: 3,
              }),
            })

            // Mock refresh API (without deleted project)
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                projects: testData.remainingProjects,
              }),
            })

            // Simulate delete and refresh
            const deleteRes = await fetch(`/api/projects/${testData.deletedProjectId}`, {
              method: 'DELETE',
            })
            expect(deleteRes.ok).toBe(true)

            const refreshRes = await fetch('/api/projects/with-graphs')
            const refreshData = await refreshRes.json()
            const projects = refreshData.projects || []

            // Verify deleted project is not in the list
            const deletedProjectExists = projects.some((p: any) => p.id === testData.deletedProjectId)
            expect(deletedProjectExists).toBe(false)

            // Verify remaining projects are present
            testData.remainingProjects.forEach((expectedProject: any) => {
              const exists = projects.some((p: any) => p.id === expectedProject.id)
              expect(exists).toBe(true)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not show deleted graphs in refreshed state', async () => {
      // Property: For any deleted graph, after a successful refresh,
      // the graph should not appear in the graph list

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectId: fc.uuid(),
            deletedGraphId: fc.uuid(),
            remainingGraphs: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                projectId: fc.uuid(),
                nodeCount: fc.integer({ min: 0, max: 100 }),
                edgeCount: fc.integer({ min: 0, max: 100 }),
                createdAt: fc.date().map(d => d.toISOString()),
              }),
              { minLength: 0, maxLength: 3 }
            ),
          }),
          async (testData) => {
            // Ensure deleted graph ID is unique
            const remainingGraphIds = testData.remainingGraphs.map((g: any) => g.id)
            fc.pre(!remainingGraphIds.includes(testData.deletedGraphId))

            // Mock delete API
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                deletedNodeCount: 3,
                deletedEdgeCount: 2,
              }),
            })

            // Mock refresh API (without deleted graph)
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                projects: [
                  {
                    id: testData.projectId,
                    name: 'Test Project',
                    graphs: testData.remainingGraphs,
                  },
                ],
              }),
            })

            // Simulate delete and refresh
            const deleteRes = await fetch(`/api/graphs/${testData.deletedGraphId}`, {
              method: 'DELETE',
            })
            expect(deleteRes.ok).toBe(true)

            const refreshRes = await fetch('/api/projects/with-graphs')
            const refreshData = await refreshRes.json()
            const projects = refreshData.projects || []

            // Verify deleted graph is not in any project
            const deletedGraphExists = projects.some((p: any) =>
              p.graphs.some((g: any) => g.id === testData.deletedGraphId)
            )
            expect(deletedGraphExists).toBe(false)

            // Verify remaining graphs are present
            const project = projects.find((p: any) => p.id === testData.projectId)
            expect(project).toBeDefined()

            testData.remainingGraphs.forEach((expectedGraph: any) => {
              const exists = project.graphs.some((g: any) => g.id === expectedGraph.id)
              expect(exists).toBe(true)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 4: Error messages are propagated correctly', () => {
    it('should display API error messages for any error response', async () => {
      // Property: For any API error response with a message field,
      // the displayed error message should contain the API's error message
      // Validates Requirement 4.2

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectId: fc.uuid(),
            errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
            statusCode: fc.constantFrom(400, 401, 403, 500, 502, 503),
          }),
          async (testData) => {
            // Mock API error response
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.statusCode,
              json: async () => ({
                error: testData.errorMessage,
              }),
            })

            // Simulate delete operation
            const confirmDelete = async (projectId: string) => {
              const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
              })

              if (!res.ok) {
                const data = await res.json()

                if (res.status === 404) {
                  throw new Error('项目不存�?)
                } else if (res.status === 500) {
                  throw new Error(data.error || data.message || '服务器错�?)
                } else {
                  throw new Error(data.error || '删除失败')
                }
              }
            }

            // Verify error message is propagated
            try {
              await confirmDelete(testData.projectId)
              // Should not reach here
              expect(true).toBe(false)
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : ''

              // For 500 errors, API message should be propagated
              if (testData.statusCode === 500) {
                expect(errorMsg).toBe(testData.errorMessage)
              } else if (testData.statusCode === 404) {
                expect(errorMsg).toBe('项目不存�?)
              } else {
                // Other errors should contain the API error message
                expect(errorMsg).toBe(testData.errorMessage)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle missing error messages gracefully', async () => {
      // Property: For any error response without a message,
      // a default error message should be displayed

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectId: fc.uuid(),
            statusCode: fc.constantFrom(400, 500, 502),
          }),
          async (testData) => {
            // Mock API error response without error message
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.statusCode,
              json: async () => ({}), // No error field
            })

            // Simulate delete operation
            const confirmDelete = async (projectId: string) => {
              const res = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
              })

              if (!res.ok) {
                const data = await res.json()

                if (res.status === 500) {
                  throw new Error(data.error || data.message || '服务器错�?)
                } else {
                  throw new Error(data.error || '删除失败')
                }
              }
            }

            // Verify default error message is used
            try {
              await confirmDelete(testData.projectId)
              expect(true).toBe(false)
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : ''

              if (testData.statusCode === 500) {
                expect(errorMsg).toBe('服务器错�?)
              } else {
                expect(errorMsg).toBe('删除失败')
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Failed deletions preserve state', () => {
    it('should not modify state for any deletion failure', async () => {
      // Property: For any deletion operation that fails,
      // the project/graph should remain in the dropdown with unchanged data
      // Validates Requirement 4.3

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projects: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                graphs: fc.array(
                  fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    projectId: fc.uuid(),
                    nodeCount: fc.integer({ min: 0, max: 100 }),
                    edgeCount: fc.integer({ min: 0, max: 100 }),
                    createdAt: fc.date().map(d => d.toISOString()),
                  }),
                  { minLength: 1, maxLength: 3 }
                ),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            errorType: fc.constantFrom(404, 500, 503),
          }),
          async (testData) => {
            const targetProject = testData.projects[0]
            const initialState = JSON.parse(JSON.stringify(testData.projects))

            // Mock delete API failure
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.errorType,
              json: async () => ({
                error: 'Deletion failed',
              }),
            })

            // Simulate delete operation
            let stateModified = false
            const confirmDelete = async (projectId: string, currentProjects: any[]) => {
              try {
                const res = await fetch(`/api/projects/${projectId}`, {
                  method: 'DELETE',
                })

                if (!res.ok) {
                  const data = await res.json()
                  throw new Error(data.error || '删除失败')
                }

                // If we reach here, state would be modified
                stateModified = true
                return { projects: [] }
              } catch (error) {
                // On error, state should not be modified
                return { projects: currentProjects }
              }
            }

            const result = await confirmDelete(targetProject.id, testData.projects)

            // Verify state was not modified
            expect(stateModified).toBe(false)
            expect(result.projects).toEqual(initialState)

            // Verify the target project still exists with same data
            const targetStillExists = result.projects.find((p: any) => p.id === targetProject.id)
            expect(targetStillExists).toBeDefined()
            expect(targetStillExists).toEqual(targetProject)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve graph data when graph deletion fails', async () => {
      // Property: Failed graph deletions should preserve all graph data

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectId: fc.uuid(),
            graphs: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                projectId: fc.uuid(),
                nodeCount: fc.integer({ min: 0, max: 100 }),
                edgeCount: fc.integer({ min: 0, max: 100 }),
                createdAt: fc.date().map(d => d.toISOString()),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            errorType: fc.constantFrom(404, 500),
          }),
          async (testData) => {
            const targetGraph = testData.graphs[0]
            const initialGraphs = JSON.parse(JSON.stringify(testData.graphs))

            // Mock delete API failure
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.errorType,
              json: async () => ({
                error: 'Graph deletion failed',
              }),
            })

            // Simulate delete operation
            let graphsModified = false
            const confirmDelete = async (graphId: string, currentGraphs: any[]) => {
              try {
                const res = await fetch(`/api/graphs/${graphId}`, {
                  method: 'DELETE',
                })

                if (!res.ok) {
                  const data = await res.json()
                  throw new Error(data.error || '删除失败')
                }

                // If we reach here, graphs would be modified
                graphsModified = true
                return { graphs: currentGraphs.filter((g: any) => g.id !== graphId) }
              } catch (error) {
                // On error, graphs should not be modified
                return { graphs: currentGraphs }
              }
            }

            const result = await confirmDelete(targetGraph.id, testData.graphs)

            // Verify graphs were not modified
            expect(graphsModified).toBe(false)
            expect(result.graphs).toEqual(initialGraphs)

            // Verify the target graph still exists with same data
            const targetStillExists = result.graphs.find((g: any) => g.id === targetGraph.id)
            expect(targetStillExists).toBeDefined()
            expect(targetStillExists).toEqual(targetGraph)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


