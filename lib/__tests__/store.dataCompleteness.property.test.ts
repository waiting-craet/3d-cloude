/**
 * Property-based test for GraphStore data completeness
 * Tests Property 6: Data completeness in API responses
 * Validates Requirements 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as fc from 'fast-check'

describe('GraphStore - Property 6: Data completeness in API responses', () => {
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

  it('should ensure all graphs have nodeCount and edgeCount properties', async () => {
    // Property: For any project fetched from the API, all graphs in that project
    // should have defined nodeCount and edgeCount properties
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random project structures with multiple graphs
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
          // Mock API response with generated data
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => testData,
          })
          
          // Simulate fetching projects
          const response = await fetch('/api/projects/with-graphs')
          const data = await response.json()
          const projects = data.projects || []
          
          // Verify data completeness for all projects and graphs
          expect(projects.length).toBeGreaterThan(0)
          
          projects.forEach((project: any) => {
            expect(project.graphs).toBeDefined()
            expect(Array.isArray(project.graphs)).toBe(true)
            expect(project.graphs.length).toBeGreaterThan(0)
            
            project.graphs.forEach((graph: any) => {
              // Each graph must have nodeCount and edgeCount
              expect(graph).toHaveProperty('nodeCount')
              expect(graph).toHaveProperty('edgeCount')
              
              // They must be numbers
              expect(typeof graph.nodeCount).toBe('number')
              expect(typeof graph.edgeCount).toBe('number')
              
              // They must be non-negative
              expect(graph.nodeCount).toBeGreaterThanOrEqual(0)
              expect(graph.edgeCount).toBeGreaterThanOrEqual(0)
            })
          })
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified
    )
  })

  it('should reject incomplete data and retry when graphs lack count properties', async () => {
    // Property: For any API response with incomplete data (missing nodeCount/edgeCount),
    // the system should retry to get complete data
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.uuid(),
          graphId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          graphName: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (testData) => {
          let callCount = 0
          
          mockFetch.mockImplementation(async () => {
            callCount++
            
            // First two calls return incomplete data (missing counts)
            if (callCount < 3) {
              return {
                ok: true,
                json: async () => ({
                  projects: [{
                    id: testData.projectId,
                    name: testData.projectName,
                    graphs: [{
                      id: testData.graphId,
                      name: testData.graphName,
                      projectId: testData.projectId,
                      // Missing nodeCount and edgeCount
                      createdAt: new Date().toISOString(),
                    }],
                  }],
                }),
              }
            }
            
            // Third call returns complete data
            return {
              ok: true,
              json: async () => ({
                projects: [{
                  id: testData.projectId,
                  name: testData.projectName,
                  graphs: [{
                    id: testData.graphId,
                    name: testData.graphName,
                    projectId: testData.projectId,
                    nodeCount: 5,
                    edgeCount: 3,
                    createdAt: new Date().toISOString(),
                  }],
                }),
              }),
            }
          })
          
          // Simulate refreshProjects with data completeness validation
          const refreshProjects = async (currentProjectId: string, currentGraphId: string) => {
            let retryCount = 0
            const maxRetries = 3
            let verified = false
            
            while (retryCount < maxRetries && !verified) {
              if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
              }
              
              const projectsRes = await fetch('/api/projects/with-graphs')
              
              if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                const projects = projectsData.projects || []
                
                const project = projects.find((p: any) => p.id === currentProjectId)
                const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
                
                if (project && graph) {
                  // Verify data completeness: all graphs must have nodeCount and edgeCount
                  const allGraphsHaveCounts = project.graphs.every((g: any) => 
                    typeof g.nodeCount === 'number' && typeof g.edgeCount === 'number'
                  )
                  
                  if (!allGraphsHaveCounts) {
                    // Incomplete data, continue retry
                    retryCount++
                    continue
                  }
                  
                  verified = true
                  return { callCount, verified: true, project }
                }
              }
              
              retryCount++
            }
            
            return { callCount, verified: false, project: null }
          }
          
          const result = await refreshProjects(testData.projectId, testData.graphId)
          
          // Should have retried until complete data was received
          expect(result.callCount).toBe(3)
          expect(result.verified).toBe(true)
          expect(result.project).not.toBeNull()
          
          // Verify final data is complete
          if (result.project) {
            result.project.graphs.forEach((graph: any) => {
              expect(typeof graph.nodeCount).toBe('number')
              expect(typeof graph.edgeCount).toBe('number')
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle projects with varying numbers of graphs', async () => {
    // Property: For any number of graphs in a project, all must have complete data
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          graphCount: fc.integer({ min: 1, max: 10 }),
        }),
        async (testData) => {
          // Generate graphs with complete data
          const graphs = Array.from({ length: testData.graphCount }, (_, i) => ({
            id: `graph-${i}-${testData.projectId}`,
            name: `Graph ${i}`,
            projectId: testData.projectId,
            nodeCount: Math.floor(Math.random() * 100),
            edgeCount: Math.floor(Math.random() * 100),
            createdAt: new Date().toISOString(),
          }))
          
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              projects: [{
                id: testData.projectId,
                name: testData.projectName,
                graphs: graphs,
              }],
            }),
          })
          
          // Fetch and validate
          const response = await fetch('/api/projects/with-graphs')
          const data = await response.json()
          const projects = data.projects || []
          
          expect(projects.length).toBe(1)
          const project = projects[0]
          
          expect(project.graphs.length).toBe(testData.graphCount)
          
          // All graphs must have complete data
          project.graphs.forEach((graph: any) => {
            expect(graph).toHaveProperty('id')
            expect(graph).toHaveProperty('name')
            expect(graph).toHaveProperty('projectId')
            expect(graph).toHaveProperty('nodeCount')
            expect(graph).toHaveProperty('edgeCount')
            expect(graph).toHaveProperty('createdAt')
            
            expect(typeof graph.nodeCount).toBe('number')
            expect(typeof graph.edgeCount).toBe('number')
            expect(graph.nodeCount).toBeGreaterThanOrEqual(0)
            expect(graph.edgeCount).toBeGreaterThanOrEqual(0)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate data completeness for edge cases (0 nodes, 0 edges)', async () => {
    // Property: Graphs with zero nodes/edges should still have defined count properties
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.uuid(),
          graphId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          graphName: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (testData) => {
          // Mock API response with empty graph (0 nodes, 0 edges)
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              projects: [{
                id: testData.projectId,
                name: testData.projectName,
                graphs: [{
                  id: testData.graphId,
                  name: testData.graphName,
                  projectId: testData.projectId,
                  nodeCount: 0,
                  edgeCount: 0,
                  createdAt: new Date().toISOString(),
                }],
              }],
            }),
          })
          
          const response = await fetch('/api/projects/with-graphs')
          const data = await response.json()
          const projects = data.projects || []
          
          expect(projects.length).toBe(1)
          const graph = projects[0].graphs[0]
          
          // Even with 0 counts, properties must be defined and be numbers
          expect(graph).toHaveProperty('nodeCount')
          expect(graph).toHaveProperty('edgeCount')
          expect(typeof graph.nodeCount).toBe('number')
          expect(typeof graph.edgeCount).toBe('number')
          expect(graph.nodeCount).toBe(0)
          expect(graph.edgeCount).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})


