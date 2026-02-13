/**
 * Property-Based Tests for Merge Resolution Service
 * 
 * Feature: ai-document-analysis
 * Property 5: Node Merge Referential Integrity
 * Validates: Requirements 8.4
 * 
 * For any merge operation where a duplicate node is merged with an existing node,
 * all edges that reference the duplicate node's temporary ID should be updated to
 * reference the existing node's database ID, and no edges should reference
 * non-existent node IDs after the merge.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import {
  MergeResolutionServiceImpl,
  MergeDecision,
  NodeToCreate,
  EdgeData,
} from '../merge-resolution'

describe('Merge Resolution Service - Property 5: Node Merge Referential Integrity', () => {
  it('should update all edge references when nodes are merged', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: For any merge operation, all edges that reference a merged node's
     * temporary ID should be updated to reference the existing node's database ID.
     */
    
    fc.assert(
      fc.property(
        // Generate new nodes with temporary IDs
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constantFrom('entity', 'concept', 'person', 'organization'),
            properties: fc.dictionary(fc.string(), fc.anything(), { maxKeys: 5 }),
            tempId: fc.uuid(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate existing node IDs
        fc.array(
          fc.uuid(),
          { minLength: 1, maxLength: 10 }
        ),
        (newNodes: NodeToCreate[], existingNodeIds: string[]) => {
          // Ensure unique temp IDs
          const uniqueTempIds = new Set(newNodes.map(n => n.tempId))
          if (uniqueTempIds.size !== newNodes.length) {
            return // Skip if duplicate temp IDs
          }

          const service = new MergeResolutionServiceImpl()
          
          // Create merge decisions - merge some nodes
          const decisions: MergeDecision[] = []
          const mergedTempIds = new Map<string, string>() // temp ID -> existing ID
          
          for (let i = 0; i < Math.min(newNodes.length, existingNodeIds.length); i++) {
            if (i % 2 === 0) { // Merge every other node
              decisions.push({
                action: 'merge',
                newNodeIndex: i,
                existingNodeId: existingNodeIds[i],
                propertyResolutions: {},
              })
              mergedTempIds.set(newNodes[i].tempId, existingNodeIds[i])
            }
          }
          
          // Create existing nodes map
          const existingNodes = new Map<string, { name: string; metadata: string | null }>()
          for (let i = 0; i < existingNodeIds.length; i++) {
            existingNodes.set(existingNodeIds[i], {
              name: `Existing Node ${i}`,
              metadata: JSON.stringify({}),
            })
          }
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Verify that all merged temp IDs are in the mapping
          for (const [tempId, existingId] of mergedTempIds.entries()) {
            expect(result.nodeIdMapping.get(tempId)).toBe(existingId)
          }
          
          // Create edges that reference the temp IDs
          const edges: EdgeData[] = []
          for (let i = 0; i < newNodes.length - 1; i++) {
            edges.push({
              id: `edge-${i}`,
              fromNodeId: newNodes[i].tempId,
              toNodeId: newNodes[i + 1].tempId,
              label: 'relates_to',
              properties: {},
            })
          }
          
          // Process edges with the node ID mapping
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          
          // Verify all edge references are updated correctly
          for (let i = 0; i < processedEdges.length; i++) {
            const originalEdge = edges[i]
            const processedEdge = processedEdges[i]
            
            // Check fromNodeId
            const expectedFromId = result.nodeIdMapping.get(originalEdge.fromNodeId) || originalEdge.fromNodeId
            expect(processedEdge.fromNodeId).toBe(expectedFromId)
            
            // Check toNodeId
            const expectedToId = result.nodeIdMapping.get(originalEdge.toNodeId) || originalEdge.toNodeId
            expect(processedEdge.toNodeId).toBe(expectedToId)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not leave any edges with non-existent node references after merge', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: After a merge operation, no edges should reference node IDs that
     * don't exist (either as temp IDs or database IDs).
     */
    
    fc.assert(
      fc.property(
        // Generate new nodes
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constantFrom('entity', 'concept', 'person'),
            properties: fc.dictionary(fc.string(), fc.string(), { maxKeys: 3 }),
            tempId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        // Generate existing node IDs
        fc.array(
          fc.uuid(),
          { minLength: 1, maxLength: 8 }
        ),
        (newNodes: NodeToCreate[], existingNodeIds: string[]) => {
          // Ensure unique temp IDs
          const uniqueTempIds = new Set(newNodes.map(n => n.tempId))
          if (uniqueTempIds.size !== newNodes.length) {
            return // Skip if duplicate temp IDs
          }

          const service = new MergeResolutionServiceImpl()
          
          // Create merge decisions
          const decisions: MergeDecision[] = []
          for (let i = 0; i < Math.min(newNodes.length, existingNodeIds.length); i++) {
            decisions.push({
              action: 'merge',
              newNodeIndex: i,
              existingNodeId: existingNodeIds[i],
              propertyResolutions: {},
            })
          }
          
          // Create existing nodes map
          const existingNodes = new Map<string, { name: string; metadata: string | null }>()
          for (const id of existingNodeIds) {
            existingNodes.set(id, {
              name: `Node ${id}`,
              metadata: null,
            })
          }
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Create edges between nodes
          const edges: EdgeData[] = []
          for (let i = 0; i < newNodes.length - 1; i++) {
            edges.push({
              id: `edge-${i}`,
              fromNodeId: newNodes[i].tempId,
              toNodeId: newNodes[i + 1].tempId,
              label: 'connects_to',
              properties: {},
            })
          }
          
          // Process edges
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          
          // Build set of all valid node IDs after merge
          const validNodeIds = new Set<string>()
          
          // Add existing node IDs
          for (const id of existingNodeIds) {
            validNodeIds.add(id)
          }
          
          // Add temp IDs of nodes that weren't merged (will be created)
          for (let i = 0; i < newNodes.length; i++) {
            const wasMerged = decisions.some(d => d.newNodeIndex === i && d.action === 'merge')
            if (!wasMerged) {
              validNodeIds.add(newNodes[i].tempId)
            }
          }
          
          // Verify all edge references are valid
          for (const edge of processedEdges) {
            // Note: For nodes that will be created, they still have temp IDs
            // The actual database IDs will be assigned during creation
            // So we check that the ID is either:
            // 1. An existing node ID (from merge)
            // 2. A temp ID of a node that will be created
            const fromIdValid = validNodeIds.has(edge.fromNodeId) || 
                               result.nodeIdMapping.has(edge.fromNodeId)
            const toIdValid = validNodeIds.has(edge.toNodeId) || 
                             result.nodeIdMapping.has(edge.toNodeId)
            
            expect(fromIdValid).toBe(true)
            expect(toIdValid).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve edge properties and labels during reference updates', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: When updating edge node references during merge, all other edge
     * properties (label, custom properties) should be preserved unchanged.
     */
    
    fc.assert(
      fc.property(
        // Generate nodes
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constant('entity'),
            properties: fc.constant({}),
            tempId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        // Generate edges with properties
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 20 }),
            properties: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              { minKeys: 0, maxKeys: 5 }
            ),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (newNodes: NodeToCreate[], edgeData) => {
          // Ensure unique temp IDs
          const uniqueTempIds = new Set(newNodes.map(n => n.tempId))
          if (uniqueTempIds.size !== newNodes.length || newNodes.length < 2) {
            return // Skip if duplicate temp IDs or not enough nodes
          }

          const service = new MergeResolutionServiceImpl()
          
          // Create merge decisions - merge first node
          const existingNodeId = 'existing-node-1'
          const decisions: MergeDecision[] = [{
            action: 'merge',
            newNodeIndex: 0,
            existingNodeId,
            propertyResolutions: {},
          }]
          
          const existingNodes = new Map([
            [existingNodeId, { name: 'Existing Node', metadata: null }]
          ])
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Create edges with the generated properties
          const edges: EdgeData[] = edgeData.map((data, i) => ({
            id: `edge-${i}`,
            fromNodeId: newNodes[0].tempId, // References merged node
            toNodeId: newNodes[1].tempId,
            label: data.label,
            properties: data.properties,
          }))
          
          // Process edges
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          
          // Verify properties and labels are preserved
          expect(processedEdges.length).toBe(edges.length)
          
          for (let i = 0; i < processedEdges.length; i++) {
            const original = edges[i]
            const processed = processedEdges[i]
            
            // Label should be unchanged
            expect(processed.label).toBe(original.label)
            
            // Properties should be unchanged
            expect(processed.properties).toEqual(original.properties)
            
            // Only node references should change
            expect(processed.fromNodeId).toBe(existingNodeId) // Updated to existing ID
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle multiple edges referencing the same merged node', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: When multiple edges reference the same merged node, all of them
     * should have their references updated to the existing node ID.
     */
    
    fc.assert(
      fc.property(
        // Generate number of edges
        fc.integer({ min: 2, max: 10 }),
        (numEdges: number) => {
          const service = new MergeResolutionServiceImpl()
          
          // Create nodes
          const mergedNodeTempId = 'temp-merged-node'
          const existingNodeId = 'existing-node-1'
          const otherNodeTempId = 'temp-other-node'
          
          const newNodes: NodeToCreate[] = [
            {
              name: 'Merged Node',
              type: 'entity',
              properties: {},
              tempId: mergedNodeTempId,
            },
            {
              name: 'Other Node',
              type: 'entity',
              properties: {},
              tempId: otherNodeTempId,
            },
          ]
          
          // Create merge decision
          const decisions: MergeDecision[] = [{
            action: 'merge',
            newNodeIndex: 0,
            existingNodeId,
            propertyResolutions: {},
          }]
          
          const existingNodes = new Map([
            [existingNodeId, { name: 'Existing Node', metadata: null }]
          ])
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Create multiple edges that reference the merged node
          const edges: EdgeData[] = []
          for (let i = 0; i < numEdges; i++) {
            // Alternate between fromNode and toNode references
            if (i % 2 === 0) {
              edges.push({
                id: `edge-${i}`,
                fromNodeId: mergedNodeTempId, // References merged node
                toNodeId: otherNodeTempId,
                label: `relation-${i}`,
                properties: {},
              })
            } else {
              edges.push({
                id: `edge-${i}`,
                fromNodeId: otherNodeTempId,
                toNodeId: mergedNodeTempId, // References merged node
                label: `relation-${i}`,
                properties: {},
              })
            }
          }
          
          // Process edges
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          
          // Verify all edges have updated references
          expect(processedEdges.length).toBe(numEdges)
          
          for (let i = 0; i < processedEdges.length; i++) {
            const processed = processedEdges[i]
            
            if (i % 2 === 0) {
              // fromNode should be updated to existing ID
              expect(processed.fromNodeId).toBe(existingNodeId)
              expect(processed.toNodeId).toBe(otherNodeTempId)
            } else {
              // toNode should be updated to existing ID
              expect(processed.fromNodeId).toBe(otherNodeTempId)
              expect(processed.toNodeId).toBe(existingNodeId)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly filter redundant edges while updating references', () => {
    /**
     * **Validates: Requirements 8.4, 8.5**
     * 
     * Property: When processing edges, redundant edges should be filtered out
     * AND remaining edges should have their node references updated correctly.
     */
    
    fc.assert(
      fc.property(
        // Generate redundant indices
        fc.array(
          fc.integer({ min: 0, max: 9 }),
          { minLength: 0, maxLength: 5 }
        ),
        (redundantIndices: number[]) => {
          const service = new MergeResolutionServiceImpl()
          
          // Create nodes
          const tempId1 = 'temp-1'
          const tempId2 = 'temp-2'
          const existingId1 = 'existing-1'
          
          const newNodes: NodeToCreate[] = [
            { name: 'Node 1', type: 'entity', properties: {}, tempId: tempId1 },
            { name: 'Node 2', type: 'entity', properties: {}, tempId: tempId2 },
          ]
          
          // Merge first node
          const decisions: MergeDecision[] = [{
            action: 'merge',
            newNodeIndex: 0,
            existingNodeId: existingId1,
            propertyResolutions: {},
          }]
          
          const existingNodes = new Map([
            [existingId1, { name: 'Existing 1', metadata: null }]
          ])
          
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Create 10 edges
          const edges: EdgeData[] = []
          for (let i = 0; i < 10; i++) {
            edges.push({
              id: `edge-${i}`,
              fromNodeId: tempId1,
              toNodeId: tempId2,
              label: `relation-${i}`,
              properties: { index: i },
            })
          }
          
          // Process edges with redundant indices
          const uniqueRedundantIndices = Array.from(new Set(redundantIndices))
            .filter(i => i >= 0 && i < edges.length)
          
          const processedEdges = service.processEdges(
            edges,
            result.nodeIdMapping,
            uniqueRedundantIndices
          )
          
          // Verify correct number of edges remain
          const expectedCount = edges.length - uniqueRedundantIndices.length
          expect(processedEdges.length).toBe(expectedCount)
          
          // Verify all remaining edges have updated references
          for (const edge of processedEdges) {
            expect(edge.fromNodeId).toBe(existingId1) // Updated from tempId1
            expect(edge.toNodeId).toBe(tempId2) // Unchanged
          }
          
          // Verify redundant edges are not in the result
          const processedIndices = new Set(
            processedEdges.map(e => parseInt(e.properties.index))
          )
          
          for (const redundantIndex of uniqueRedundantIndices) {
            expect(processedIndices.has(redundantIndex)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle skip action correctly in node ID mapping', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: When a merge decision has action 'skip', the temp ID should be
     * mapped to the existing node ID (so edges can reference it), but the node
     * should not be created or updated.
     */
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constant('entity'),
            properties: fc.constant({}),
            tempId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (newNodes: NodeToCreate[]) => {
          // Ensure unique temp IDs
          const uniqueTempIds = new Set(newNodes.map(n => n.tempId))
          if (uniqueTempIds.size !== newNodes.length) {
            return // Skip if duplicate temp IDs
          }

          const service = new MergeResolutionServiceImpl()
          
          // Create skip decision for first node
          const existingNodeId = 'existing-node-1'
          const decisions: MergeDecision[] = [{
            action: 'skip',
            newNodeIndex: 0,
            existingNodeId,
            propertyResolutions: {},
          }]
          
          const existingNodes = new Map([
            [existingNodeId, { name: 'Existing Node', metadata: null }]
          ])
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Verify skip action results
          // 1. Node should not be in nodesToCreate
          const createdTempIds = new Set(result.nodesToCreate.map(n => n.tempId))
          expect(createdTempIds.has(newNodes[0].tempId)).toBe(false)
          
          // 2. Node should not be in nodesToUpdate
          const updatedIds = new Set(result.nodesToUpdate.map(n => n.id))
          expect(updatedIds.has(existingNodeId)).toBe(false)
          
          // 3. Temp ID should be mapped to existing ID
          expect(result.nodeIdMapping.get(newNodes[0].tempId)).toBe(existingNodeId)
          
          // 4. Edges referencing the skipped node should use existing ID
          const edges: EdgeData[] = [{
            id: 'edge-1',
            fromNodeId: newNodes[0].tempId,
            toNodeId: newNodes[1].tempId,
            label: 'relates_to',
            properties: {},
          }]
          
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          expect(processedEdges[0].fromNodeId).toBe(existingNodeId)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle keep-both action without breaking edge references', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: When a merge decision has action 'keep-both', the new node should
     * be created and edges should reference the new node's temp ID (which will
     * become a database ID after creation).
     */
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constant('entity'),
            properties: fc.dictionary(fc.string(), fc.string(), { maxKeys: 3 }),
            tempId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (newNodes: NodeToCreate[]) => {
          // Ensure unique temp IDs
          const uniqueTempIds = new Set(newNodes.map(n => n.tempId))
          if (uniqueTempIds.size !== newNodes.length) {
            return // Skip if duplicate temp IDs
          }

          const service = new MergeResolutionServiceImpl()
          
          // Create keep-both decision for first node
          const existingNodeId = 'existing-node-1'
          const decisions: MergeDecision[] = [{
            action: 'keep-both',
            newNodeIndex: 0,
            existingNodeId,
            propertyResolutions: {},
          }]
          
          const existingNodes = new Map([
            [existingNodeId, { name: 'Existing Node', metadata: null }]
          ])
          
          // Perform merge
          const result = service.mergeNodes(decisions, newNodes, existingNodes)
          
          // Verify keep-both action results
          // 1. Node should be in nodesToCreate
          const createdTempIds = new Set(result.nodesToCreate.map(n => n.tempId))
          expect(createdTempIds.has(newNodes[0].tempId)).toBe(true)
          
          // 2. Node should not be in nodesToUpdate
          const updatedIds = new Set(result.nodesToUpdate.map(n => n.id))
          expect(updatedIds.has(existingNodeId)).toBe(false)
          
          // 3. Edges referencing the new node should keep temp ID
          const edges: EdgeData[] = [{
            id: 'edge-1',
            fromNodeId: newNodes[0].tempId,
            toNodeId: newNodes[1].tempId,
            label: 'relates_to',
            properties: {},
          }]
          
          const processedEdges = service.processEdges(edges, result.nodeIdMapping, [])
          
          // The temp ID should remain (will be replaced with DB ID after creation)
          // If not in mapping, it stays as-is
          const expectedFromId = result.nodeIdMapping.get(newNodes[0].tempId) || newNodes[0].tempId
          expect(processedEdges[0].fromNodeId).toBe(expectedFromId)
        }
      ),
      { numRuns: 100 }
    )
  })
})
