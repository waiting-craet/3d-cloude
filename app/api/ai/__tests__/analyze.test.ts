/**
 * Integration Tests for AI Analysis API Endpoint
 * 
 * Tests the /api/ai/analyze endpoint including:
 * - Successful analysis flow
 * - Duplicate detection with existing graph
 * - Error scenarios
 * 
 * Requirements: 1.1, 5.1, 6.1
 */

// Mock Next.js server components before importing
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    node: {
      findMany: jest.fn(),
    },
    edge: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock services
jest.mock('@/lib/services/ai-integration');
jest.mock('@/lib/services/duplicate-detection');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

import { POST } from '../analyze/route';
import { PrismaClient } from '@prisma/client';
import * as aiIntegration from '@/lib/services/ai-integration';
import * as duplicateDetection from '@/lib/services/duplicate-detection';

describe('POST /api/ai/analyze', () => {
  let mockPrisma: any;
  let mockAIService: any;
  let mockDuplicateService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mock instances
    mockPrisma = new PrismaClient();
    
    // Mock AI Integration Service
    mockAIService = {
      analyzeDocument: jest.fn(),
    };
    (aiIntegration.getAIIntegrationService as jest.Mock).mockReturnValue(mockAIService);

    // Mock Duplicate Detection Service
    mockDuplicateService = {
      detectDuplicateNodes: jest.fn(),
      detectRedundantEdges: jest.fn(),
    };
    (duplicateDetection.getDuplicateDetectionService as jest.Mock).mockReturnValue(mockDuplicateService);
  });

  /**
   * Helper function to create a mock NextRequest
   */
  function createMockRequest(body: any): any {
    return {
      json: async () => body,
    };
  }

  describe('Successful Analysis Flow', () => {
    it('should successfully analyze document text without existing graph', async () => {
      // Arrange
      const requestBody = {
        documentText: 'John works at Microsoft. Microsoft is located in Seattle.',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [
          { name: 'John', type: 'person', properties: { role: 'employee' } },
          { name: 'Microsoft', type: 'organization', properties: { industry: 'tech' } },
          { name: 'Seattle', type: 'location', properties: { country: 'USA' } },
        ],
        relationships: [
          { from: 'John', to: 'Microsoft', type: 'works_at', properties: {} },
          { from: 'Microsoft', to: 'Seattle', type: 'located_in', properties: {} },
        ],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.nodes).toHaveLength(3);
      expect(data.data.edges).toHaveLength(2);
      expect(data.data.stats).toEqual({
        totalNodes: 3,
        totalEdges: 2,
        duplicateNodes: 0,
        redundantEdges: 0,
        conflicts: 0,
      });

      // Verify nodes have temporary IDs
      expect(data.data.nodes[0].id).toBeDefined();
      expect(data.data.nodes[0].name).toBe('John');
      expect(data.data.nodes[0].type).toBe('person');
      expect(data.data.nodes[0].properties).toEqual({ role: 'employee' });

      // Verify edges reference node IDs
      expect(data.data.edges[0].fromNodeId).toBeDefined();
      expect(data.data.edges[0].toNodeId).toBeDefined();
      expect(data.data.edges[0].label).toBe('works_at');
    });

    it('should successfully analyze with 3d visualization type', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        visualizationType: '3d' as const,
      };

      const mockAIResult = {
        entities: [{ name: 'Entity1', type: 'concept', properties: {} }],
        relationships: [],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nodes).toHaveLength(1);
    });
  });

  describe('Duplicate Detection with Existing Graph', () => {
    it('should detect duplicate nodes and property conflicts', async () => {
      // Arrange
      const requestBody = {
        documentText: 'John works at Microsoft.',
        projectId: 'project-1',
        graphId: 'graph-1',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [
          { name: 'John', type: 'person', properties: { role: 'engineer' } },
          { name: 'Microsoft', type: 'organization', properties: {} },
        ],
        relationships: [
          { from: 'John', to: 'Microsoft', type: 'works_at', properties: {} },
        ],
      };

      const existingNodes = [
        {
          id: 'node-1',
          name: 'John',
          metadata: JSON.stringify({ role: 'manager' }), // Conflict!
        },
      ];

      const existingEdges: any[] = [];

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);
      mockPrisma.node.findMany.mockResolvedValue(existingNodes);
      mockPrisma.edge.findMany.mockResolvedValue(existingEdges);

      mockDuplicateService.detectDuplicateNodes.mockReturnValue([
        {
          newNodeIndex: 0,
          existingNodeId: 'node-1',
          conflicts: [
            {
              property: 'role',
              existingValue: 'manager',
              newValue: 'engineer',
            },
          ],
        },
      ]);

      mockDuplicateService.detectRedundantEdges.mockReturnValue([]);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.duplicateNodes).toBe(1);
      expect(data.data.stats.conflicts).toBe(1);

      // Verify duplicate node is marked
      const duplicateNode = data.data.nodes.find((n: any) => n.name === 'John');
      expect(duplicateNode.isDuplicate).toBe(true);
      expect(duplicateNode.duplicateOf).toBe('node-1');
      expect(duplicateNode.conflicts).toHaveLength(1);
      expect(duplicateNode.conflicts[0]).toEqual({
        property: 'role',
        existingValue: 'manager',
        newValue: 'engineer',
      });

      // Verify database was queried
      expect(mockPrisma.node.findMany).toHaveBeenCalledWith({
        where: { graphId: 'graph-1' },
        select: { id: true, name: true, metadata: true },
      });
    });

    it('should detect redundant edges', async () => {
      // Arrange
      const requestBody = {
        documentText: 'John works at Microsoft.',
        graphId: 'graph-1',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [
          { name: 'John', type: 'person', properties: {} },
          { name: 'Microsoft', type: 'organization', properties: {} },
        ],
        relationships: [
          { from: 'John', to: 'Microsoft', type: 'works_at', properties: {} },
        ],
      };

      const existingNodes = [
        { id: 'node-1', name: 'John', metadata: null },
        { id: 'node-2', name: 'Microsoft', metadata: null },
      ];

      const existingEdges = [
        {
          fromNodeId: 'node-1',
          toNodeId: 'node-2',
          label: 'works_at',
        },
      ];

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);
      mockPrisma.node.findMany.mockResolvedValue(existingNodes);
      mockPrisma.edge.findMany.mockResolvedValue(existingEdges);

      mockDuplicateService.detectDuplicateNodes.mockReturnValue([
        { newNodeIndex: 0, existingNodeId: 'node-1', conflicts: [] },
        { newNodeIndex: 1, existingNodeId: 'node-2', conflicts: [] },
      ]);

      mockDuplicateService.detectRedundantEdges.mockReturnValue([0]); // First edge is redundant

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.redundantEdges).toBe(1);

      // Verify redundant edge is marked
      const redundantEdge = data.data.edges[0];
      expect(redundantEdge.isRedundant).toBe(true);
    });

    it('should handle case-insensitive duplicate detection', async () => {
      // Arrange
      const requestBody = {
        documentText: 'JOHN works at microsoft.',
        graphId: 'graph-1',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [
          { name: 'JOHN', type: 'person', properties: {} },
          { name: 'microsoft', type: 'organization', properties: {} },
        ],
        relationships: [],
      };

      const existingNodes = [
        { id: 'node-1', name: 'John', metadata: null },
        { id: 'node-2', name: 'Microsoft', metadata: null },
      ];

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);
      mockPrisma.node.findMany.mockResolvedValue(existingNodes);
      mockPrisma.edge.findMany.mockResolvedValue([]);

      mockDuplicateService.detectDuplicateNodes.mockReturnValue([
        { newNodeIndex: 0, existingNodeId: 'node-1', conflicts: [] },
        { newNodeIndex: 1, existingNodeId: 'node-2', conflicts: [] },
      ]);

      mockDuplicateService.detectRedundantEdges.mockReturnValue([]);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.stats.duplicateNodes).toBe(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should return 400 for missing document text', async () => {
      // Arrange
      const requestBody = {
        visualizationType: '2d' as const,
      };

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Document text is required');
    });

    it('should return 400 for empty document text', async () => {
      // Arrange
      const requestBody = {
        documentText: '   ',
        visualizationType: '2d' as const,
      };

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Document text is required');
    });

    it('should return 400 for invalid visualization type', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test',
        visualizationType: 'invalid' as any,
      };

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Visualization type');
    });

    it('should handle AI API errors gracefully', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        visualizationType: '2d' as const,
      };

      mockAIService.analyzeDocument.mockRejectedValue(
        new Error('AI API returned 500: Internal Server Error')
      );

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error).not.toContain('sk-'); // Should not expose API key
    });

    it('should handle AI timeout errors', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        visualizationType: '2d' as const,
      };

      mockAIService.analyzeDocument.mockRejectedValue(
        new Error('AI analysis request timed out. Please try again.')
      );

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      // The error message should be preserved since it contains "timeout"
      expect(data.error).toContain('timed out');
    });

    it('should handle database errors during duplicate detection', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        graphId: 'graph-1',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [{ name: 'Entity1', type: 'concept', properties: {} }],
        relationships: [],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);
      mockPrisma.node.findMany.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to check for duplicates');
      expect(data.error).not.toContain('Database connection'); // Should not expose internal error
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        visualizationType: '2d' as const,
      };

      // Mock an unexpected error in JSON parsing
      const request = {
        json: async () => {
          throw new Error('Unexpected JSON parsing error');
        },
      };

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred. Please try again.');
    });

    it('should not expose sensitive information in error messages', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        visualizationType: '2d' as const,
      };

      mockAIService.analyzeDocument.mockRejectedValue(
        new Error('Connection failed to https://api.openai.com with key sk-abc123')
      );

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.error).not.toContain('sk-');
      expect(data.error).not.toContain('api.openai.com');
      expect(data.error).toBe('Unable to analyze document. Please try again later.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle AI result with no entities', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Some text with no extractable entities.',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [],
        relationships: [],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nodes).toHaveLength(0);
      expect(data.data.edges).toHaveLength(0);
      expect(data.data.stats.totalNodes).toBe(0);
    });

    it('should handle AI result with entities but no relationships', async () => {
      // Arrange
      const requestBody = {
        documentText: 'John. Microsoft. Seattle.',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [
          { name: 'John', type: 'person', properties: {} },
          { name: 'Microsoft', type: 'organization', properties: {} },
        ],
        relationships: [],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nodes).toHaveLength(2);
      expect(data.data.edges).toHaveLength(0);
    });

    it('should handle graph with no existing nodes', async () => {
      // Arrange
      const requestBody = {
        documentText: 'Test document',
        graphId: 'empty-graph',
        visualizationType: '2d' as const,
      };

      const mockAIResult = {
        entities: [{ name: 'Entity1', type: 'concept', properties: {} }],
        relationships: [],
      };

      mockAIService.analyzeDocument.mockResolvedValue(mockAIResult);
      mockPrisma.node.findMany.mockResolvedValue([]);
      mockPrisma.edge.findMany.mockResolvedValue([]);
      mockDuplicateService.detectDuplicateNodes.mockReturnValue([]);
      mockDuplicateService.detectRedundantEdges.mockReturnValue([]);

      // Act
      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.duplicateNodes).toBe(0);
      expect(data.data.stats.redundantEdges).toBe(0);
    });
  });
});
