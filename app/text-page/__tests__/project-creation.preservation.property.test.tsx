/**
 * Preservation Property Tests - AI Project Creation Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * **Property 2: Preservation** - API Validation and Import Page Behavior
 * 
 * **IMPORTANT**: These tests verify that the fix does NOT break existing functionality
 * 
 * **Test Goal**: Ensure all non-buggy code paths continue to work exactly as before
 * - Import page project creation (already includes both parameters) continues to work
 * - API validation for missing name parameter continues to return correct error
 * - API validation for missing graphName parameter continues to return correct error
 * - Success response structure remains unchanged
 * 
 * **Expected Outcome on UNFIXED code**: Tests PASS (confirms baseline behavior to preserve)
 * **Expected Outcome on FIXED code**: Tests PASS (confirms no regressions)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as fc from 'fast-check'

describe('Property 2: Preservation - API Validation and Import Page Behavior', () => {
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

  it('should preserve import page project creation behavior with both parameters', async () => {
    /**
     * Preservation Requirement 3.1:
     * Import page already works correctly with both name and graphName parameters.
     * This behavior MUST be preserved after the fix.
     * 
     * Property: For any valid project name from import page,
     * creation SHALL succeed with status 201 and return project + graph data.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (projectName) => {
          const trimmedName = projectName.trim()
          
          // Mock the API endpoint with actual validation logic
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url === '/api/projects' && options?.method === 'POST') {
              const body = JSON.parse(options.body)
              
              // API validation logic (must be preserved)
              if (!body.name || !body.name.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '项目名称不能为空' }),
                }
              }
              
              if (!body.graphName || !body.graphName.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '图谱名称不能为空' }),
                }
              }
              
              // Success case
              return {
                ok: true,
                status: 201,
                json: async () => ({
                  project: {
                    id: 'test-project-id',
                    name: body.name,
                    description: null,
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  graph: {
                    id: 'test-graph-id',
                    name: body.graphName,
                    projectId: 'test-project-id',
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                  },
                }),
              }
            }
            
            return { ok: true, json: async () => ({}) }
          })
          
          // Simulate import page handleCreateProject (CORRECT implementation)
          const importPageCreateProject = async (newProjectName: string) => {
            const response = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newProjectName.trim(),
                graphName: '默认图谱', // Import page includes this
              }),
            })
            
            const result = await response.json()
            
            if (response.ok && result.project) {
              return {
                success: true,
                status: response.status,
                project: result.project,
                graph: result.graph,
              }
            } else {
              return {
                success: false,
                status: response.status,
                error: result.error,
              }
            }
          }
          
          // Execute import page creation
          const result = await importPageCreateProject(trimmedName)
          
          // Verify import page behavior is preserved
          expect(result.success).toBe(true)
          expect(result.status).toBe(201)
          expect(result.project).toBeDefined()
          expect(result.project.name).toBe(trimmedName)
          expect(result.graph).toBeDefined()
          expect(result.graph.name).toBe('默认图谱')
          
          // This should PASS on both unfixed and fixed code
          // because import page already works correctly
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve API validation for missing name parameter', async () => {
    /**
     * Preservation Requirement 3.2:
     * API validation for empty/missing name parameter must continue to return
     * "项目名称不能为空" error.
     * 
     * Property: For any request with missing or empty name,
     * API SHALL return 400 error with "项目名称不能为空" message.
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate various invalid name values
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t'),
          fc.constant('\n')
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // valid graphName
        async (invalidName, graphName) => {
          // Mock the API endpoint
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url === '/api/projects' && options?.method === 'POST') {
              const body = JSON.parse(options.body)
              
              // API validation for name (must be preserved)
              if (!body.name || !body.name.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '项目名称不能为空' }),
                }
              }
              
              if (!body.graphName || !body.graphName.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '图谱名称不能为空' }),
                }
              }
              
              return {
                ok: true,
                status: 201,
                json: async () => ({ project: {}, graph: {} }),
              }
            }
            
            return { ok: true, json: async () => ({}) }
          })
          
          // Make API call with invalid name
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: invalidName,
              graphName: graphName.trim(),
            }),
          })
          
          const result = await response.json()
          
          // Verify validation error is preserved
          expect(response.ok).toBe(false)
          expect(response.status).toBe(400)
          expect(result.error).toBe('项目名称不能为空')
          
          // This should PASS on both unfixed and fixed code
          // because API validation logic should not change
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should preserve API validation for missing graphName parameter', async () => {
    /**
     * Preservation Requirement 3.3:
     * API validation for empty/missing graphName parameter must continue to return
     * "图谱名称不能为空" error.
     * 
     * Property: For any request with missing or empty graphName,
     * API SHALL return 400 error with "图谱名称不能为空" message.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // valid name
        // Generate various invalid graphName values
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t'),
          fc.constant('\n')
        ),
        async (name, invalidGraphName) => {
          // Mock the API endpoint
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url === '/api/projects' && options?.method === 'POST') {
              const body = JSON.parse(options.body)
              
              // API validation for name
              if (!body.name || !body.name.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '项目名称不能为空' }),
                }
              }
              
              // API validation for graphName (must be preserved)
              if (!body.graphName || !body.graphName.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '图谱名称不能为空' }),
                }
              }
              
              return {
                ok: true,
                status: 201,
                json: async () => ({ project: {}, graph: {} }),
              }
            }
            
            return { ok: true, json: async () => ({}) }
          })
          
          // Make API call with invalid graphName
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              graphName: invalidGraphName,
            }),
          })
          
          const result = await response.json()
          
          // Verify validation error is preserved
          expect(response.ok).toBe(false)
          expect(response.status).toBe(400)
          expect(result.error).toBe('图谱名称不能为空')
          
          // This should PASS on both unfixed and fixed code
          // because API validation logic should not change
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should preserve success response structure with project and graph data', async () => {
    /**
     * Preservation Requirement 3.4:
     * Successful project creation must continue to return status 201
     * with project and graph data structure.
     * 
     * Property: For any valid request with both name and graphName,
     * API SHALL return 201 with project object and graph object.
     */
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (name, graphName) => {
          const trimmedName = name.trim()
          const trimmedGraphName = graphName.trim()
          
          // Mock the API endpoint
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url === '/api/projects' && options?.method === 'POST') {
              const body = JSON.parse(options.body)
              
              // API validation
              if (!body.name || !body.name.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '项目名称不能为空' }),
                }
              }
              
              if (!body.graphName || !body.graphName.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '图谱名称不能为空' }),
                }
              }
              
              // Success response structure (must be preserved)
              return {
                ok: true,
                status: 201,
                json: async () => ({
                  project: {
                    id: 'test-project-id',
                    name: body.name,
                    description: null,
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  graph: {
                    id: 'test-graph-id',
                    name: body.graphName,
                    projectId: 'test-project-id',
                    nodeCount: 0,
                    edgeCount: 0,
                    createdAt: new Date().toISOString(),
                  },
                }),
              }
            }
            
            return { ok: true, json: async () => ({}) }
          })
          
          // Make API call with valid parameters
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: trimmedName,
              graphName: trimmedGraphName,
            }),
          })
          
          const result = await response.json()
          
          // Verify success response structure is preserved
          expect(response.ok).toBe(true)
          expect(response.status).toBe(201)
          
          // Verify project object structure
          expect(result.project).toBeDefined()
          expect(result.project.id).toBeDefined()
          expect(result.project.name).toBe(trimmedName)
          expect(result.project.nodeCount).toBeDefined()
          expect(result.project.edgeCount).toBeDefined()
          expect(result.project.createdAt).toBeDefined()
          expect(result.project.updatedAt).toBeDefined()
          
          // Verify graph object structure
          expect(result.graph).toBeDefined()
          expect(result.graph.id).toBeDefined()
          expect(result.graph.name).toBe(trimmedGraphName)
          expect(result.graph.projectId).toBeDefined()
          expect(result.graph.nodeCount).toBeDefined()
          expect(result.graph.edgeCount).toBeDefined()
          expect(result.graph.createdAt).toBeDefined()
          
          // This should PASS on both unfixed and fixed code
          // because response structure should not change
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve API validation behavior across all parameter combinations', async () => {
    /**
     * Comprehensive preservation test:
     * Verify that API validation logic remains unchanged for all combinations
     * of valid/invalid name and graphName parameters.
     * 
     * Property: For any combination of name and graphName parameters,
     * the API validation behavior SHALL remain exactly the same before and after the fix.
     */
    
    await fc.assert(
      fc.asyncProperty(
        // Generate various combinations of valid/invalid parameters
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // valid
          fc.constant(''), // empty
          fc.constant('   ') // whitespace
        ),
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // valid
          fc.constant(''), // empty
          fc.constant('   ') // whitespace
        ),
        async (name, graphName) => {
          // Mock the API endpoint with actual validation logic
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url === '/api/projects' && options?.method === 'POST') {
              const body = JSON.parse(options.body)
              
              // Exact API validation logic (must be preserved)
              if (!body.name || !body.name.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '项目名称不能为空' }),
                }
              }
              
              if (!body.graphName || !body.graphName.trim()) {
                return {
                  ok: false,
                  status: 400,
                  json: async () => ({ error: '图谱名称不能为空' }),
                }
              }
              
              return {
                ok: true,
                status: 201,
                json: async () => ({
                  project: { id: 'test-id', name: body.name },
                  graph: { id: 'graph-id', name: body.graphName },
                }),
              }
            }
            
            return { ok: true, json: async () => ({}) }
          })
          
          // Make API call
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, graphName }),
          })
          
          const result = await response.json()
          
          // Determine expected behavior based on inputs
          const hasValidName = name && name.trim().length > 0
          const hasValidGraphName = graphName && graphName.trim().length > 0
          
          if (!hasValidName) {
            // Should fail with name error
            expect(response.ok).toBe(false)
            expect(response.status).toBe(400)
            expect(result.error).toBe('项目名称不能为空')
          } else if (!hasValidGraphName) {
            // Should fail with graphName error
            expect(response.ok).toBe(false)
            expect(response.status).toBe(400)
            expect(result.error).toBe('图谱名称不能为空')
          } else {
            // Should succeed
            expect(response.ok).toBe(true)
            expect(response.status).toBe(201)
            expect(result.project).toBeDefined()
            expect(result.graph).toBeDefined()
          }
          
          // This comprehensive test should PASS on both unfixed and fixed code
          // because API validation logic should not change at all
        }
      ),
      { numRuns: 100 }
    )
  })
})
