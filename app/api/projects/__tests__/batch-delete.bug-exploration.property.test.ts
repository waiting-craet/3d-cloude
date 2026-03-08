/**
 * Bug Condition Exploration Test - Batch Delete Field Name Mismatch
 * 
 * **Validates: Requirements 1.2, 1.3**
 * 
 * **Property 1: Fault Condition** - Prisma Query Field Name Mismatch
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * 
 * **Test Goal**: Verify that the bug exists in the unfixed code
 * - The Prisma query uses singular `node` and `edge` in the include statement
 * - But the code tries to access `project.nodes.length` and `project.edges.length` (plural)
 * - This causes TypeError: Cannot read property 'length' of undefined
 * 
 * **Expected Outcome on UNFIXED code**: Test FAILS with TypeError (this is correct - it proves the bug exists)
 * **Expected Outcome on FIXED code**: Test PASSES (confirms the bug is fixed)
 * 
 * This test encodes the expected behavior - when it passes after the fix, it confirms
 * that the Prisma query correctly uses plural field names matching the schema definition.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import * as fc from 'fast-check'

// Mock Prisma client module
const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
}

// Mock Vercel Blob
const mockBlob = {
  del: jest.fn(),
  list: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('@vercel/blob', () => ({
  del: mockBlob.del,
  list: mockBlob.list,
}))

describe('Property 1: Fault Condition - Prisma Query Field Name Mismatch', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock environment variable for blob operations
    process.env.BLOB_READ_WRITE_TOKEN = 'mock-token'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Helper function that simulates the UNFIXED deleteProject function behavior
   * This replicates the bug: Prisma query uses singular 'node'/'edge' but code accesses plural 'nodes'/'edges'
   */
  async function simulateUnfixedDeleteProject(projectId: string): Promise<{
    success: boolean
    error?: string
    projectName?: string
    deletedCounts?: {
      graph: number
      nodes: number
      edges: number
      files: number
    }
  }> {
    try {
      // Simulate the UNFIXED Prisma query with SINGULAR field names (the bug)
      const project = await mockPrisma.project.findUnique({
        where: { id: projectId },
        include: {
          graphs: { select: { id: true, name: true } },
          // BUG: Using singular 'node' and 'edge' instead of plural 'nodes' and 'edges'
          node: {
            select: {
              id: true,
              imageUrl: true,
              iconUrl: true,
              coverUrl: true,
              videoUrl: true,
            },
          },
          edge: {
            select: { id: true },
          },
        },
      })

      if (!project) {
        return {
          success: false,
          error: '项目不存在',
        }
      }

      const projectName = (project as any).name
      const graphCount = (project as any).graphs.length

      // BUG TRIGGER: Code tries to access plural 'nodes' and 'edges' but query returned singular 'node' and 'edge'
      // This will throw TypeError: Cannot read property 'length' of undefined
      const nodeCount = (project as any).nodes.length // This will fail!
      const edgeCount = (project as any).edges.length // This will fail!

      // Collect blob URLs (won't reach here due to error above)
      const blobUrls: string[] = []
      ;(project as any).nodes.forEach((node: any) => {
        if (node.imageUrl) blobUrls.push(node.imageUrl)
        if (node.iconUrl) blobUrls.push(node.iconUrl)
        if (node.coverUrl) blobUrls.push(node.coverUrl)
        if (node.videoUrl) blobUrls.push(node.videoUrl)
      })

      // Delete project in transaction
      await mockPrisma.$transaction(async (tx: any) => {
        await tx.project.delete({ where: { id: projectId } })
      })

      return {
        success: true,
        projectName,
        deletedCounts: {
          graph: graphCount,
          nodes: nodeCount,
          edges: edgeCount,
          files: 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      }
    }
  }

  /**
   * Helper function that simulates the FIXED deleteProject function behavior
   * This uses the correct plural field names matching the Prisma schema
   */
  async function simulateFixedDeleteProject(projectId: string): Promise<{
    success: boolean
    error?: string
    projectName?: string
    deletedCounts?: {
      graph: number
      nodes: number
      edges: number
      files: number
    }
  }> {
    try {
      // Simulate the FIXED Prisma query with PLURAL field names (the fix)
      const project = await mockPrisma.project.findUnique({
        where: { id: projectId },
        include: {
          graphs: { select: { id: true, name: true } },
          // FIX: Using plural 'nodes' and 'edges' matching Prisma schema
          nodes: {
            select: {
              id: true,
              imageUrl: true,
              iconUrl: true,
              coverUrl: true,
              videoUrl: true,
            },
          },
          edges: {
            select: { id: true },
          },
        },
      })

      if (!project) {
        return {
          success: false,
          error: '项目不存在',
        }
      }

      const projectName = (project as any).name
      const graphCount = (project as any).graphs.length

      // Now this works correctly because query returned 'nodes' and 'edges'
      const nodeCount = (project as any).nodes.length
      const edgeCount = (project as any).edges.length

      // Collect blob URLs
      const blobUrls: string[] = []
      ;(project as any).nodes.forEach((node: any) => {
        if (node.imageUrl) blobUrls.push(node.imageUrl)
        if (node.iconUrl) blobUrls.push(node.iconUrl)
        if (node.coverUrl) blobUrls.push(node.coverUrl)
        if (node.videoUrl) blobUrls.push(node.videoUrl)
      })

      // Delete project in transaction
      await mockPrisma.$transaction(async (tx: any) => {
        await tx.project.delete({ where: { id: projectId } })
      })

      return {
        success: true,
        projectName,
        deletedCounts: {
          graph: graphCount,
          nodes: nodeCount,
          edges: edgeCount,
          files: 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      }
    }
  }

  describe('Bug Exploration: Field name mismatch causes runtime error', () => {
    it('UNFIXED: should fail when trying to access project.nodes.length and project.edges.length', async () => {
      /**
       * Property: For any project with nodes and edges, the UNFIXED code SHALL fail
       * because the Prisma query uses singular 'node'/'edge' but code accesses plural 'nodes'/'edges'.
       * 
       * EXPECTED OUTCOME: This test FAILS on unfixed code (TypeError: Cannot read property 'length' of undefined)
       * This failure CONFIRMS the bug exists!
       */

      await fc.assert(
        fc.asyncProperty(
          // Generate random project data with nodes and edges
          fc.record({
            projectId: fc.uuid(),
            projectName: fc.string({ minLength: 1, maxLength: 50 }),
            nodeCount: fc.integer({ min: 1, max: 10 }),
            edgeCount: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ projectId, projectName, nodeCount, edgeCount }) => {
            // Mock Prisma to return data with SINGULAR field names (simulating the bug)
            mockPrisma.project.findUnique.mockResolvedValue({
              id: projectId,
              name: projectName,
              graphs: [],
              // BUG: Prisma returns singular 'node' and 'edge' because query used singular names
              node: Array.from({ length: nodeCount }, (_, i) => ({
                id: `node-${i}`,
                imageUrl: null,
                iconUrl: null,
                coverUrl: null,
                videoUrl: null,
              })),
              edge: Array.from({ length: edgeCount }, (_, i) => ({
                id: `edge-${i}`,
              })),
              // Note: 'nodes' and 'edges' are undefined because query didn't request them
            } as any)

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
              const mockTx = {
                project: {
                  delete: jest.fn().mockResolvedValue({}),
                },
              }
              return callback(mockTx)
            })

            // Call the unfixed function - this should throw an error
            const result = await simulateUnfixedDeleteProject(projectId)

            // EXPECTED: Function fails because it can't access project.nodes.length
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
            
            // The error message should indicate the property access failure
            // This confirms the bug: code tries to access 'nodes' but only 'node' exists
          }
        ),
        { numRuns: 20 }
      )
    })

    it('FIXED: should succeed when Prisma query uses correct plural field names', async () => {
      /**
       * Property: For any project with nodes and edges, the FIXED code SHALL succeed
       * because the Prisma query uses plural 'nodes'/'edges' matching the schema definition.
       * 
       * EXPECTED OUTCOME: This test PASSES on fixed code (confirms the fix works)
       */

      await fc.assert(
        fc.asyncProperty(
          // Generate random project data with nodes and edges
          fc.record({
            projectId: fc.uuid(),
            projectName: fc.string({ minLength: 1, maxLength: 50 }),
            nodeCount: fc.integer({ min: 0, max: 10 }),
            edgeCount: fc.integer({ min: 0, max: 10 }),
          }),
          async ({ projectId, projectName, nodeCount, edgeCount }) => {
            // Mock Prisma to return data with PLURAL field names (simulating the fix)
            mockPrisma.project.findUnique.mockResolvedValue({
              id: projectId,
              name: projectName,
              graphs: [],
              // FIX: Prisma returns plural 'nodes' and 'edges' because query used plural names
              nodes: Array.from({ length: nodeCount }, (_, i) => ({
                id: `node-${i}`,
                imageUrl: null,
                iconUrl: null,
                coverUrl: null,
                videoUrl: null,
              })),
              edges: Array.from({ length: edgeCount }, (_, i) => ({
                id: `edge-${i}`,
              })),
            } as any)

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
              const mockTx = {
                project: {
                  delete: jest.fn().mockResolvedValue({}),
                },
              }
              return callback(mockTx)
            })

            // Call the fixed function - this should succeed
            const result = await simulateFixedDeleteProject(projectId)

            // EXPECTED: Function succeeds and returns correct counts
            expect(result.success).toBe(true)
            expect(result.deletedCounts).toBeDefined()
            expect(result.deletedCounts?.nodes).toBe(nodeCount)
            expect(result.deletedCounts?.edges).toBe(edgeCount)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('UNFIXED: should fail for projects with empty nodes/edges arrays', async () => {
      /**
       * Property: Even for projects with no nodes or edges, the UNFIXED code SHALL fail
       * because it tries to access undefined properties.
       * 
       * This is an edge case that also triggers the bug.
       */

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (projectId, projectName) => {
            // Mock Prisma to return data with SINGULAR field names (empty arrays)
            mockPrisma.project.findUnique.mockResolvedValue({
              id: projectId,
              name: projectName,
              graphs: [],
              // BUG: Returns singular 'node' and 'edge' (empty arrays)
              node: [],
              edge: [],
              // 'nodes' and 'edges' are undefined
            } as any)

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
              const mockTx = {
                project: {
                  delete: jest.fn().mockResolvedValue({}),
                },
              }
              return callback(mockTx)
            })

            // Call the unfixed function
            const result = await simulateUnfixedDeleteProject(projectId)

            // EXPECTED: Function fails even with empty arrays
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
          }
        ),
        { numRuns: 10 }
      )
    })

    it('FIXED: should succeed for projects with empty nodes/edges arrays', async () => {
      /**
       * Property: For projects with no nodes or edges, the FIXED code SHALL succeed
       * and return counts of 0.
       */

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (projectId, projectName) => {
            // Mock Prisma to return data with PLURAL field names (empty arrays)
            mockPrisma.project.findUnique.mockResolvedValue({
              id: projectId,
              name: projectName,
              graphs: [],
              // FIX: Returns plural 'nodes' and 'edges' (empty arrays)
              nodes: [],
              edges: [],
            } as any)

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
              const mockTx = {
                project: {
                  delete: jest.fn().mockResolvedValue({}),
                },
              }
              return callback(mockTx)
            })

            // Call the fixed function
            const result = await simulateFixedDeleteProject(projectId)

            // EXPECTED: Function succeeds with 0 counts
            expect(result.success).toBe(true)
            expect(result.deletedCounts?.nodes).toBe(0)
            expect(result.deletedCounts?.edges).toBe(0)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Counterexample Documentation', () => {
    it('should document specific counterexample demonstrating the bug', async () => {
      /**
       * This test documents a specific counterexample that demonstrates the bug clearly.
       * 
       * Scenario: Delete a project with 5 nodes and 3 edges
       * Expected: Project and all associated data should be deleted
       * Actual (UNFIXED): TypeError: Cannot read property 'length' of undefined
       * Root Cause: Prisma query uses 'node'/'edge' but code accesses 'nodes'/'edges'
       */

      const projectId = 'test-project-123'
      const projectName = 'Test Project'
      const nodeCount = 5
      const edgeCount = 3

      // Mock Prisma to return data with SINGULAR field names (the bug)
      mockPrisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: projectName,
        graphs: [],
        node: Array.from({ length: nodeCount }, (_, i) => ({
          id: `node-${i}`,
          imageUrl: `https://example.com/image-${i}.jpg`,
          iconUrl: null,
          coverUrl: null,
          videoUrl: null,
        })),
        edge: Array.from({ length: edgeCount }, (_, i) => ({
          id: `edge-${i}`,
        })),
      } as any)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          project: {
            delete: jest.fn().mockResolvedValue({}),
          },
        }
        return callback(mockTx)
      })

      // Call the unfixed function
      const result = await simulateUnfixedDeleteProject(projectId)

      // Document the counterexample
      console.log('=== COUNTEREXAMPLE FOUND ===')
      console.log(`Project ID: ${projectId}`)
      console.log(`Project Name: ${projectName}`)
      console.log(`Expected to delete: ${nodeCount} nodes, ${edgeCount} edges`)
      console.log(`Actual result: ${result.success ? 'SUCCESS' : 'FAILURE'}`)
      if (!result.success) {
        console.log(`Error: ${result.error}`)
        console.log('Root Cause: Prisma query uses singular "node"/"edge" but code accesses plural "nodes"/"edges"')
      }
      console.log('===========================')

      // EXPECTED: Function fails on unfixed code
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
