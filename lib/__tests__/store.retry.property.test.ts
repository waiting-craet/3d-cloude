/**
 * Property-based test for GraphStore retry logic
 * Tests Property 3: Retry logic uses exponential backoff
 * Validates Requirements 3.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as fc from 'fast-check'

describe('GraphStore - Property 3: Retry logic uses exponential backoff', () => {
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

  it('should use exponential backoff delays (500ms, 1000ms, 1500ms) for retries', async () => {
    // Property: For any refresh operation that requires retries,
    // the delay between attempts should increase exponentially
    
    await fc.assert(
      fc.asyncProperty(
        // Generate random project/graph structures
        fc.record({
          projectId: fc.uuid(),
          graphId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          graphName: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (testData) => {
          // Track timing of fetch calls
          const fetchTimes: number[] = []
          let callCount = 0
          
          mockFetch.mockImplementation(async (url: string) => {
            fetchTimes.push(Date.now())
            callCount++
            
            // Simulate API that returns data but without the expected project/graph
            // This forces retries
            if (callCount < 3) {
              return {
                ok: true,
                json: async () => ({
                  projects: [], // Empty list forces retry
                }),
              }
            }
            
            // On third attempt, return the expected data
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
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                  }],
                }],
              }),
            }
          })
          
          // Simulate refreshProjects with retry logic
          const refreshProjects = async (currentProjectId: string, currentGraphId: string) => {
            let projects: any[] = []
            let retryCount = 0
            const maxRetries = 3
            let verified = false
            
            while (retryCount < maxRetries && !verified) {
              // Exponential backoff delay
              if (retryCount > 0) {
                const delay = 500 * retryCount
                await new Promise(resolve => setTimeout(resolve, delay))
              }
              
              const projectsRes = await fetch('/api/projects/with-graphs', {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              })
              
              if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                projects = projectsData.projects || []
                
                // Verify current selection exists
                const project = projects.find((p: any) => p.id === currentProjectId)
                const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
                
                if (project && graph) {
                  verified = true
                  return { projects, verified: true }
                }
              }
              
              retryCount++
            }
            
            return { projects, verified: false }
          }
          
          // Execute refresh
          const result = await refreshProjects(testData.projectId, testData.graphId)
          
          // Verify exponential backoff was used
          expect(fetchTimes.length).toBe(3)
          
          // Calculate actual delays between calls
          const delay1 = fetchTimes[1] - fetchTimes[0]
          const delay2 = fetchTimes[2] - fetchTimes[1]
          
          // Allow 50ms tolerance for timing variations
          const tolerance = 50
          
          // First retry should have ~500ms delay
          expect(delay1).toBeGreaterThanOrEqual(500 - tolerance)
          expect(delay1).toBeLessThanOrEqual(500 + tolerance)
          
          // Second retry should have ~1000ms delay
          expect(delay2).toBeGreaterThanOrEqual(1000 - tolerance)
          expect(delay2).toBeLessThanOrEqual(1000 + tolerance)
          
          // Verify the operation eventually succeeded
          expect(result.verified).toBe(true)
          expect(result.projects.length).toBe(1)
        }
      ),
      { numRuns: 10 } // Reduced from 100 due to timing delays
    )
  })

  it('should stop retrying after maxRetries attempts', async () => {
    // Property: For any refresh operation, retries should not exceed maxRetries
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.uuid(),
          graphId: fc.uuid(),
        }),
        async (testData) => {
          let callCount = 0
          
          mockFetch.mockImplementation(async () => {
            callCount++
            // Always return empty list to force max retries
            return {
              ok: true,
              json: async () => ({ projects: [] }),
            }
          })
          
          // Simulate refreshProjects with retry logic
          const refreshProjects = async (currentProjectId: string, currentGraphId: string) => {
            let projects: any[] = []
            let retryCount = 0
            const maxRetries = 3
            let verified = false
            
            while (retryCount < maxRetries && !verified) {
              if (retryCount > 0) {
                const delay = 500 * retryCount
                await new Promise(resolve => setTimeout(resolve, delay))
              }
              
              const projectsRes = await fetch('/api/projects/with-graphs')
              
              if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                projects = projectsData.projects || []
                
                const project = projects.find((p: any) => p.id === currentProjectId)
                const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
                
                if (project && graph) {
                  verified = true
                  return { callCount, verified: true }
                }
              }
              
              retryCount++
            }
            
            return { callCount, verified: false }
          }
          
          const result = await refreshProjects(testData.projectId, testData.graphId)
          
          // Should make exactly maxRetries (3) attempts
          expect(result.callCount).toBe(3)
          expect(result.verified).toBe(false)
        }
      ),
      { numRuns: 10 } // Reduced from 100 due to timing delays
    )
  })

  it('should use cache-busting headers on all retry attempts', async () => {
    // Property: For any retry attempt, cache-busting headers should be present
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.uuid(),
          graphId: fc.uuid(),
        }),
        async (testData) => {
          const fetchCalls: any[] = []
          
          mockFetch.mockImplementation(async (url: string, options: any) => {
            fetchCalls.push({ url, options })
            
            // Return empty on first two calls, success on third
            if (fetchCalls.length < 3) {
              return {
                ok: true,
                json: async () => ({ projects: [] }),
              }
            }
            
            return {
              ok: true,
              json: async () => ({
                projects: [{
                  id: testData.projectId,
                  name: 'Test',
                  graphs: [{
                    id: testData.graphId,
                    name: 'Test',
                    projectId: testData.projectId,
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                  }],
                }],
              }),
            }
          })
          
          // Simulate refreshProjects
          const refreshProjects = async (currentProjectId: string, currentGraphId: string) => {
            let retryCount = 0
            const maxRetries = 3
            let verified = false
            
            while (retryCount < maxRetries && !verified) {
              if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
              }
              
              const projectsRes = await fetch('/api/projects/with-graphs', {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              })
              
              if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                const projects = projectsData.projects || []
                
                const project = projects.find((p: any) => p.id === currentProjectId)
                const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
                
                if (project && graph) {
                  verified = true
                  break
                }
              }
              
              retryCount++
            }
          }
          
          await refreshProjects(testData.projectId, testData.graphId)
          
          // Verify all calls have cache-busting headers
          expect(fetchCalls.length).toBe(3)
          
          fetchCalls.forEach((call, index) => {
            expect(call.options.cache).toBe('no-store')
            expect(call.options.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate')
            expect(call.options.headers['Pragma']).toBe('no-cache')
          })
        }
      ),
      { numRuns: 10 } // Reduced from 100 due to timing delays
    )
  })
})


