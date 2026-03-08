/**
 * Preservation Property Tests for CSV Import Column Validation
 * 
 * Feature: csv-import-column-validation-fix
 * Property 2: Preservation - 标准CSV解析行为保持不变
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * **IMPORTANT**: These tests run on UNFIXED code to observe baseline behavior
 * **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
 * 
 * Testing Strategy:
 * - Observe behavior on UNFIXED code for non-buggy inputs
 * - Write property-based tests capturing observed behavior patterns
 * - Ensure all standard CSV parsing functionality continues to work after fix
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

describe('CSV Import Column Validation - Preservation Properties', () => {
  /**
   * **Validates: Requirement 3.1**
   * 
   * Property: Standard lowercase column names continue to work
   * For all CSV files with standard lowercase column names (source, target, label),
   * the parsing result should be successful and produce valid graph data.
   */
  describe('Property: Standard lowercase column names', () => {
    it('should parse CSV with standard lowercase source,target,label columns', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBeGreaterThan(0)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    })

    it('should parse CSV with standard lowercase source,target (no label)', async () => {
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

    it('property: all standard lowercase CSV files parse successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
            fc.string({ maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
          ), { minLength: 1, maxLength: 10 }),
          async (edges) => {
            const csvLines = ['source,target,label']
            edges.forEach(([source, target, label]) => {
              csvLines.push(`${source},${target},${label}`)
            })
            const csvContent = csvLines.join('\n')
            const file = createMockFile(csvContent, 'test.csv')

            const result = await parseCSVFile(file)

            expect(result.nodes.length).toBeGreaterThan(0)
            expect(result.edges.length).toBe(edges.length)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Validates: Requirement 3.2**
   * 
   * Property: Supported column name aliases continue to work
   * For all CSV files using supported aliases (from/to, src/dst, etc.),
   * the columns should be correctly identified and parsed.
   */
  describe('Property: Supported column name aliases', () => {
    it('should parse CSV with from,to,relationship aliases', async () => {
      const csvContent = 'from,to,relationship\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    })

    it('should parse CSV with src,dst,type aliases', async () => {
      const csvContent = 'src,dst,type\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    })

    it('should parse CSV with src,dest,relation aliases', async () => {
      const csvContent = 'src,dest,relation\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    })

    it('property: all supported alias combinations parse successfully', async () => {
      const sourceAliases = ['source', 'from', 'src']
      const targetAliases = ['target', 'to', 'dest', 'dst']
      const labelAliases = ['label', 'relationship', 'relation', 'type']

      for (const sourceAlias of sourceAliases) {
        for (const targetAlias of targetAliases) {
          for (const labelAlias of labelAliases) {
            const csvContent = `${sourceAlias},${targetAlias},${labelAlias}\nNode1,Node2,connects\nNode2,Node3,links`
            const file = createMockFile(csvContent, 'test.csv')

            const result = await parseCSVFile(file)

            expect(result.nodes.length).toBe(3)
            expect(result.edges.length).toBe(2)
            expect(result.edges).toEqual([
              { source: 'Node1', target: 'Node2', label: 'connects' },
              { source: 'Node2', target: 'Node3', label: 'links' }
            ])
          }
        }
      }
    })
  })

  /**
   * **Validates: Requirement 3.3**
   * 
   * Property: Label/relationship column handling continues to work
   * For all CSV files with or without label columns,
   * the label should be correctly parsed or default to empty string.
   */
  describe('Property: Label/relationship column handling', () => {
    it('should parse CSV with label column', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.edges[0].label).toBe('connects')
      expect(result.edges[1].label).toBe('links')
    })

    it('should parse CSV without label column (defaults to empty)', async () => {
      const csvContent = 'source,target\nNode1,Node2\nNode2,Node3'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.edges[0].label).toBe('')
      expect(result.edges[1].label).toBe('')
    })

    it('should parse CSV with empty label values', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,\nNode2,Node3,'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.edges[0].label).toBe('')
      expect(result.edges[1].label).toBe('')
    })
  })

  /**
   * **Validates: Requirement 3.4**
   * 
   * Property: Node data format with coordinates uses parseCSVWithNodeData
   * For all CSV files containing x,y coordinate columns,
   * the parser should use parseCSVWithNodeData function instead of parseCSVWithEdgeData.
   */
  describe('Property: Node data format with coordinates', () => {
    it('should parse CSV with node data (x,y coordinates)', async () => {
      const csvContent = 'label,x,y,description\nNode1,10,20,First node\nNode2,30,40,Second node'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(2)
      expect(result.edges.length).toBe(0)
      expect(result.nodes[0]).toMatchObject({
        label: 'Node1',
        x: 10,
        y: 20,
        description: 'First node'
      })
      expect(result.nodes[1]).toMatchObject({
        label: 'Node2',
        x: 30,
        y: 40,
        description: 'Second node'
      })
    })

    it('should parse CSV with node data including z coordinate', async () => {
      const csvContent = 'label,x,y,z\nNode1,10,20,30\nNode2,40,50,60'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(2)
      expect(result.nodes[0]).toMatchObject({
        label: 'Node1',
        x: 10,
        y: 20,
        z: 30
      })
      expect(result.nodes[1]).toMatchObject({
        label: 'Node2',
        x: 40,
        y: 50,
        z: 60
      })
    })

    it('should parse CSV with node data including color and size', async () => {
      const csvContent = 'label,x,y,color,size\nNode1,10,20,#ff0000,5\nNode2,30,40,#00ff00,10'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(2)
      expect(result.nodes[0]).toMatchObject({
        label: 'Node1',
        x: 10,
        y: 20,
        color: '#ff0000',
        size: 5
      })
    })
  })

  /**
   * **Validates: Requirement 3.5**
   * 
   * Property: Empty lines and special characters in data are handled correctly
   * For all CSV files with empty lines or special characters in values,
   * the parser should correctly skip empty lines and preserve special characters in data.
   */
  describe('Property: Empty lines and special characters handling', () => {
    it('should skip empty lines in CSV', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\n\nNode2,Node3,links\n\n'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: 'Node1', target: 'Node2', label: 'connects' },
        { source: 'Node2', target: 'Node3', label: 'links' }
      ])
    })

    it('should handle special characters in node names (quoted values)', async () => {
      const csvContent = 'source,target,label\n"Node, 1","Node, 2",connects\n"Node, 2","Node, 3",links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      // Note: parseCSVLine handles quoted values
      expect(result.edges[0].source).toContain('Node')
      expect(result.edges[0].target).toContain('Node')
    })

    it('should handle unicode characters in data', async () => {
      const csvContent = 'source,target,label\n节点1,节点2,连接\n节点2,节点3,链接'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges).toEqual([
        { source: '节点1', target: '节点2', label: '连接' },
        { source: '节点2', target: '节点3', label: '链接' }
      ])
    })

    it('should handle mixed content with empty lines and special chars', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\n\n"Node, 2",节点3,链接\n\n'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.nodes.length).toBeGreaterThan(0)
    })

    it('property: empty lines are always skipped', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
            fc.string({ maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
          ), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 3 }), // number of empty lines to insert
          async (edges, emptyLineCount) => {
            const csvLines = ['source,target,label']
            edges.forEach(([source, target, label]) => {
              csvLines.push(`${source},${target},${label}`)
              // Insert empty lines randomly
              for (let i = 0; i < emptyLineCount; i++) {
                csvLines.push('')
              }
            })
            const csvContent = csvLines.join('\n')
            const file = createMockFile(csvContent, 'test.csv')

            const result = await parseCSVFile(file)

            // Empty lines should not affect edge count
            expect(result.edges.length).toBe(edges.length)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   * 
   * Meta-property: ParsedGraphData structure remains consistent
   * For all valid CSV inputs, the returned ParsedGraphData structure
   * should have the expected shape with nodes and edges arrays.
   */
  describe('Meta-property: ParsedGraphData structure consistency', () => {
    it('should always return ParsedGraphData with nodes and edges arrays', async () => {
      const testCases = [
        'source,target,label\nNode1,Node2,connects',
        'from,to,relationship\nNode1,Node2,connects',
        'src,dst,type\nNode1,Node2,connects',
        'label,x,y\nNode1,10,20',
        'source,target\nNode1,Node2'
      ]

      for (const csvContent of testCases) {
        const file = createMockFile(csvContent, 'test.csv')
        const result = await parseCSVFile(file)

        expect(result).toHaveProperty('nodes')
        expect(result).toHaveProperty('edges')
        expect(Array.isArray(result.nodes)).toBe(true)
        expect(Array.isArray(result.edges)).toBe(true)
      }
    })

    it('should ensure all nodes have required id field', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id')
        expect(node.id).toBeTruthy()
      })
    })

    it('should ensure all edges have source and target fields', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test.csv')

      const result = await parseCSVFile(file)

      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(edge.source).toBeTruthy()
        expect(edge.target).toBeTruthy()
      })
    })
  })
})
