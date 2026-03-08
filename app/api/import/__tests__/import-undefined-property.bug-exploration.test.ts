/**
 * Bug Condition Exploration Test for Import Undefined Property Fix
 * 
 * CRITICAL: This test MUST FAIL on unfixed code
 * 
 * Purpose: Demonstrate the bug exists by testing successful import scenarios
 * Expected behavior: Test should PASS after fix is implemented
 * 
 * Bug: Code accesses validatedData.edge.length (undefined) instead of validatedData.edges.length
 * Result: TypeError when building success response
 */

/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock dependencies BEFORE imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    graph: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    project: {
      update: jest.fn()
    },
    node: {
      create: jest.fn()
    },
    edge: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

jest.mock('@/lib/services/graph-import', () => ({
  importAndValidateGraphData: jest.fn(),
  generateLayout: jest.fn()
}))

jest.mock('@/lib/services/duplicate-detection', () => ({
  detectAndFilterDuplicates: jest.fn()
}))

jest.mock('@/lib/db-helpers', () => ({
  retryOperation: jest.fn((fn) => fn()),
  getDescriptiveErrorMessage: jest.fn((error) => String(error))
}))

// Import after mocks
import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { importAndValidateGraphData, generateLayout } from '@/lib/services/graph-import'
import { detectAndFilterDuplicates } from '@/lib/services/duplicate-detection'
import { NextRequest } from 'next/server'

describe('Bug Exploration: Import Undefined Property Access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * Test Case 1: Complete Import - All Edges Created
   * 
   * Scenario: User uploads valid file with nodes and edges, all edges successfully created
   * Expected on UNFIXED code: TypeError when accessing validatedData.edge.length
   * Expected on FIXED code: 200 response with correct skippedEdges value
   */
  it('should return 200 with correct skippedEdges when all edges are created', async () => {
    // Setup mock data
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const mockProjectId = 'project-123'
    const mockGraphId = 'graph-456'

    // Mock graph lookup
    ;(prisma.graph.findUnique as jest.Mock).mockResolvedValue({
      id: mockGraphId,
      projectId: mockProjectId,
      project: { id: mockProjectId }
    })

    // Mock import result with validatedData containing edges (plural)
    const mockValidatedData = {
      nodes: [
        { id: 'n1', label: 'Node 1', x: 0, y: 0, z: 0 },
        { id: 'n2', label: 'Node 2', x: 1, y: 1, z: 1 }
      ],
      edges: [
        { source: 'n1', target: 'n2', label: 'connects' }
      ],
      metadata: { type: '3D' as const }
    }

    ;(importAndValidateGraphData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockValidatedData,
      validatedData: mockValidatedData,
      errors: [],
      warnings: []
    })

    // Mock layout generation
    ;(generateLayout as jest.Mock).mockReturnValue(mockValidatedData.nodes)

    // Mock duplicate detection
    ;(detectAndFilterDuplicates as jest.Mock).mockResolvedValue({
      filtered: {
        nodes: mockValidatedData.nodes,
        edges: mockValidatedData.edges,
        originalNodeCount: 2,
        originalEdgeCount: 1
      },
      detection: {
        duplicateNodes: new Set(),
        duplicateEdges: new Set(),
        duplicateNodeCount: 0,
        duplicateEdgeCount: 0
      }
    })

    // Mock node creation
    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      { id: 'db-n1', name: 'Node 1' },
      { id: 'db-n2', name: 'Node 2' }
    ])

    // Mock edge creation
    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      { id: 'db-e1', label: 'connects' }
    ])

    // Mock graph and project updates
    ;(prisma.graph.update as jest.Mock).mockResolvedValue({})
    ;(prisma.project.update as jest.Mock).mockResolvedValue({})

    // Create request
    const formData = new FormData()
    formData.append('file', mockFile)
    formData.append('projectId', mockProjectId)
    formData.append('graphId', mockGraphId)
    formData.append('fileType', 'json')

    const request = new NextRequest('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData
    })

    // Execute
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('skippedEdges')
    expect(typeof data.skippedEdges).toBe('number')
    expect(data.skippedEdges).toBe(0) // All edges created, none skipped
    expect(data.nodesCount).toBe(2)
    expect(data.edgesCount).toBe(1)
  })

  /**
   * Test Case 2: Partial Import - Some Edges Skipped
   * 
   * Scenario: Some edges skipped due to node mapping failure
   * Expected on UNFIXED code: TypeError when accessing validatedData.edge.length
   * Expected on FIXED code: 200 response with correct skippedEdges count
   */
  it('should return 200 with correct skippedEdges when some edges are skipped', async () => {
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const mockProjectId = 'project-123'
    const mockGraphId = 'graph-456'

    ;(prisma.graph.findUnique as jest.Mock).mockResolvedValue({
      id: mockGraphId,
      projectId: mockProjectId,
      project: { id: mockProjectId }
    })

    const mockValidatedData = {
      nodes: [
        { id: 'n1', label: 'Node 1', x: 0, y: 0, z: 0 },
        { id: 'n2', label: 'Node 2', x: 1, y: 1, z: 1 }
      ],
      edges: [
        { source: 'n1', target: 'n2', label: 'valid' },
        { source: 'n1', target: 'n3', label: 'invalid' }, // n3 doesn't exist
        { source: 'n2', target: 'n4', label: 'invalid' }  // n4 doesn't exist
      ],
      metadata: { type: '3D' as const }
    }

    ;(importAndValidateGraphData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockValidatedData,
      validatedData: mockValidatedData,
      errors: [],
      warnings: []
    })

    ;(generateLayout as jest.Mock).mockReturnValue(mockValidatedData.nodes)

    ;(detectAndFilterDuplicates as jest.Mock).mockResolvedValue({
      filtered: {
        nodes: mockValidatedData.nodes,
        edges: mockValidatedData.edges,
        originalNodeCount: 2,
        originalEdgeCount: 3
      },
      detection: {
        duplicateNodes: new Set(),
        duplicateEdges: new Set(),
        duplicateNodeCount: 0,
        duplicateEdgeCount: 0
      }
    })

    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      { id: 'db-n1', name: 'Node 1' },
      { id: 'db-n2', name: 'Node 2' }
    ])

    // Only 1 edge created (2 skipped due to missing nodes)
    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      { id: 'db-e1', label: 'valid' }
    ])

    ;(prisma.graph.update as jest.Mock).mockResolvedValue({})
    ;(prisma.project.update as jest.Mock).mockResolvedValue({})

    const formData = new FormData()
    formData.append('file', mockFile)
    formData.append('projectId', mockProjectId)
    formData.append('graphId', mockGraphId)
    formData.append('fileType', 'json')

    const request = new NextRequest('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('skippedEdges')
    expect(data.skippedEdges).toBe(2) // 3 total edges - 1 created = 2 skipped
  })

  /**
   * Test Case 3: No Edges File
   * 
   * Scenario: File contains only nodes, no edges
   * Expected on UNFIXED code: TypeError when accessing validatedData.edge.length
   * Expected on FIXED code: 200 response with skippedEdges = 0
   */
  it('should return 200 with skippedEdges = 0 when file has no edges', async () => {
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const mockProjectId = 'project-123'
    const mockGraphId = 'graph-456'

    ;(prisma.graph.findUnique as jest.Mock).mockResolvedValue({
      id: mockGraphId,
      projectId: mockProjectId,
      project: { id: mockProjectId }
    })

    const mockValidatedData = {
      nodes: [
        { id: 'n1', label: 'Node 1', x: 0, y: 0, z: 0 }
      ],
      edges: [], // No edges
      metadata: { type: '3D' as const }
    }

    ;(importAndValidateGraphData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockValidatedData,
      validatedData: mockValidatedData,
      errors: [],
      warnings: []
    })

    ;(generateLayout as jest.Mock).mockReturnValue(mockValidatedData.nodes)

    ;(detectAndFilterDuplicates as jest.Mock).mockResolvedValue({
      filtered: {
        nodes: mockValidatedData.nodes,
        edges: [],
        originalNodeCount: 1,
        originalEdgeCount: 0
      },
      detection: {
        duplicateNodes: new Set(),
        duplicateEdges: new Set(),
        duplicateNodeCount: 0,
        duplicateEdgeCount: 0
      }
    })

    ;(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
      { id: 'db-n1', name: 'Node 1' }
    ])

    ;(prisma.graph.update as jest.Mock).mockResolvedValue({})
    ;(prisma.project.update as jest.Mock).mockResolvedValue({})

    const formData = new FormData()
    formData.append('file', mockFile)
    formData.append('projectId', mockProjectId)
    formData.append('graphId', mockGraphId)
    formData.append('fileType', 'json')

    const request = new NextRequest('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('skippedEdges')
    expect(data.skippedEdges).toBe(0) // No edges to skip
  })

  /**
   * Test Case 4: Large Dataset
   * 
   * Scenario: Large file with many nodes and edges
   * Expected on UNFIXED code: TypeError when accessing validatedData.edge.length
   * Expected on FIXED code: 200 response with accurate statistics
   */
  it('should handle large datasets and return correct skippedEdges', async () => {
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const mockProjectId = 'project-123'
    const mockGraphId = 'graph-456'

    ;(prisma.graph.findUnique as jest.Mock).mockResolvedValue({
      id: mockGraphId,
      projectId: mockProjectId,
      project: { id: mockProjectId }
    })

    // Generate large dataset
    const nodes = Array.from({ length: 100 }, (_, i) => ({
      id: `n${i}`,
      label: `Node ${i}`,
      x: i,
      y: i,
      z: i
    }))

    const edges = Array.from({ length: 200 }, (_, i) => ({
      source: `n${i % 100}`,
      target: `n${(i + 1) % 100}`,
      label: `edge-${i}`
    }))

    const mockValidatedData = {
      nodes,
      edges,
      metadata: { type: '3D' as const }
    }

    ;(importAndValidateGraphData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockValidatedData,
      validatedData: mockValidatedData,
      errors: [],
      warnings: []
    })

    ;(generateLayout as jest.Mock).mockReturnValue(nodes)

    ;(detectAndFilterDuplicates as jest.Mock).mockResolvedValue({
      filtered: {
        nodes,
        edges,
        originalNodeCount: 100,
        originalEdgeCount: 200
      },
      detection: {
        duplicateNodes: new Set(),
        duplicateEdges: new Set(),
        duplicateNodeCount: 0,
        duplicateEdgeCount: 0
      }
    })

    const mockCreatedNodes = nodes.map((n, i) => ({ id: `db-${n.id}`, name: n.label }))
    const mockCreatedEdges = edges.map((e, i) => ({ id: `db-e${i}`, label: e.label }))

    ;(prisma.$transaction as jest.Mock)
      .mockResolvedValueOnce(mockCreatedNodes)
      .mockResolvedValueOnce(mockCreatedEdges)

    ;(prisma.graph.update as jest.Mock).mockResolvedValue({})
    ;(prisma.project.update as jest.Mock).mockResolvedValue({})

    const formData = new FormData()
    formData.append('file', mockFile)
    formData.append('projectId', mockProjectId)
    formData.append('graphId', mockGraphId)
    formData.append('fileType', 'json')

    const request = new NextRequest('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('skippedEdges')
    expect(data.skippedEdges).toBe(0)
    expect(data.nodesCount).toBe(100)
    expect(data.edgesCount).toBe(200)
  })
})
