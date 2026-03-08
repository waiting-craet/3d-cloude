/**
 * Preservation Property Test for CSV Chinese Column Names Fix
 * 
 * Feature: csv-chinese-column-names-fix
 * Property 2: Preservation - 英文列名继续正常工作
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 * 
 * **CRITICAL**: This test MUST PASS on unfixed code - it captures baseline behavior
 * **GOAL**: Verify that English column names continue to work after the fix
 * **APPROACH**: Observe behavior on unfixed code, then verify same behavior after fix
 * 
 * This test uses property-based testing to generate many test cases and provide
 * strong guarantees that all non-bug inputs maintain their behavior.
 */

import { describe, it, expect } from '@jest/globals'
import { parseCSVFile } from '../graph-import'
import fc from 'fast-check'

// Helper to create a File-like object that works in Node.js test environment
function createMockFile(content: string, filename: string): File {
  const blob = new Blob([content], { type: 'text/csv' })
  const file = new File([blob], filename, { type: 'text/csv' })
  
  // Add text() method for Node.js environment
  if (!file.text) {
    (file as any).text = async () => content
  }
  
  return file
}

describe('CSV Chinese Column Names - Preservation Property Tests', () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Property: English column names should continue to work exactly as before
   * 
   * This test verifies that all existing English column name aliases continue
   * to be recognized and produce correct results.
   */

  it('should continue to recognize English source aliases: source, from, src', async () => {
    const sourceAliases = ['source', 'from', 'src']
    
    for (const alias of sourceAliases) {
      const csvContent = `${alias},target,label\nNode1,Node2,connects\nNode2,Node3,links`
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    }
  })

  it('should continue to recognize English target aliases: target, to, dest, dst', async () => {
    const targetAliases = ['target', 'to', 'dest', 'dst']
    
    for (const alias of targetAliases) {
      const csvContent = `source,${alias},label\nNode1,Node2,connects\nNode2,Node3,links`
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    }
  })

  it('should continue to recognize English label aliases: label, relationship, relation, type', async () => {
    const labelAliases = ['label', 'relationship', 'relation', 'type']
    
    for (const alias of labelAliases) {
      const csvContent = `source,target,${alias}\nNode1,Node2,connects\nNode2,Node3,links`
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    }
  })

  /**
   * **Validates: Requirement 3.4**
   * 
   * Property: Missing required columns should continue to throw clear error messages
   */

  it('should continue to throw error when source column is missing', async () => {
    const csvContent = 'target,label\nNode1,connects\nNode2,links'
    const file = createMockFile(csvContent, 'test.csv')

    await expect(parseCSVFile(file)).rejects.toThrow('CSV文件必须包含source和target列')
  })

  it('should continue to throw error when target column is missing', async () => {
    const csvContent = 'source,label\nNode1,connects\nNode2,links'
    const file = createMockFile(csvContent, 'test.csv')

    await expect(parseCSVFile(file)).rejects.toThrow('CSV文件必须包含source和target列')
  })

  it('should continue to throw error when both source and target columns are missing', async () => {
    const csvContent = 'label\nconnects\nlinks'
    const file = createMockFile(csvContent, 'test.csv')

    await expect(parseCSVFile(file)).rejects.toThrow('CSV文件必须包含source和target列')
  })

  /**
   * **Validates: Requirement 3.5**
   * 
   * Property: Valid edge data should continue to create correct node and edge collections
   */

  it('should continue to create correct nodes and edges from valid data', async () => {
    const csvContent = 'source,target,label\nA,B,rel1\nB,C,rel2\nC,D,rel3\nA,D,rel4'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    // Should create 4 unique nodes
    expect(result.nodes.length).toBe(4)
    const nodeLabels = result.nodes.map(n => n.label).sort()
    expect(nodeLabels).toEqual(['A', 'B', 'C', 'D'])

    // Should create 4 edges
    expect(result.edges.length).toBe(4)
    expect(result.edges).toEqual([
      { source: 'A', target: 'B', label: 'rel1' },
      { source: 'B', target: 'C', label: 'rel2' },
      { source: 'C', target: 'D', label: 'rel3' },
      { source: 'A', target: 'D', label: 'rel4' }
    ])
  })

  /**
   * **Validates: Requirement 3.6**
   * 
   * Property: Rows with empty source or target should continue to be skipped
   */

  it('should continue to skip rows with empty source', async () => {
    const csvContent = 'source,target,label\n,Node2,connects\nNode1,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    // Should only process the second row
    expect(result.nodes.length).toBe(2)
    expect(result.edges.length).toBe(1)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node3', label: 'links' }
    ])
  })

  it('should continue to skip rows with empty target', async () => {
    const csvContent = 'source,target,label\nNode1,,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    // Should only process the second row
    expect(result.nodes.length).toBe(2)
    expect(result.edges.length).toBe(1)
    expect(result.edges).toEqual([
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should continue to skip rows with both empty source and target', async () => {
    const csvContent = 'source,target,label\n,,connects\nNode1,Node2,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    // Should only process the second row
    expect(result.nodes.length).toBe(2)
    expect(result.edges.length).toBe(1)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'links' }
    ])
  })

  /**
   * **Validates: Requirement 3.7**
   * 
   * Property: CSV without label column should continue to set empty string as label
   */

  it('should continue to set empty string as label when label column is missing', async () => {
    const csvContent = 'source,target\nNode1,Node2\nNode2,Node3'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: '' },
      { source: 'Node2', target: 'Node3', label: '' }
    ])
  })

  /**
   * **Property-Based Test: All English Column Name Combinations**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
   * 
   * Property: For all CSV inputs with English column names, the system should
   * continue to parse correctly and produce valid nodes and edges.
   * 
   * This property test generates random combinations of English column names
   * and verifies they all continue to work correctly.
   */

  it('property: all English column name combinations should continue to work', async () => {
    const sourceAliases = ['source', 'from', 'src']
    const targetAliases = ['target', 'to', 'dest', 'dst']
    const labelAliases = ['label', 'relationship', 'relation', 'type']

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...sourceAliases),
        fc.constantFrom(...targetAliases),
        fc.constantFrom(...labelAliases),
        fc.array(fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
        ), { minLength: 1, maxLength: 10 }),
        async (sourceAlias, targetAlias, labelAlias, edges) => {
          const csvLines = [`${sourceAlias},${targetAlias},${labelAlias}`]
          edges.forEach(([source, target, label]) => {
            csvLines.push(`${source},${target},${label}`)
          })
          const csvContent = csvLines.join('\n')
          const file = createMockFile(csvContent, 'test.csv')

          const result = await parseCSVFile(file)

          // Verify correct parsing
          expect(result.nodes.length).toBeGreaterThan(0)
          expect(result.edges.length).toBe(edges.length)
          
          // Verify all edges are correctly parsed
          edges.forEach(([source, target, label], index) => {
            expect(result.edges[index]).toEqual({
              source: source.trim(),
              target: target.trim(),
              label: label.trim()
            })
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * **Property-Based Test: Empty Value Handling**
   * **Validates: Requirement 3.6**
   * 
   * Property: For all CSV inputs with some empty source or target values,
   * the system should continue to skip those rows correctly.
   */

  it('property: rows with empty source or target should continue to be skipped', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(
          fc.option(fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0), { nil: null }),
          fc.option(fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0), { nil: null }),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
        ), { minLength: 1, maxLength: 10 }),
        async (edges) => {
          const csvLines = ['source,target,label']
          edges.forEach(([source, target, label]) => {
            csvLines.push(`${source || ''},${target || ''},${label}`)
          })
          const csvContent = csvLines.join('\n')
          const file = createMockFile(csvContent, 'test.csv')

          const result = await parseCSVFile(file)

          // Count valid edges (both source and target non-empty)
          const validEdges = edges.filter(([s, t]) => s && t)
          
          expect(result.edges.length).toBe(validEdges.length)
          
          // Verify only valid edges are included
          validEdges.forEach(([source, target, label], index) => {
            expect(result.edges[index]).toEqual({
              source: source!.trim(),
              target: target!.trim(),
              label: label.trim()
            })
          })
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * **Property-Based Test: Node Deduplication**
   * **Validates: Requirement 3.5**
   * 
   * Property: For all CSV inputs, nodes should continue to be deduplicated correctly.
   * If the same node appears multiple times as source or target, it should only
   * appear once in the nodes array.
   */

  it('property: nodes should continue to be deduplicated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(
          fc.constantFrom('A', 'B', 'C', 'D'), // Limited set to ensure duplicates
          fc.constantFrom('A', 'B', 'C', 'D'),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
        ), { minLength: 1, maxLength: 20 }),
        async (edges) => {
          const csvLines = ['source,target,label']
          edges.forEach(([source, target, label]) => {
            csvLines.push(`${source},${target},${label}`)
          })
          const csvContent = csvLines.join('\n')
          const file = createMockFile(csvContent, 'test.csv')

          const result = await parseCSVFile(file)

          // Collect unique nodes from edges
          const uniqueNodes = new Set<string>()
          edges.forEach(([source, target]) => {
            uniqueNodes.add(source)
            uniqueNodes.add(target)
          })

          // Verify node count matches unique nodes
          expect(result.nodes.length).toBe(uniqueNodes.size)
          
          // Verify all unique nodes are present
          const resultNodeLabels = new Set(result.nodes.map(n => n.label))
          uniqueNodes.forEach(node => {
            expect(resultNodeLabels.has(node)).toBe(true)
          })
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * **Property-Based Test: Label Column Optional**
   * **Validates: Requirement 3.7**
   * 
   * Property: For all CSV inputs without a label column, the system should
   * continue to set empty string as the label for all edges.
   */

  it('property: missing label column should continue to result in empty labels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0)
        ), { minLength: 1, maxLength: 10 }),
        async (edges) => {
          const csvLines = ['source,target'] // No label column
          edges.forEach(([source, target]) => {
            csvLines.push(`${source},${target}`)
          })
          const csvContent = csvLines.join('\n')
          const file = createMockFile(csvContent, 'test.csv')

          const result = await parseCSVFile(file)

          expect(result.edges.length).toBe(edges.length)
          
          // Verify all edges have empty label
          result.edges.forEach(edge => {
            expect(edge.label).toBe('')
          })
        }
      ),
      { numRuns: 30 }
    )
  })
})
