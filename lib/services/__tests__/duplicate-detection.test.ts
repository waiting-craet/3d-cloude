/**
 * Unit tests for Duplicate Detection Service
 * 
 * Tests specific examples and edge cases for duplicate node detection,
 * property conflict detection, and redundant edge detection.
 */

import {
  DuplicateDetectionServiceImpl,
  NewNodeData,
  ExistingNodeData,
  NewEdgeData,
  ExistingEdgeData,
} from '../duplicate-detection';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionServiceImpl;

  beforeEach(() => {
    service = new DuplicateDetectionServiceImpl();
  });

  describe('detectDuplicateNodes', () => {
    it('should detect duplicate with exact case-insensitive name match', () => {
      const newNodes: NewNodeData[] = [
        { name: 'John Doe', properties: { age: 30 } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'john doe', metadata: '{"age": 25}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].newNodeIndex).toBe(0);
      expect(duplicates[0].existingNodeId).toBe('node-1');
    });

    it('should detect duplicate with different casing', () => {
      const newNodes: NewNodeData[] = [
        { name: 'ACME Corporation', properties: {} },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'acme corporation', metadata: null },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].existingNodeId).toBe('node-1');
    });

    it('should handle names with leading/trailing whitespace', () => {
      const newNodes: NewNodeData[] = [
        { name: '  Test Entity  ', properties: {} },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'Test Entity', metadata: null },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].existingNodeId).toBe('node-1');
    });

    it('should not flag non-matching names as duplicates', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Entity A', properties: {} },
        { name: 'Entity B', properties: {} },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'Entity C', metadata: null },
        { id: 'node-2', name: 'Entity D', metadata: null },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(0);
    });

    it('should detect multiple duplicates', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Entity A', properties: {} },
        { name: 'Entity B', properties: {} },
        { name: 'Entity C', properties: {} },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'entity a', metadata: null },
        { id: 'node-2', name: 'entity c', metadata: null },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(2);
      expect(duplicates[0].newNodeIndex).toBe(0);
      expect(duplicates[0].existingNodeId).toBe('node-1');
      expect(duplicates[1].newNodeIndex).toBe(2);
      expect(duplicates[1].existingNodeId).toBe('node-2');
    });

    it('should handle empty arrays', () => {
      const duplicates1 = service.detectDuplicateNodes([], []);
      expect(duplicates1).toHaveLength(0);

      const duplicates2 = service.detectDuplicateNodes(
        [{ name: 'Test', properties: {} }],
        []
      );
      expect(duplicates2).toHaveLength(0);

      const duplicates3 = service.detectDuplicateNodes(
        [],
        [{ id: 'node-1', name: 'Test', metadata: null }]
      );
      expect(duplicates3).toHaveLength(0);
    });
  });

  describe('property conflict detection', () => {
    it('should detect conflicts when property values differ', () => {
      const newNodes: NewNodeData[] = [
        { name: 'John Doe', properties: { age: 30, city: 'New York' } },
      ];

      const existingNodes: ExistingNodeData[] = [
        {
          id: 'node-1',
          name: 'john doe',
          metadata: '{"age": 25, "city": "Boston"}',
        },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(2);
      
      const ageConflict = duplicates[0].conflicts.find(c => c.property === 'age');
      expect(ageConflict).toBeDefined();
      expect(ageConflict?.existingValue).toBe(25);
      expect(ageConflict?.newValue).toBe(30);

      const cityConflict = duplicates[0].conflicts.find(c => c.property === 'city');
      expect(cityConflict).toBeDefined();
      expect(cityConflict?.existingValue).toBe('Boston');
      expect(cityConflict?.newValue).toBe('New York');
    });

    it('should not flag conflicts when values match', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { type: 'person', status: 'active' } },
      ];

      const existingNodes: ExistingNodeData[] = [
        {
          id: 'node-1',
          name: 'test',
          metadata: '{"type": "person", "status": "active"}',
        },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should handle case-insensitive string comparison in properties', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { status: 'ACTIVE' } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: '{"status": "active"}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should not flag conflicts for properties only in new node', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { age: 30, newProp: 'value' } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: '{"age": 30}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should handle null and undefined values', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { prop1: null, prop2: undefined } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: '{"prop1": null, "prop2": null}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should handle array properties', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { tags: ['a', 'b', 'c'] } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: '{"tags": ["a", "b", "c"]}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should detect conflicts in array properties', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { tags: ['a', 'b'] } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: '{"tags": ["a", "c"]}' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(1);
      expect(duplicates[0].conflicts[0].property).toBe('tags');
    });

    it('should handle nested object properties', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { address: { city: 'NYC', zip: '10001' } } },
      ];

      const existingNodes: ExistingNodeData[] = [
        {
          id: 'node-1',
          name: 'test',
          metadata: '{"address": {"city": "NYC", "zip": "10001"}}',
        },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should handle invalid metadata JSON gracefully', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { age: 30 } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: 'invalid json' },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });

    it('should handle null metadata', () => {
      const newNodes: NewNodeData[] = [
        { name: 'Test', properties: { age: 30 } },
      ];

      const existingNodes: ExistingNodeData[] = [
        { id: 'node-1', name: 'test', metadata: null },
      ];

      const duplicates = service.detectDuplicateNodes(newNodes, existingNodes);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].conflicts).toHaveLength(0);
    });
  });

  describe('detectRedundantEdges', () => {
    it('should detect redundant edge with exact match', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'relates_to' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(1);
      expect(redundant[0]).toBe(0);
    });

    it('should detect redundant edge with case-insensitive label match', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'RELATES_TO' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(1);
      expect(redundant[0]).toBe(0);
    });

    it('should not flag edges with different source nodes as redundant', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'relates_to' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-3', toNodeId: 'node-2', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(0);
    });

    it('should not flag edges with different target nodes as redundant', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'relates_to' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-3', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(0);
    });

    it('should not flag edges with different relationship types as redundant', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'relates_to' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'works_for' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(0);
    });

    it('should detect multiple redundant edges', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: 'relates_to' },
        { from: 'Entity B', to: 'Entity C', type: 'works_for' },
        { from: 'Entity A', to: 'Entity C', type: 'knows' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' },
        { fromNodeId: 'node-1', toNodeId: 'node-3', label: 'knows' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
        ['entity c', 'node-3'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(2);
      expect(redundant).toContain(0); // First edge is redundant
      expect(redundant).toContain(2); // Third edge is redundant
    });

    it('should skip edges with unmapped nodes', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Unknown Entity', type: 'relates_to' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        // 'unknown entity' is not in the mapping
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      const nodeMapping = new Map([['entity a', 'node-1']]);

      const redundant1 = service.detectRedundantEdges([], [], nodeMapping);
      expect(redundant1).toHaveLength(0);

      const redundant2 = service.detectRedundantEdges(
        [{ from: 'Entity A', to: 'Entity B', type: 'relates_to' }],
        [],
        nodeMapping
      );
      expect(redundant2).toHaveLength(0);

      const redundant3 = service.detectRedundantEdges(
        [],
        [{ fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' }],
        nodeMapping
      );
      expect(redundant3).toHaveLength(0);
    });

    it('should handle edge labels with whitespace', () => {
      const newEdges: NewEdgeData[] = [
        { from: 'Entity A', to: 'Entity B', type: '  relates_to  ' },
      ];

      const existingEdges: ExistingEdgeData[] = [
        { fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' },
      ];

      const nodeMapping = new Map([
        ['entity a', 'node-1'],
        ['entity b', 'node-2'],
      ]);

      const redundant = service.detectRedundantEdges(
        newEdges,
        existingEdges,
        nodeMapping
      );

      expect(redundant).toHaveLength(1);
      expect(redundant[0]).toBe(0);
    });
  });
});
