/**
 * Unit tests for Merge Resolution Service
 * 
 * Tests specific examples and edge cases for node merging, property resolution,
 * edge processing, and node ID mapping.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import {
  MergeResolutionServiceImpl,
  MergeDecision,
  NodeToCreate,
  EdgeData,
} from '../merge-resolution';

describe('MergeResolutionService', () => {
  let service: MergeResolutionServiceImpl;

  beforeEach(() => {
    service = new MergeResolutionServiceImpl();
  });

  describe('mergeNodes - basic functionality', () => {
    it('should merge a node with merge action', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test Node',
          type: 'entity',
          properties: { age: 30, city: 'New York' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test Node', metadata: '{"age": 25}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            age: 'use-new',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Should not create the node
      expect(result.nodesToCreate).toHaveLength(0);

      // Should update the existing node
      expect(result.nodesToUpdate).toHaveLength(1);
      expect(result.nodesToUpdate[0].id).toBe('existing-1');

      // Should have node ID mapping
      expect(result.nodeIdMapping.get('temp-1')).toBe('existing-1');

      // Check merged properties
      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.age).toBe(30); // use-new
      expect(metadata.city).toBe('New York'); // new property added
    });

    it('should keep both nodes with keep-both action', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test Node',
          type: 'entity',
          properties: { value: 'new' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test Node', metadata: '{"value": "old"}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'keep-both',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Should create the new node
      expect(result.nodesToCreate).toHaveLength(1);
      expect(result.nodesToCreate[0].tempId).toBe('temp-1');

      // Should not update existing node
      expect(result.nodesToUpdate).toHaveLength(0);

      // No mapping needed for keep-both
      expect(result.nodeIdMapping.has('temp-1')).toBe(false);
    });

    it('should skip node with skip action', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test Node',
          type: 'entity',
          properties: {},
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test Node', metadata: null }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'skip',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Should not create the node
      expect(result.nodesToCreate).toHaveLength(0);

      // Should not update existing node
      expect(result.nodesToUpdate).toHaveLength(0);

      // Should map to existing node for edge references
      expect(result.nodeIdMapping.get('temp-1')).toBe('existing-1');
    });

    it('should create nodes without merge decisions', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Node 1',
          type: 'entity',
          properties: {},
          tempId: 'temp-1',
        },
        {
          name: 'Node 2',
          type: 'entity',
          properties: {},
          tempId: 'temp-2',
        },
      ];

      const existingNodes = new Map();
      const decisions: MergeDecision[] = [];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Should create all nodes
      expect(result.nodesToCreate).toHaveLength(2);
      expect(result.nodesToUpdate).toHaveLength(0);
      expect(result.nodeIdMapping.size).toBe(0);
    });
  });

  describe('property resolution strategies', () => {
    it('should keep existing property value with keep-existing', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { status: 'new-value' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"status": "old-value"}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            status: 'keep-existing',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.status).toBe('old-value');
    });

    it('should use new property value with use-new', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { status: 'new-value' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"status": "old-value"}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            status: 'use-new',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.status).toBe('new-value');
    });

    it('should combine string properties with combine', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { description: 'New description' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        [
          'existing-1',
          { name: 'Test', metadata: '{"description": "Old description"}' },
        ],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            description: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.description).toBe('Old description; New description');
    });

    it('should combine array properties with combine', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { tags: ['tag3', 'tag4'] },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"tags": ["tag1", "tag2"]}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            tags: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4']);
    });

    it('should combine number properties by summing with combine', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { count: 5 },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"count": 10}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            count: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.count).toBe(15);
    });

    it('should add new properties not in existing node', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { newProp: 'value', existingProp: 'new' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"existingProp": "old"}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {},
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.newProp).toBe('value'); // New property added
      expect(metadata.existingProp).toBe('old'); // Existing kept (no resolution)
    });

    it('should handle null metadata in existing node', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { prop: 'value' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: null }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {},
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.prop).toBe('value');
    });
  });

  describe('edge processing with node ID mapping', () => {
    it('should update edge node references using mapping', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: 'temp-1',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: {},
        },
      ];

      const nodeIdMapping = new Map([
        ['temp-1', 'existing-1'],
        ['temp-2', 'existing-2'],
      ]);

      const result = service.processEdges(edges, nodeIdMapping, []);

      expect(result).toHaveLength(1);
      expect(result[0].fromNodeId).toBe('existing-1');
      expect(result[0].toNodeId).toBe('existing-2');
      expect(result[0].label).toBe('relates_to');
    });

    it('should keep unmapped node IDs unchanged', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: 'temp-1',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: {},
        },
      ];

      const nodeIdMapping = new Map([['temp-1', 'existing-1']]);

      const result = service.processEdges(edges, nodeIdMapping, []);

      expect(result).toHaveLength(1);
      expect(result[0].fromNodeId).toBe('existing-1');
      expect(result[0].toNodeId).toBe('temp-2'); // Unchanged
    });

    it('should filter out redundant edges', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: 'temp-1',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: {},
        },
        {
          id: 'edge-2',
          fromNodeId: 'temp-2',
          toNodeId: 'temp-3',
          label: 'connects_to',
          properties: {},
        },
        {
          id: 'edge-3',
          fromNodeId: 'temp-3',
          toNodeId: 'temp-1',
          label: 'links_to',
          properties: {},
        },
      ];

      const nodeIdMapping = new Map();
      const redundantIndices = [0, 2]; // Filter out edge-1 and edge-3

      const result = service.processEdges(edges, nodeIdMapping, redundantIndices);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('connects_to');
    });

    it('should preserve edge properties during processing', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: 'temp-1',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: { weight: 0.8, type: 'strong' },
        },
      ];

      const nodeIdMapping = new Map([['temp-1', 'existing-1']]);

      const result = service.processEdges(edges, nodeIdMapping, []);

      expect(result[0].properties).toEqual({ weight: 0.8, type: 'strong' });
    });

    it('should handle empty edges array', () => {
      const result = service.processEdges([], new Map(), []);
      expect(result).toHaveLength(0);
    });

    it('should handle empty node ID mapping', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: 'temp-1',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: {},
        },
      ];

      const result = service.processEdges(edges, new Map(), []);

      expect(result).toHaveLength(1);
      expect(result[0].fromNodeId).toBe('temp-1');
      expect(result[0].toNodeId).toBe('temp-2');
    });

    it('should handle edges with invalid node references gracefully', () => {
      const edges: EdgeData[] = [
        {
          id: 'edge-1',
          fromNodeId: '',
          toNodeId: 'temp-2',
          label: 'relates_to',
          properties: {},
        },
        {
          id: 'edge-2',
          fromNodeId: 'temp-1',
          toNodeId: '',
          label: 'relates_to',
          properties: {},
        },
      ];

      const nodeIdMapping = new Map();

      const result = service.processEdges(edges, nodeIdMapping, []);

      // Edges with empty node IDs should be filtered out
      expect(result).toHaveLength(0);
    });
  });

  describe('complex merge scenarios', () => {
    it('should handle multiple merge decisions', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Node 1',
          type: 'entity',
          properties: { value: 'new1' },
          tempId: 'temp-1',
        },
        {
          name: 'Node 2',
          type: 'entity',
          properties: { value: 'new2' },
          tempId: 'temp-2',
        },
        {
          name: 'Node 3',
          type: 'entity',
          properties: { value: 'new3' },
          tempId: 'temp-3',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Node 1', metadata: '{"value": "old1"}' }],
        ['existing-2', { name: 'Node 2', metadata: '{"value": "old2"}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: { value: 'use-new' },
        },
        {
          action: 'skip',
          newNodeIndex: 1,
          existingNodeId: 'existing-2',
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Node 1: merged (updated)
      expect(result.nodesToUpdate).toHaveLength(1);
      expect(result.nodesToUpdate[0].id).toBe('existing-1');

      // Node 2: skipped (not created)
      // Node 3: no decision (created)
      expect(result.nodesToCreate).toHaveLength(1);
      expect(result.nodesToCreate[0].tempId).toBe('temp-3');

      // Mappings
      expect(result.nodeIdMapping.get('temp-1')).toBe('existing-1');
      expect(result.nodeIdMapping.get('temp-2')).toBe('existing-2');
    });

    it('should handle merge with multiple property resolutions', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: {
            prop1: 'new1',
            prop2: 'new2',
            prop3: 'new3',
            prop4: 'new4',
          },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        [
          'existing-1',
          {
            name: 'Test',
            metadata: '{"prop1": "old1", "prop2": "old2", "prop3": "old3"}',
          },
        ],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            prop1: 'keep-existing',
            prop2: 'use-new',
            prop3: 'combine',
            // prop4 has no resolution - should be added as new
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.prop1).toBe('old1'); // keep-existing
      expect(metadata.prop2).toBe('new2'); // use-new
      expect(metadata.prop3).toBe('old3; new3'); // combine
      expect(metadata.prop4).toBe('new4'); // added as new
    });

    it('should handle invalid node index in decision gracefully', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Node 1',
          type: 'entity',
          properties: {},
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Node 1', metadata: null }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 999, // Invalid index
          existingNodeId: 'existing-1',
          propertyResolutions: {},
        },
      ];

      // Should not throw error
      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Node should still be created since decision was invalid
      expect(result.nodesToCreate).toHaveLength(1);
      expect(result.nodesToUpdate).toHaveLength(0);
    });

    it('should handle non-existent existing node ID gracefully', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Node 1',
          type: 'entity',
          properties: {},
          tempId: 'temp-1',
        },
        {
          name: 'Node 2',
          type: 'entity',
          properties: {},
          tempId: 'temp-2',
        },
      ];

      const existingNodes = new Map();

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'non-existent', // Doesn't exist
          propertyResolutions: {},
        },
      ];

      // Should not throw error
      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Node 1 decision is skipped due to non-existent existing node
      // Node 2 has no decision, so it should be created
      expect(result.nodesToCreate).toHaveLength(1);
      expect(result.nodesToCreate[0].tempId).toBe('temp-2');
      expect(result.nodesToUpdate).toHaveLength(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle combine with duplicate string values', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { description: 'Same description' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        [
          'existing-1',
          { name: 'Test', metadata: '{"description": "Same description"}' },
        ],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            description: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      // Should not duplicate - just keep one
      expect(metadata.description).toBe('Same description');
    });

    it('should handle combine with null values', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { prop: 'value' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: '{"prop": null}' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            prop: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.prop).toBe('value'); // New value used when existing is null
    });

    it('should handle combine with object properties', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { config: { newKey: 'newValue' } },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        [
          'existing-1',
          { name: 'Test', metadata: '{"config": {"oldKey": "oldValue"}}' },
        ],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {
            config: 'combine',
          },
        },
      ];

      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.config).toEqual({
        oldKey: 'oldValue',
        newKey: 'newValue',
      });
    });

    it('should handle invalid JSON in existing metadata', () => {
      const newNodes: NodeToCreate[] = [
        {
          name: 'Test',
          type: 'entity',
          properties: { prop: 'value' },
          tempId: 'temp-1',
        },
      ];

      const existingNodes = new Map([
        ['existing-1', { name: 'Test', metadata: 'invalid json' }],
      ]);

      const decisions: MergeDecision[] = [
        {
          action: 'merge',
          newNodeIndex: 0,
          existingNodeId: 'existing-1',
          propertyResolutions: {},
        },
      ];

      // Should not throw error
      const result = service.mergeNodes(decisions, newNodes, existingNodes);

      // Should treat as empty metadata and add new properties
      const metadata = JSON.parse(result.nodesToUpdate[0].updates.metadata);
      expect(metadata.prop).toBe('value');
    });
  });
});
