/**
 * Property-Based Tests for Duplicate Detection Service
 * 
 * Feature: ai-document-analysis
 * Property 2: Duplicate Node Detection Accuracy
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 * 
 * For any set of AI-generated nodes and existing graph nodes, when duplicate detection runs,
 * every node pair with case-insensitive matching names should be flagged as duplicates,
 * and no non-matching pairs should be flagged.
 */

import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'
import {
  DuplicateDetectionServiceImpl,
  NewNodeData,
  ExistingNodeData,
} from '../duplicate-detection'

describe('Duplicate Detection Service - Property 2: Duplicate Node Detection Accuracy', () => {
  it('should flag all case-insensitive name matches as duplicates', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
     * 
     * Property: For any set of new nodes and existing nodes, every pair with
     * case-insensitive matching names (after trimming whitespace) should be
     * flagged as duplicates, and no non-matching pairs should be flagged.
     */
    
    fc.assert(
      fc.property(
        // Generate new nodes with random names and properties
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate existing nodes with random names
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            metadata: fc.option(
              fc.oneof(
                fc.constant(null),
                fc.dictionary(fc.string(), fc.anything()).map(obj => JSON.stringify(obj))
              ),
              { nil: null }
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (newNodes: NewNodeData[], existingNodes: ExistingNodeData[]) => {
          const service = new DuplicateDetectionServiceImpl()
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Create a map of normalized names to existing nodes for verification
          const existingNodesMap = new Map<string, ExistingNodeData>()
          for (const existingNode of existingNodes) {
            const normalizedName = existingNode.name.toLowerCase().trim()
            // Only keep the first occurrence if there are duplicates in existing nodes
            if (!existingNodesMap.has(normalizedName)) {
              existingNodesMap.set(normalizedName, existingNode)
            }
          }
          
          // Verify all flagged duplicates are actual matches
          for (const dup of duplicates) {
            const newNode = newNodes[dup.newNodeIndex]
            const existingNode = existingNodes.find(e => e.id === dup.existingNodeId)
            
            expect(existingNode).toBeDefined()
            
            // Names should match (case-insensitive, trimmed)
            expect(newNode.name.toLowerCase().trim()).toBe(
              existingNode!.name.toLowerCase().trim()
            )
          }
          
          // Verify no false positives: all non-flagged nodes should not have matches
          const flaggedIndices = new Set(duplicates.map(d => d.newNodeIndex))
          
          for (let i = 0; i < newNodes.length; i++) {
            if (!flaggedIndices.has(i)) {
              const newNode = newNodes[i]
              const normalizedNewName = newNode.name.toLowerCase().trim()
              
              // This node should not have a match in existing nodes
              const hasMatch = existingNodesMap.has(normalizedNewName)
              expect(hasMatch).toBe(false)
            }
          }
          
          // Verify no false negatives: all actual matches should be flagged
          for (let i = 0; i < newNodes.length; i++) {
            const newNode = newNodes[i]
            const normalizedNewName = newNode.name.toLowerCase().trim()
            
            if (existingNodesMap.has(normalizedNewName)) {
              // This node should be flagged as a duplicate
              expect(flaggedIndices.has(i)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle whitespace variations in node names', () => {
    /**
     * **Validates: Requirements 5.2, 5.3**
     * 
     * Property: For any node names with leading/trailing whitespace or different
     * internal whitespace, duplicate detection should normalize by trimming and
     * correctly identify matches.
     */
    
    fc.assert(
      fc.property(
        // Generate unique base names (no duplicates)
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10, selector: (s) => s.toLowerCase().trim() }
        ),
        (baseNames: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new nodes with whitespace variations
          const newNodes: NewNodeData[] = baseNames.map(name => ({
            name: `  ${name}  `, // Add leading/trailing whitespace
            properties: {},
          }))
          
          // Create existing nodes with the same names but different whitespace
          const existingNodes: ExistingNodeData[] = baseNames.map((name, i) => ({
            id: `node-${i}`,
            name: name.trim(), // No extra whitespace
            metadata: null,
          }))
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // All nodes should be flagged as duplicates
          expect(duplicates.length).toBe(baseNames.length)
          
          // Verify each duplicate is correctly matched
          for (let i = 0; i < baseNames.length; i++) {
            const duplicate = duplicates.find(d => d.newNodeIndex === i)
            expect(duplicate).toBeDefined()
            expect(duplicate!.existingNodeId).toBe(`node-${i}`)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle case variations in node names', () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * Property: For any node names with different case variations (uppercase,
     * lowercase, mixed case), duplicate detection should perform case-insensitive
     * matching and correctly identify all matches.
     */
    
    fc.assert(
      fc.property(
        // Generate unique base names (no duplicates)
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10, selector: (s) => s.toLowerCase().trim() }
        ),
        (baseNames: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new nodes with uppercase names
          const newNodes: NewNodeData[] = baseNames.map(name => ({
            name: name.toUpperCase(),
            properties: {},
          }))
          
          // Create existing nodes with lowercase names
          const existingNodes: ExistingNodeData[] = baseNames.map((name, i) => ({
            id: `node-${i}`,
            name: name.toLowerCase(),
            metadata: null,
          }))
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // All nodes should be flagged as duplicates despite case differences
          expect(duplicates.length).toBe(baseNames.length)
          
          // Verify each duplicate is correctly matched
          for (let i = 0; i < baseNames.length; i++) {
            const duplicate = duplicates.find(d => d.newNodeIndex === i)
            expect(duplicate).toBeDefined()
            expect(duplicate!.existingNodeId).toBe(`node-${i}`)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not flag nodes with different names as duplicates', () => {
    /**
     * **Validates: Requirements 5.1, 5.4**
     * 
     * Property: For any set of new nodes and existing nodes where no names match
     * (case-insensitive), no duplicates should be flagged.
     */
    
    fc.assert(
      fc.property(
        // Generate new nodes
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            properties: fc.dictionary(fc.string(), fc.anything()),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        // Generate existing nodes with guaranteed different names
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            metadata: fc.option(
              fc.dictionary(fc.string(), fc.anything()).map(obj => JSON.stringify(obj)),
              { nil: null }
            ),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (newNodes: NewNodeData[], existingNodes: ExistingNodeData[]) => {
          // Filter to ensure no name matches (case-insensitive)
          const existingNamesSet = new Set(
            existingNodes.map(e => e.name.toLowerCase().trim())
          )
          
          const filteredNewNodes = newNodes.filter(
            n => !existingNamesSet.has(n.name.toLowerCase().trim())
          )
          
          const service = new DuplicateDetectionServiceImpl()
          const duplicates = service.detectDuplicateNodes(filteredNewNodes, existingNodes)
          
          // No duplicates should be found
          expect(duplicates.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty arrays correctly', () => {
    /**
     * **Validates: Requirements 5.1**
     * 
     * Property: For any combination of empty arrays (empty new nodes, empty existing
     * nodes, or both), duplicate detection should return an empty array without errors.
     */
    
    fc.assert(
      fc.property(
        fc.constantFrom(
          { newNodes: [], existingNodes: [] },
          { 
            newNodes: [{ name: 'Test', properties: {} }],
            existingNodes: []
          },
          {
            newNodes: [],
            existingNodes: [{ id: 'node-1', name: 'Test', metadata: null }]
          }
        ),
        (testCase: {
          newNodes: NewNodeData[],
          existingNodes: ExistingNodeData[]
        }) => {
          const service = new DuplicateDetectionServiceImpl()
          const duplicates = service.detectDuplicateNodes(
            testCase.newNodes,
            testCase.existingNodes
          )
          
          // Should return empty array without errors
          expect(Array.isArray(duplicates)).toBe(true)
          expect(duplicates.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle multiple duplicates of the same node', () => {
    /**
     * **Validates: Requirements 5.1, 5.2**
     * 
     * Property: When multiple new nodes have the same name (case-insensitive) and
     * match an existing node, all of them should be flagged as duplicates of that
     * existing node.
     */
    
    fc.assert(
      fc.property(
        // Generate a base name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate number of duplicates
        fc.integer({ min: 2, max: 5 }),
        (baseName: string, numDuplicates: number) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create multiple new nodes with the same name (with variations)
          const newNodes: NewNodeData[] = []
          for (let i = 0; i < numDuplicates; i++) {
            // Vary the case and whitespace
            let nameVariation = baseName
            if (i % 3 === 0) nameVariation = baseName.toUpperCase()
            else if (i % 3 === 1) nameVariation = baseName.toLowerCase()
            if (i % 2 === 0) nameVariation = `  ${nameVariation}  `
            
            newNodes.push({
              name: nameVariation,
              properties: { index: i },
            })
          }
          
          // Create one existing node
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: baseName,
            metadata: null,
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // All new nodes should be flagged as duplicates
          expect(duplicates.length).toBe(numDuplicates)
          
          // All should reference the same existing node
          for (const dup of duplicates) {
            expect(dup.existingNodeId).toBe('existing-node-1')
          }
          
          // All indices should be present
          const flaggedIndices = new Set(duplicates.map(d => d.newNodeIndex))
          for (let i = 0; i < numDuplicates; i++) {
            expect(flaggedIndices.has(i)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify duplicates in mixed scenarios', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
     * 
     * Property: For any mixed set of nodes (some matching, some not), duplicate
     * detection should correctly identify all and only the matching pairs.
     */
    
    fc.assert(
      fc.property(
        // Generate matching names
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate non-matching names for new nodes
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate non-matching names for existing nodes
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 5 }
        ),
        (matchingNames: string[], newOnlyNames: string[], existingOnlyNames: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Ensure no accidental overlaps - filter out any names that match existing ones
          const matchingSet = new Set(matchingNames.map(n => n.toLowerCase().trim()))
          const filteredNewOnly = newOnlyNames.filter(
            n => !matchingSet.has(n.toLowerCase().trim())
          )
          const filteredExistingOnly = existingOnlyNames.filter(
            n => !matchingSet.has(n.toLowerCase().trim())
          )
          
          // Also ensure no overlap between filteredNewOnly and filteredExistingOnly
          const newOnlySet = new Set(filteredNewOnly.map(n => n.toLowerCase().trim()))
          const finalExistingOnly = filteredExistingOnly.filter(
            n => !newOnlySet.has(n.toLowerCase().trim())
          )
          
          // Create new nodes: matching + new-only
          const newNodes: NewNodeData[] = [
            ...matchingNames.map(name => ({
              name: name.toUpperCase(), // Use uppercase for matching
              properties: { type: 'matching' },
            })),
            ...filteredNewOnly.map(name => ({
              name,
              properties: { type: 'new-only' },
            })),
          ]
          
          // Create existing nodes: matching + existing-only
          const existingNodes: ExistingNodeData[] = [
            ...matchingNames.map((name, i) => ({
              id: `match-${i}`,
              name: name.toLowerCase(), // Use lowercase for matching
              metadata: null,
            })),
            ...finalExistingOnly.map((name, i) => ({
              id: `existing-${i}`,
              name,
              metadata: null,
            })),
          ]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly the matching nodes
          expect(duplicates.length).toBe(matchingNames.length)
          
          // Verify all duplicates are from the matching set
          for (const dup of duplicates) {
            const newNode = newNodes[dup.newNodeIndex]
            expect(newNode.properties.type).toBe('matching')
            expect(dup.existingNodeId).toMatch(/^match-\d+$/)
          }
          
          // Verify no new-only nodes are flagged
          const flaggedIndices = new Set(duplicates.map(d => d.newNodeIndex))
          for (let i = matchingNames.length; i < newNodes.length; i++) {
            expect(flaggedIndices.has(i)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve conflict information for all duplicates', () => {
    /**
     * **Validates: Requirements 5.4, 7.1, 7.2**
     * 
     * Property: For any duplicate node detected, the conflicts array should be
     * present (even if empty), and should contain all property conflicts between
     * the new and existing nodes.
     */
    
    fc.assert(
      fc.property(
        // Generate nodes with properties
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            properties: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              { minKeys: 0, maxKeys: 5 }
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (nodes) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new nodes and existing nodes with the same names
          const newNodes: NewNodeData[] = nodes.map(node => ({
            name: node.name,
            properties: node.properties,
          }))
          
          const existingNodes: ExistingNodeData[] = nodes.map((node, i) => ({
            id: `node-${i}`,
            name: node.name,
            metadata: JSON.stringify(node.properties),
          }))
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // All nodes should be flagged as duplicates
          expect(duplicates.length).toBe(nodes.length)
          
          // Each duplicate should have a conflicts array
          for (const dup of duplicates) {
            expect(Array.isArray(dup.conflicts)).toBe(true)
            
            // Since properties are the same, conflicts should be empty
            expect(dup.conflicts.length).toBe(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property-Based Tests for Property Conflict Detection
 * 
 * Feature: ai-document-analysis
 * Property 4: Property Conflict Detection Completeness
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 * 
 * For any duplicate node pair, when property comparison runs, all properties with
 * different values between the new and existing node should be identified as conflicts,
 * and properties with matching values should not be flagged.
 */

describe('Duplicate Detection Service - Property 4: Property Conflict Detection Completeness', () => {
  it('should identify all properties with different values as conflicts', () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * Property: For any duplicate node pair with properties, all properties that
     * have different values should be identified as conflicts, and the conflict
     * should contain both the existing and new values.
     */
    
    // Helper to filter out problematic JavaScript property names
    const filterProblematicKeys = (obj: Record<string, any>): Record<string, any> => {
      const problematicKeys = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
      const filtered: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (!problematicKeys.includes(key) && key.trim().length > 0) {
          filtered[key] = value
        }
      }
      return filtered
    }
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate properties for new node
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          { minKeys: 1, maxKeys: 10 }
        ),
        // Generate properties for existing node (with some overlapping keys)
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          { minKeys: 1, maxKeys: 10 }
        ),
        (nodeName: string, rawNewProps: Record<string, any>, rawExistingProps: Record<string, any>) => {
          // Filter out problematic keys
          const newProps = filterProblematicKeys(rawNewProps)
          const existingProps = filterProblematicKeys(rawExistingProps)
          
          // Skip if no valid properties
          if (Object.keys(newProps).length === 0 && Object.keys(existingProps).length === 0) {
            return
          }
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new node and existing node with the same name
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: newProps,
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify(existingProps),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Manually calculate expected conflicts
          const expectedConflicts: PropertyConflict[] = []
          for (const [key, newValue] of Object.entries(newProps)) {
            if (key in existingProps) {
              const existingValue = existingProps[key]
              
              // Check if values are different (using same logic as service)
              let isDifferent = false
              
              if (typeof newValue === 'string' && typeof existingValue === 'string') {
                // Case-insensitive string comparison
                isDifferent = newValue.toLowerCase().trim() !== existingValue.toLowerCase().trim()
              } else if (typeof newValue === typeof existingValue) {
                isDifferent = newValue !== existingValue
              } else {
                isDifferent = true
              }
              
              if (isDifferent) {
                expectedConflicts.push({
                  property: key,
                  existingValue,
                  newValue,
                })
              }
            }
          }
          
          // Verify all expected conflicts are detected
          expect(duplicate.conflicts.length).toBe(expectedConflicts.length)
          
          // Verify each conflict is correct
          for (const expectedConflict of expectedConflicts) {
            const foundConflict = duplicate.conflicts.find(
              c => c.property === expectedConflict.property
            )
            
            expect(foundConflict).toBeDefined()
            expect(foundConflict!.existingValue).toEqual(expectedConflict.existingValue)
            expect(foundConflict!.newValue).toEqual(expectedConflict.newValue)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not flag properties with matching values as conflicts', () => {
    /**
     * **Validates: Requirements 7.2, 7.3**
     * 
     * Property: For any duplicate node pair where properties have the same values,
     * those properties should not be flagged as conflicts.
     */
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate shared properties (same values)
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          { minKeys: 1, maxKeys: 10 }
        ),
        (nodeName: string, sharedProps: Record<string, any>) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new node and existing node with identical properties
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: { ...sharedProps },
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify({ ...sharedProps }),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Should have no conflicts since all properties match
          expect(duplicate.conflicts.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle case-insensitive string property comparison', () => {
    /**
     * **Validates: Requirements 7.2**
     * 
     * Property: For any duplicate node pair with string properties, values that
     * differ only in case should not be flagged as conflicts.
     */
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate string properties
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          { minKeys: 1, maxKeys: 5 }
        ),
        (nodeName: string, baseProps: Record<string, string>) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new node with uppercase values
          const newProps: Record<string, any> = {}
          for (const [key, value] of Object.entries(baseProps)) {
            newProps[key] = value.toUpperCase()
          }
          
          // Create existing node with lowercase values
          const existingProps: Record<string, any> = {}
          for (const [key, value] of Object.entries(baseProps)) {
            existingProps[key] = value.toLowerCase()
          }
          
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: newProps,
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify(existingProps),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Should have no conflicts since strings match case-insensitively
          expect(duplicate.conflicts.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should detect conflicts only for properties present in both nodes', () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * Property: For any duplicate node pair, only properties that exist in both
     * the new and existing nodes should be checked for conflicts. Properties that
     * exist only in one node should not generate conflicts.
     */
    
    // Helper to filter out problematic JavaScript property names
    const filterProblematicKeys = (obj: Record<string, any>): Record<string, any> => {
      const problematicKeys = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
      const filtered: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (!problematicKeys.includes(key) && key.trim().length > 0) {
          filtered[key] = value
        }
      }
      return filtered
    }
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate shared properties (with different values)
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer(),
          { minKeys: 1, maxKeys: 5 }
        ),
        // Generate properties only in new node
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string(),
          { minKeys: 0, maxKeys: 5 }
        ),
        // Generate properties only in existing node
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          { minKeys: 0, maxKeys: 5 }
        ),
        (
          nodeName: string,
          rawSharedProps: Record<string, number>,
          rawNewOnlyProps: Record<string, string>,
          rawExistingOnlyProps: Record<string, boolean>
        ) => {
          // Filter out problematic keys
          const sharedProps = filterProblematicKeys(rawSharedProps)
          const newOnlyProps = filterProblematicKeys(rawNewOnlyProps)
          const existingOnlyProps = filterProblematicKeys(rawExistingOnlyProps)
          
          // Skip if no shared properties
          if (Object.keys(sharedProps).length === 0) {
            return
          }
          const service = new DuplicateDetectionServiceImpl()
          
          // Ensure no key overlap between the three sets
          const sharedKeys = new Set(Object.keys(sharedProps))
          const filteredNewOnly: Record<string, string> = {}
          for (const [key, value] of Object.entries(newOnlyProps)) {
            if (!sharedKeys.has(key)) {
              filteredNewOnly[key] = value
            }
          }
          
          const filteredExistingOnly: Record<string, boolean> = {}
          const newOnlyKeys = new Set(Object.keys(filteredNewOnly))
          for (const [key, value] of Object.entries(existingOnlyProps)) {
            if (!sharedKeys.has(key) && !newOnlyKeys.has(key)) {
              filteredExistingOnly[key] = value
            }
          }
          
          // Create new node with shared + new-only properties
          // Make shared properties have different values by adding 1000
          const newProps: Record<string, any> = {
            ...filteredNewOnly,
          }
          for (const [key, value] of Object.entries(sharedProps)) {
            newProps[key] = value + 1000 // Ensure different value
          }
          
          // Create existing node with shared + existing-only properties
          const existingProps: Record<string, any> = {
            ...sharedProps,
            ...filteredExistingOnly,
          }
          
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: newProps,
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify(existingProps),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Should have conflicts only for shared properties (all have different values)
          expect(duplicate.conflicts.length).toBe(Object.keys(sharedProps).length)
          
          // Verify all conflicts are from shared properties
          const conflictKeys = new Set(duplicate.conflicts.map(c => c.property))
          for (const key of Object.keys(sharedProps)) {
            expect(conflictKeys.has(key)).toBe(true)
          }
          
          // Verify no conflicts from new-only or existing-only properties
          for (const key of Object.keys(filteredNewOnly)) {
            expect(conflictKeys.has(key)).toBe(false)
          }
          for (const key of Object.keys(filteredExistingOnly)) {
            expect(conflictKeys.has(key)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle complex property values (arrays and objects)', () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * Property: For any duplicate node pair with complex property values (arrays,
     * objects), conflicts should be detected when the structures differ.
     */
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate complex properties
        fc.record({
          arrayProp: fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
          objectProp: fc.record({
            nested: fc.string(),
            value: fc.integer(),
          }),
          primitiveProp: fc.string(),
        }),
        (nodeName: string, baseProps) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create new node with modified complex properties
          const newProps = {
            arrayProp: [...baseProps.arrayProp, 999], // Add element to array
            objectProp: { ...baseProps.objectProp, extra: 'new' }, // Add property to object
            primitiveProp: baseProps.primitiveProp, // Keep same
          }
          
          const existingProps = {
            arrayProp: baseProps.arrayProp,
            objectProp: baseProps.objectProp,
            primitiveProp: baseProps.primitiveProp,
          }
          
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: newProps,
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify(existingProps),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Should have conflicts for arrayProp and objectProp, but not primitiveProp
          expect(duplicate.conflicts.length).toBe(2)
          
          const conflictKeys = new Set(duplicate.conflicts.map(c => c.property))
          expect(conflictKeys.has('arrayProp')).toBe(true)
          expect(conflictKeys.has('objectProp')).toBe(true)
          expect(conflictKeys.has('primitiveProp')).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle null and undefined property values correctly', () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * Property: For any duplicate node pair with null or undefined property values,
     * conflicts should be detected appropriately based on value differences.
     */
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        (nodeName: string) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Test various null/undefined scenarios
          const testCases = [
            {
              name: 'null vs value',
              newProps: { prop: null },
              existingProps: { prop: 'value' },
              expectedConflicts: 1,
            },
            {
              name: 'value vs null',
              newProps: { prop: 'value' },
              existingProps: { prop: null },
              expectedConflicts: 1,
            },
            {
              name: 'null vs null',
              newProps: { prop: null },
              existingProps: { prop: null },
              expectedConflicts: 0,
            },
            {
              name: 'undefined vs value',
              newProps: { prop: undefined },
              existingProps: { prop: 'value' },
              expectedConflicts: 1,
            },
            {
              name: 'null vs undefined',
              newProps: { prop: null },
              existingProps: { prop: undefined },
              expectedConflicts: 0, // Both treated as "no value"
            },
          ]
          
          for (const testCase of testCases) {
            const newNodes: NewNodeData[] = [{
              name: nodeName,
              properties: testCase.newProps,
            }]
            
            const existingNodes: ExistingNodeData[] = [{
              id: 'existing-node-1',
              name: nodeName,
              metadata: JSON.stringify(testCase.existingProps),
            }]
            
            const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
            
            expect(duplicates.length).toBe(1)
            expect(duplicates[0].conflicts.length).toBe(testCase.expectedConflicts)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve all conflict information accurately', () => {
    /**
     * **Validates: Requirements 7.3, 7.4**
     * 
     * Property: For any duplicate node pair with conflicts, each conflict should
     * contain the correct property name, existing value, and new value.
     */
    
    // Helper to filter out problematic JavaScript property names
    const filterProblematicKeys = (specs: Array<{ key: string; existingValue: number; newValue: number }>): Array<{ key: string; existingValue: number; newValue: number }> => {
      const problematicKeys = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
      return specs.filter(spec => !problematicKeys.includes(spec.key) && spec.key.trim().length > 0)
    }
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        // Generate properties with guaranteed conflicts
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            existingValue: fc.integer({ min: 0, max: 100 }),
            newValue: fc.integer({ min: 101, max: 200 }), // Guaranteed different
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (nodeName: string, rawConflictSpecs) => {
          // Filter out problematic keys
          const conflictSpecs = filterProblematicKeys(rawConflictSpecs)
          
          // Ensure unique keys
          const uniqueSpecs = conflictSpecs.filter(
            (spec, index, self) => 
              self.findIndex(s => s.key === spec.key) === index
          )
          
          if (uniqueSpecs.length === 0) return // Skip if no unique keys
          
          const service = new DuplicateDetectionServiceImpl()
          
          // Build properties from specs
          const newProps: Record<string, any> = {}
          const existingProps: Record<string, any> = {}
          
          for (const spec of uniqueSpecs) {
            newProps[spec.key] = spec.newValue
            existingProps[spec.key] = spec.existingValue
          }
          
          const newNodes: NewNodeData[] = [{
            name: nodeName,
            properties: newProps,
          }]
          
          const existingNodes: ExistingNodeData[] = [{
            id: 'existing-node-1',
            name: nodeName,
            metadata: JSON.stringify(existingProps),
          }]
          
          const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
          
          // Should find exactly one duplicate
          expect(duplicates.length).toBe(1)
          const duplicate = duplicates[0]
          
          // Should have conflicts for all properties
          expect(duplicate.conflicts.length).toBe(uniqueSpecs.length)
          
          // Verify each conflict has correct information
          for (const spec of uniqueSpecs) {
            const conflict = duplicate.conflicts.find(c => c.property === spec.key)
            
            expect(conflict).toBeDefined()
            expect(conflict!.existingValue).toBe(spec.existingValue)
            expect(conflict!.newValue).toBe(spec.newValue)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty properties correctly', () => {
    /**
     * **Validates: Requirements 7.1**
     * 
     * Property: For any duplicate node pair where one or both nodes have empty
     * properties, no conflicts should be detected.
     */
    
    fc.assert(
      fc.property(
        // Generate a node name
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        (nodeName: string) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Test cases with empty properties
          const testCases = [
            {
              name: 'both empty',
              newProps: {},
              existingProps: {},
            },
            {
              name: 'new empty',
              newProps: {},
              existingProps: { prop: 'value' },
            },
            {
              name: 'existing empty',
              newProps: { prop: 'value' },
              existingProps: {},
            },
          ]
          
          for (const testCase of testCases) {
            const newNodes: NewNodeData[] = [{
              name: nodeName,
              properties: testCase.newProps,
            }]
            
            const existingNodes: ExistingNodeData[] = [{
              id: 'existing-node-1',
              name: nodeName,
              metadata: JSON.stringify(testCase.existingProps),
            }]
            
            const duplicates = service.detectDuplicateNodes(newNodes, existingNodes)
            
            // Should find duplicate but no conflicts
            expect(duplicates.length).toBe(1)
            expect(duplicates[0].conflicts.length).toBe(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property-Based Tests for Redundant Edge Detection
 * 
 * Feature: ai-document-analysis
 * Property 3: Redundant Edge Detection Accuracy
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * For any set of AI-generated edges and existing graph edges, when redundancy detection runs,
 * every edge with matching source node, target node, and relationship type should be flagged
 * as redundant, and no non-matching edges should be flagged.
 */

import type { NewEdgeData, ExistingEdgeData, PropertyConflict } from '../duplicate-detection'

describe('Duplicate Detection Service - Property 3: Redundant Edge Detection Accuracy', () => {
  it('should flag all edges with matching source, target, and type as redundant', () => {
    /**
     * **Validates: Requirements 6.1, 6.2, 6.3**
     * 
     * Property: For any set of new edges and existing edges, every edge with
     * matching source node ID, target node ID, and relationship type (case-insensitive)
     * should be flagged as redundant, and no non-matching edges should be flagged.
     */
    
    fc.assert(
      fc.property(
        // Generate new edges with random entity names and types
        fc.array(
          fc.record({
            from: fc.string({ minLength: 1, maxLength: 30 }),
            to: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate existing edges with random node IDs and labels
        fc.array(
          fc.record({
            fromNodeId: fc.uuid(),
            toNodeId: fc.uuid(),
            label: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate node mapping
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            id: fc.uuid(),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (newEdges: NewEdgeData[], existingEdges: ExistingEdgeData[], nodeMappingArray) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Build node mapping from array
          const nodeMapping = new Map<string, string>()
          for (const node of nodeMappingArray) {
            const normalizedName = node.name.toLowerCase().trim()
            // Only keep first occurrence if there are duplicates
            if (!nodeMapping.has(normalizedName)) {
              nodeMapping.set(normalizedName, node.id)
            }
          }
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Create a set of existing edge signatures for verification
          const existingEdgeSignatures = new Set<string>()
          for (const edge of existingEdges) {
            const signature = `${edge.fromNodeId}|${edge.toNodeId}|${edge.label.toLowerCase().trim()}`
            existingEdgeSignatures.add(signature)
          }
          
          // Verify all flagged edges are actual redundancies
          for (const index of redundantIndices) {
            const newEdge = newEdges[index]
            const fromId = nodeMapping.get(newEdge.from.toLowerCase().trim())
            const toId = nodeMapping.get(newEdge.to.toLowerCase().trim())
            
            expect(fromId).toBeDefined()
            expect(toId).toBeDefined()
            
            const signature = `${fromId}|${toId}|${newEdge.type.toLowerCase().trim()}`
            expect(existingEdgeSignatures.has(signature)).toBe(true)
          }
          
          // Verify no false positives: all non-flagged edges should not match existing edges
          const flaggedSet = new Set(redundantIndices)
          
          for (let i = 0; i < newEdges.length; i++) {
            if (!flaggedSet.has(i)) {
              const newEdge = newEdges[i]
              const fromId = nodeMapping.get(newEdge.from.toLowerCase().trim())
              const toId = nodeMapping.get(newEdge.to.toLowerCase().trim())
              
              // If we can't map the nodes, it's expected not to be flagged
              if (!fromId || !toId) {
                continue
              }
              
              const signature = `${fromId}|${toId}|${newEdge.type.toLowerCase().trim()}`
              expect(existingEdgeSignatures.has(signature)).toBe(false)
            }
          }
          
          // Verify no false negatives: all actual matches should be flagged
          for (let i = 0; i < newEdges.length; i++) {
            const newEdge = newEdges[i]
            const fromId = nodeMapping.get(newEdge.from.toLowerCase().trim())
            const toId = nodeMapping.get(newEdge.to.toLowerCase().trim())
            
            // Skip if we can't map the nodes
            if (!fromId || !toId) {
              continue
            }
            
            const signature = `${fromId}|${toId}|${newEdge.type.toLowerCase().trim()}`
            
            if (existingEdgeSignatures.has(signature)) {
              // This edge should be flagged as redundant
              expect(flaggedSet.has(i)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle case-insensitive relationship type matching', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * Property: For any edges with the same source, target, and relationship type
     * (differing only in case), they should be flagged as redundant.
     */
    
    fc.assert(
      fc.property(
        // Generate unique edge specifications
        fc.array(
          fc.record({
            fromName: fc.string({ minLength: 1, maxLength: 20 }),
            toName: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (edgeSpecs) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          const uniqueNames = new Set<string>()
          
          for (const spec of edgeSpecs) {
            uniqueNames.add(spec.fromName.toLowerCase().trim())
            uniqueNames.add(spec.toName.toLowerCase().trim())
          }
          
          const nameToId = new Map<string, string>()
          let idCounter = 0
          for (const name of uniqueNames) {
            const id = `node-${idCounter++}`
            nodeMapping.set(name, id)
            nameToId.set(name, id)
          }
          
          // Create new edges with uppercase types
          const newEdges: NewEdgeData[] = edgeSpecs.map(spec => ({
            from: spec.fromName,
            to: spec.toName,
            type: spec.type.toUpperCase(),
          }))
          
          // Create existing edges with lowercase types
          const existingEdges: ExistingEdgeData[] = edgeSpecs.map(spec => {
            const fromId = nameToId.get(spec.fromName.toLowerCase().trim())!
            const toId = nameToId.get(spec.toName.toLowerCase().trim())!
            return {
              fromNodeId: fromId,
              toNodeId: toId,
              label: spec.type.toLowerCase(),
            }
          })
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // All edges should be flagged as redundant despite case differences
          expect(redundantIndices.length).toBe(edgeSpecs.length)
          
          // Verify all indices are present
          const flaggedSet = new Set(redundantIndices)
          for (let i = 0; i < edgeSpecs.length; i++) {
            expect(flaggedSet.has(i)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not flag edges with different source nodes as redundant', () => {
    /**
     * **Validates: Requirements 6.1, 6.2**
     * 
     * Property: For any edges with the same target and type but different source
     * nodes, they should not be flagged as redundant.
     */
    
    fc.assert(
      fc.property(
        // Generate edge specifications with guaranteed different sources
        fc.string({ minLength: 1, maxLength: 20 }), // target name
        fc.string({ minLength: 1, maxLength: 20 }), // type
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 2, maxLength: 5, selector: (s) => s.toLowerCase().trim() }
        ), // different source names
        (targetName: string, edgeType: string, sourceNames: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          nodeMapping.set(targetName.toLowerCase().trim(), 'target-node-id')
          
          sourceNames.forEach((name, i) => {
            nodeMapping.set(name.toLowerCase().trim(), `source-node-${i}`)
          })
          
          // Create new edges with different sources but same target and type
          const newEdges: NewEdgeData[] = sourceNames.map(sourceName => ({
            from: sourceName,
            to: targetName,
            type: edgeType,
          }))
          
          // Create one existing edge with the first source
          const existingEdges: ExistingEdgeData[] = [{
            fromNodeId: 'source-node-0',
            toNodeId: 'target-node-id',
            label: edgeType,
          }]
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Only the first edge should be flagged as redundant
          expect(redundantIndices.length).toBe(1)
          expect(redundantIndices[0]).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not flag edges with different target nodes as redundant', () => {
    /**
     * **Validates: Requirements 6.1, 6.2**
     * 
     * Property: For any edges with the same source and type but different target
     * nodes, they should not be flagged as redundant.
     */
    
    fc.assert(
      fc.property(
        // Generate edge specifications with guaranteed different targets
        fc.string({ minLength: 1, maxLength: 20 }), // source name
        fc.string({ minLength: 1, maxLength: 20 }), // type
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 2, maxLength: 5, selector: (s) => s.toLowerCase().trim() }
        ), // different target names
        (sourceName: string, edgeType: string, targetNames: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          nodeMapping.set(sourceName.toLowerCase().trim(), 'source-node-id')
          
          targetNames.forEach((name, i) => {
            nodeMapping.set(name.toLowerCase().trim(), `target-node-${i}`)
          })
          
          // Create new edges with same source but different targets
          const newEdges: NewEdgeData[] = targetNames.map(targetName => ({
            from: sourceName,
            to: targetName,
            type: edgeType,
          }))
          
          // Create one existing edge with the first target
          const existingEdges: ExistingEdgeData[] = [{
            fromNodeId: 'source-node-id',
            toNodeId: 'target-node-0',
            label: edgeType,
          }]
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Only the first edge should be flagged as redundant
          expect(redundantIndices.length).toBe(1)
          expect(redundantIndices[0]).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not flag edges with different relationship types as redundant', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * Property: For any edges with the same source and target but different
     * relationship types, they should not be flagged as redundant.
     */
    
    fc.assert(
      fc.property(
        // Generate edge specifications with guaranteed different types
        fc.string({ minLength: 1, maxLength: 20 }), // source name
        fc.string({ minLength: 1, maxLength: 20 }), // target name
        fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 2, maxLength: 5, selector: (s) => s.toLowerCase().trim() }
        ), // different types
        (sourceName: string, targetName: string, edgeTypes: string[]) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          nodeMapping.set(sourceName.toLowerCase().trim(), 'source-node-id')
          nodeMapping.set(targetName.toLowerCase().trim(), 'target-node-id')
          
          // Create new edges with same source and target but different types
          const newEdges: NewEdgeData[] = edgeTypes.map(type => ({
            from: sourceName,
            to: targetName,
            type: type,
          }))
          
          // Create one existing edge with the first type
          const existingEdges: ExistingEdgeData[] = [{
            fromNodeId: 'source-node-id',
            toNodeId: 'target-node-id',
            label: edgeTypes[0],
          }]
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Only the first edge should be flagged as redundant
          expect(redundantIndices.length).toBe(1)
          expect(redundantIndices[0]).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should skip edges with unmapped nodes', () => {
    /**
     * **Validates: Requirements 6.1**
     * 
     * Property: For any edges where the source or target node cannot be mapped
     * to an ID, they should not be flagged as redundant (even if they might match).
     */
    
    fc.assert(
      fc.property(
        // Generate edges with some unmapped nodes
        fc.array(
          fc.record({
            from: fc.string({ minLength: 1, maxLength: 20 }),
            to: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
            isMapped: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (edgeSpecs) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping only for mapped nodes
          const nodeMapping = new Map<string, string>()
          let idCounter = 0
          
          for (const spec of edgeSpecs) {
            if (spec.isMapped) {
              const fromKey = spec.from.toLowerCase().trim()
              const toKey = spec.to.toLowerCase().trim()
              
              if (!nodeMapping.has(fromKey)) {
                nodeMapping.set(fromKey, `node-${idCounter++}`)
              }
              if (!nodeMapping.has(toKey)) {
                nodeMapping.set(toKey, `node-${idCounter++}`)
              }
            }
          }
          
          // Create new edges
          const newEdges: NewEdgeData[] = edgeSpecs.map(spec => ({
            from: spec.from,
            to: spec.to,
            type: spec.type,
          }))
          
          // Create existing edges for mapped nodes
          const existingEdges: ExistingEdgeData[] = []
          for (const spec of edgeSpecs) {
            if (spec.isMapped) {
              const fromId = nodeMapping.get(spec.from.toLowerCase().trim())
              const toId = nodeMapping.get(spec.to.toLowerCase().trim())
              
              if (fromId && toId) {
                existingEdges.push({
                  fromNodeId: fromId,
                  toNodeId: toId,
                  label: spec.type,
                })
              }
            }
          }
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Verify only mapped edges are flagged
          for (const index of redundantIndices) {
            const spec = edgeSpecs[index]
            expect(spec.isMapped).toBe(true)
            
            const fromId = nodeMapping.get(spec.from.toLowerCase().trim())
            const toId = nodeMapping.get(spec.to.toLowerCase().trim())
            expect(fromId).toBeDefined()
            expect(toId).toBeDefined()
          }
          
          // Verify unmapped edges are not flagged
          for (let i = 0; i < edgeSpecs.length; i++) {
            const spec = edgeSpecs[i]
            if (!spec.isMapped) {
              expect(redundantIndices.includes(i)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty arrays correctly', () => {
    /**
     * **Validates: Requirements 6.1**
     * 
     * Property: For any combination of empty arrays (empty new edges, empty existing
     * edges, or both), redundancy detection should return an empty array without errors.
     */
    
    fc.assert(
      fc.property(
        fc.constantFrom(
          { newEdges: [], existingEdges: [], nodeMapping: new Map() },
          { 
            newEdges: [{ from: 'A', to: 'B', type: 'relates_to' }],
            existingEdges: [],
            nodeMapping: new Map([['a', 'node-1'], ['b', 'node-2']])
          },
          {
            newEdges: [],
            existingEdges: [{ fromNodeId: 'node-1', toNodeId: 'node-2', label: 'relates_to' }],
            nodeMapping: new Map([['a', 'node-1'], ['b', 'node-2']])
          }
        ),
        (testCase: {
          newEdges: NewEdgeData[],
          existingEdges: ExistingEdgeData[],
          nodeMapping: Map<string, string>
        }) => {
          const service = new DuplicateDetectionServiceImpl()
          const redundantIndices = service.detectRedundantEdges(
            testCase.newEdges,
            testCase.existingEdges,
            testCase.nodeMapping
          )
          
          // Should return empty array without errors
          expect(Array.isArray(redundantIndices)).toBe(true)
          expect(redundantIndices.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle whitespace in relationship types', () => {
    /**
     * **Validates: Requirements 6.2**
     * 
     * Property: For any edges with relationship types that have leading/trailing
     * whitespace, redundancy detection should normalize by trimming and correctly
     * identify matches.
     */
    
    fc.assert(
      fc.property(
        // Generate unique edge specifications
        fc.array(
          fc.record({
            fromName: fc.string({ minLength: 1, maxLength: 20 }),
            toName: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (edgeSpecs) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          const uniqueNames = new Set<string>()
          
          for (const spec of edgeSpecs) {
            uniqueNames.add(spec.fromName.toLowerCase().trim())
            uniqueNames.add(spec.toName.toLowerCase().trim())
          }
          
          const nameToId = new Map<string, string>()
          let idCounter = 0
          for (const name of uniqueNames) {
            const id = `node-${idCounter++}`
            nodeMapping.set(name, id)
            nameToId.set(name, id)
          }
          
          // Create new edges with whitespace in types
          const newEdges: NewEdgeData[] = edgeSpecs.map(spec => ({
            from: spec.fromName,
            to: spec.toName,
            type: `  ${spec.type}  `, // Add leading/trailing whitespace
          }))
          
          // Create existing edges without whitespace
          const existingEdges: ExistingEdgeData[] = edgeSpecs.map(spec => {
            const fromId = nameToId.get(spec.fromName.toLowerCase().trim())!
            const toId = nameToId.get(spec.toName.toLowerCase().trim())!
            return {
              fromNodeId: fromId,
              toNodeId: toId,
              label: spec.type.trim(),
            }
          })
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // All edges should be flagged as redundant despite whitespace differences
          expect(redundantIndices.length).toBe(edgeSpecs.length)
          
          // Verify all indices are present
          const flaggedSet = new Set(redundantIndices)
          for (let i = 0; i < edgeSpecs.length; i++) {
            expect(flaggedSet.has(i)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should detect multiple redundant edges correctly', () => {
    /**
     * **Validates: Requirements 6.1, 6.2, 6.3**
     * 
     * Property: For any mixed set of edges (some redundant, some not), redundancy
     * detection should correctly identify all and only the redundant edges.
     */
    
    fc.assert(
      fc.property(
        // Generate redundant edge specifications
        fc.array(
          fc.record({
            fromName: fc.string({ minLength: 1, maxLength: 20 }),
            toName: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate unique edge specifications
        fc.array(
          fc.record({
            fromName: fc.string({ minLength: 1, maxLength: 20 }),
            toName: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (redundantSpecs, uniqueSpecs) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Collect all unique node names
          const allNames = new Set<string>()
          for (const spec of [...redundantSpecs, ...uniqueSpecs]) {
            allNames.add(spec.fromName.toLowerCase().trim())
            allNames.add(spec.toName.toLowerCase().trim())
          }
          
          // Create node mapping
          const nodeMapping = new Map<string, string>()
          const nameToId = new Map<string, string>()
          let idCounter = 0
          
          for (const name of allNames) {
            const id = `node-${idCounter++}`
            nodeMapping.set(name, id)
            nameToId.set(name, id)
          }
          
          // Create new edges: redundant + unique
          const newEdges: NewEdgeData[] = [
            ...redundantSpecs.map(spec => ({
              from: spec.fromName,
              to: spec.toName,
              type: spec.type.toUpperCase(), // Use uppercase for variation
            })),
            ...uniqueSpecs.map(spec => ({
              from: spec.fromName,
              to: spec.toName,
              type: `unique_${spec.type}`, // Make type unique
            })),
          ]
          
          // Create existing edges only for redundant specs
          const existingEdges: ExistingEdgeData[] = redundantSpecs.map(spec => {
            const fromId = nameToId.get(spec.fromName.toLowerCase().trim())!
            const toId = nameToId.get(spec.toName.toLowerCase().trim())!
            return {
              fromNodeId: fromId,
              toNodeId: toId,
              label: spec.type.toLowerCase(), // Use lowercase for variation
            }
          })
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // Should find exactly the redundant edges
          expect(redundantIndices.length).toBe(redundantSpecs.length)
          
          // Verify all redundant indices are in the first part of the array
          for (const index of redundantIndices) {
            expect(index).toBeLessThan(redundantSpecs.length)
          }
          
          // Verify all indices in the redundant range are flagged
          const flaggedSet = new Set(redundantIndices)
          for (let i = 0; i < redundantSpecs.length; i++) {
            expect(flaggedSet.has(i)).toBe(true)
          }
          
          // Verify no unique edges are flagged
          for (let i = redundantSpecs.length; i < newEdges.length; i++) {
            expect(flaggedSet.has(i)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle node name case variations in mapping', () => {
    /**
     * **Validates: Requirements 6.1**
     * 
     * Property: For any edges where node names in the edge data have different
     * case than the node mapping keys, redundancy detection should correctly
     * normalize and match them.
     */
    
    fc.assert(
      fc.property(
        // Generate edge specifications
        fc.array(
          fc.record({
            fromName: fc.string({ minLength: 1, maxLength: 20 }),
            toName: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (edgeSpecs) => {
          const service = new DuplicateDetectionServiceImpl()
          
          // Create node mapping with lowercase keys
          const nodeMapping = new Map<string, string>()
          const nameToId = new Map<string, string>()
          const uniqueNames = new Set<string>()
          
          for (const spec of edgeSpecs) {
            uniqueNames.add(spec.fromName.toLowerCase().trim())
            uniqueNames.add(spec.toName.toLowerCase().trim())
          }
          
          let idCounter = 0
          for (const name of uniqueNames) {
            const id = `node-${idCounter++}`
            nodeMapping.set(name, id)
            nameToId.set(name, id)
          }
          
          // Create new edges with uppercase names
          const newEdges: NewEdgeData[] = edgeSpecs.map(spec => ({
            from: spec.fromName.toUpperCase(),
            to: spec.toName.toUpperCase(),
            type: spec.type,
          }))
          
          // Create existing edges
          const existingEdges: ExistingEdgeData[] = edgeSpecs.map(spec => {
            const fromId = nameToId.get(spec.fromName.toLowerCase().trim())!
            const toId = nameToId.get(spec.toName.toLowerCase().trim())!
            return {
              fromNodeId: fromId,
              toNodeId: toId,
              label: spec.type,
            }
          })
          
          const redundantIndices = service.detectRedundantEdges(
            newEdges,
            existingEdges,
            nodeMapping
          )
          
          // All edges should be flagged as redundant despite case differences in names
          expect(redundantIndices.length).toBe(edgeSpecs.length)
          
          // Verify all indices are present
          const flaggedSet = new Set(redundantIndices)
          for (let i = 0; i < edgeSpecs.length; i++) {
            expect(flaggedSet.has(i)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
