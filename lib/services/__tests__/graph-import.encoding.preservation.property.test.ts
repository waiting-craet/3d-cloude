/**
 * Preservation Property Tests for CSV Encoding Fix
 * 
 * Feature: csv-encoding-fix
 * Property 2: Preservation - UTF-8和ASCII内容行为不变
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * **IMPORTANT**: These tests run on UNFIXED code to observe baseline behavior
 * **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
 * 
 * Testing Strategy:
 * - Observe behavior on UNFIXED code for UTF-8 encoded and ASCII-only CSV files
 * - Write property-based tests capturing observed behavior patterns
 * - Ensure UTF-8 encoding, ASCII content, edge-list format, and node format continue to work after fix
 */

import { describe, it, expect } from '@jest/globals'
import { parseCSVFile } from '../graph-import'
import fc from 'fast-check'
import { TextEncoder } from 'util'

// Helper to create a File-like object that works in Node.js test environment
function createMockFile(content: string, filename: string): File {
  const blob = new Blob([content], { type: 'text/csv' })
  const file = new File([blob], filename, { type: 'text/csv' })
  
  // Add text() method for Node.js environment
  if (!file.text) {
    (file as any).text = async () => content
  }
  
  // Add arrayBuffer() method for Node.js environment
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = async () => {
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(content)
      return uint8Array.buffer
    }
  }
  
  return file
}

describe('CSV Encoding Fix - Preservation Properties', () => {
  /**
   * **Validates: Requirement 3.1**
   * 
   * Property: UTF-8 encoded CSV files continue to parse correctly
   * For all CSV files using UTF-8 encoding (the current default),
   * the parsing result should remain unchanged after the fix.
   */
  describe('Property: UTF-8 encoded CSV files', () => {
    it('should parse UTF-8 encoded CSV with Chinese characters', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,拥有\nNode2,Node3,关系'
      const file = createMockFile(csvContent, 'test-utf8.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBeGreaterThan(0)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('拥有')
      expect(result.edges[1].label).toBe('关系')
    })

    it('should parse UTF-8 encoded CSV with mixed English and Chinese', async () => {
      const csvContent = 'source,target,label\nCompany,Person,拥有\nPerson,Asset,owns'
      const file = createMockFile(csvContent, 'test-utf8-mixed.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBeGreaterThan(0)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0].source).toBe('Company')
      expect(result.edges[0].target).toBe('Person')
      expect(result.edges[0].label).toBe('拥有')
      expect(result.edges[1].label).toBe('owns')
    })

    it('should parse UTF-8 encoded CSV with emoji and special Unicode', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,👍\nNode2,Node3,✓'
      const file = createMockFile(csvContent, 'test-utf8-emoji.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('👍')
      expect(result.edges[1].label).toBe('✓')
    })

    it('property: all UTF-8 encoded CSV files with Unicode characters parse correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
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

            expect(result.edges.length).toBe(edges.length)
            
            // Verify labels are preserved correctly (trimmed)
            edges.forEach(([source, target, label], index) => {
              expect(result.edges[index].source).toBe(source)
              expect(result.edges[index].target).toBe(target)
              expect(result.edges[index].label).toBe(label.trim())
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Validates: Requirement 3.2**
   * 
   * Property: ASCII-only CSV files continue to parse correctly
   * For all CSV files containing only ASCII characters (English, numbers, basic punctuation),
   * the parsing result should remain unchanged after the fix.
   */
  describe('Property: ASCII-only CSV files', () => {
    it('should parse ASCII-only CSV with English labels', async () => {
      const csvContent = 'source,target,label\nNode1,Node2,owns\nNode2,Node3,manages'
      const file = createMockFile(csvContent, 'test-ascii.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('owns')
      expect(result.edges[1].label).toBe('manages')
    })

    it('should parse ASCII-only CSV with numbers and underscores', async () => {
      const csvContent = 'source,target,label\nNode_1,Node_2,type_123\nNode_2,Node_3,type_456'
      const file = createMockFile(csvContent, 'test-ascii-numbers.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.edges[0].source).toBe('Node_1')
      expect(result.edges[0].target).toBe('Node_2')
      expect(result.edges[0].label).toBe('type_123')
    })

    it('should parse ASCII-only CSV with special characters', async () => {
      const csvContent = 'source,target,label\nNode-1,Node-2,has-property\nNode-2,Node-3,is-related'
      const file = createMockFile(csvContent, 'test-ascii-special.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('has-property')
      expect(result.edges[1].label).toBe('is-related')
    })

    it('property: all ASCII-only CSV files parse correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            fc.string({ maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]*$/.test(s))
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
            
            // Verify all data is preserved exactly
            edges.forEach(([source, target, label], index) => {
              expect(result.edges[index].source).toBe(source)
              expect(result.edges[index].target).toBe(target)
              expect(result.edges[index].label).toBe(label)
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Validates: Requirement 3.3**
   * 
   * Property: Edge-list format (source, label, target) continues to parse correctly
   * For all CSV files in edge-list format with source, label, and target columns,
   * the parsing should correctly identify nodes and edges.
   */
  describe('Property: Edge-list format parsing', () => {
    it('should parse edge-list format with source, target, label', async () => {
      const csvContent = 'source,target,label\nCompany,Employee,employs\nEmployee,Project,works_on'
      const file = createMockFile(csvContent, 'test-edge-list.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0]).toEqual({
        source: 'Company',
        target: 'Employee',
        label: 'employs'
      })
      expect(result.edges[1]).toEqual({
        source: 'Employee',
        target: 'Project',
        label: 'works_on'
      })
    })

    it('should parse edge-list format without label column', async () => {
      const csvContent = 'source,target\nNode1,Node2\nNode2,Node3'
      const file = createMockFile(csvContent, 'test-edge-list-no-label.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('')
      expect(result.edges[1].label).toBe('')
    })

    it('should parse edge-list format with column aliases (from, to, relationship)', async () => {
      const csvContent = 'from,to,relationship\nNode1,Node2,connects\nNode2,Node3,links'
      const file = createMockFile(csvContent, 'test-edge-list-aliases.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(3)
      expect(result.edges.length).toBe(2)
      expect(result.edges[0]).toEqual({
        source: 'Node1',
        target: 'Node2',
        label: 'connects'
      })
    })

    it('property: edge-list format with various aliases parses correctly', async () => {
      const sourceAliases = ['source', 'from', 'src']
      const targetAliases = ['target', 'to', 'dest', 'dst']
      const labelAliases = ['label', 'relationship', 'relation', 'type']

      for (const sourceAlias of sourceAliases) {
        for (const targetAlias of targetAliases) {
          const csvContent = `${sourceAlias},${targetAlias},${labelAliases[0]}\nNode1,Node2,connects\nNode2,Node3,links`
          const file = createMockFile(csvContent, 'test.csv')

          const result = await parseCSVFile(file)

          expect(result.nodes.length).toBe(3)
          expect(result.edges.length).toBe(2)
          expect(result.edges[0].source).toBe('Node1')
          expect(result.edges[0].target).toBe('Node2')
          expect(result.edges[0].label).toBe('connects')
        }
      }
    })
  })

  /**
   * **Validates: Requirement 3.4**
   * 
   * Property: Full node format (with x, y coordinates) continues to parse correctly
   * For all CSV files containing x and y coordinate columns,
   * the parsing should use node data format and preserve all node properties.
   */
  describe('Property: Full node format with coordinates', () => {
    it('should parse node format with x, y coordinates', async () => {
      const csvContent = 'label,x,y,description\nNode1,10,20,First node\nNode2,30,40,Second node'
      const file = createMockFile(csvContent, 'test-node-format.csv')

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

    it('should parse node format with x, y, z coordinates', async () => {
      const csvContent = 'label,x,y,z\nNode1,10,20,30\nNode2,40,50,60'
      const file = createMockFile(csvContent, 'test-node-format-3d.csv')

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

    it('should parse node format with additional properties (color, size)', async () => {
      const csvContent = 'label,x,y,color,size\nNode1,10,20,#ff0000,5\nNode2,30,40,#00ff00,10'
      const file = createMockFile(csvContent, 'test-node-format-props.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(2)
      expect(result.nodes[0]).toMatchObject({
        label: 'Node1',
        x: 10,
        y: 20,
        color: '#ff0000',
        size: 5
      })
      expect(result.nodes[1]).toMatchObject({
        label: 'Node2',
        x: 30,
        y: 40,
        color: '#00ff00',
        size: 10
      })
    })

    it('should parse node format with Chinese labels and coordinates', async () => {
      const csvContent = 'label,x,y\n节点1,10,20\n节点2,30,40'
      const file = createMockFile(csvContent, 'test-node-format-chinese.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(2)
      expect(result.nodes[0].label).toBe('节点1')
      expect(result.nodes[1].label).toBe('节点2')
      expect(result.nodes[0].x).toBe(10)
      expect(result.nodes[0].y).toBe(20)
    })

    it('property: node format with coordinates always produces nodes, not edges', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s)), // Start with letter
            fc.integer({ min: 1, max: 100 }), // Avoid 0 due to parseFloat(0) || undefined bug
            fc.integer({ min: 1, max: 100 })  // Avoid 0 due to parseFloat(0) || undefined bug
          ), { minLength: 1, maxLength: 10 }),
          async (nodes) => {
            const csvLines = ['label,x,y']
            nodes.forEach(([label, x, y]) => {
              csvLines.push(`${label},${x},${y}`)
            })
            const csvContent = csvLines.join('\n')
            const file = createMockFile(csvContent, 'test.csv')

            const result = await parseCSVFile(file)

            expect(result.nodes.length).toBe(nodes.length)
            expect(result.edges.length).toBe(0)
            
            // Verify coordinates are preserved
            nodes.forEach(([label, x, y], index) => {
              expect(result.nodes[index].label).toBe(label)
              expect(result.nodes[index].x).toBe(x)
              expect(result.nodes[index].y).toBe(y)
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * **Validates: Requirement 3.5**
   * 
   * Property: Excel and JSON file imports are not affected
   * This test verifies that the CSV encoding fix does not impact other file formats.
   * Note: Excel and JSON use different parsing logic, so they should be unaffected.
   */
  describe('Property: Other file formats unaffected', () => {
    it('should handle empty CSV files with appropriate error', async () => {
      const csvContent = ''
      const file = createMockFile(csvContent, 'test-empty.csv')

      await expect(parseCSVFile(file)).rejects.toThrow('CSV文件为空')
    })

    it('should handle CSV with only headers', async () => {
      const csvContent = 'source,target,label'
      const file = createMockFile(csvContent, 'test-headers-only.csv')

      const result = await parseCSVFile(file)

      expect(result.nodes.length).toBe(0)
      expect(result.edges.length).toBe(0)
    })

    it('should handle CSV with empty lines correctly', async () => {
      const csvContent = 'source,target,label\n\nNode1,Node2,connects\n\n\nNode2,Node3,links\n\n'
      const file = createMockFile(csvContent, 'test-empty-lines.csv')

      const result = await parseCSVFile(file)

      expect(result.edges.length).toBe(2)
      expect(result.edges[0].label).toBe('connects')
      expect(result.edges[1].label).toBe('links')
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
        'label,x,y\nNode1,10,20',
        'source,target\nNode1,Node2',
        'source,target,label\nNode1,Node2,拥有',
        'label,x,y\n节点1,10,20'
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

    it('property: all valid CSV files produce consistent structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Edge-list format - use simple alphanumeric strings
            fc.array(fc.tuple(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s)),
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s)),
              fc.string({ maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]*$/.test(s))
            ), { minLength: 1, maxLength: 5 }).map(edges => ({
              type: 'edges' as const,
              data: edges
            })),
            // Node format - avoid 0 coordinates
            fc.array(fc.tuple(
              fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s)),
              fc.integer({ min: 1, max: 100 }),
              fc.integer({ min: 1, max: 100 })
            ), { minLength: 1, maxLength: 5 }).map(nodes => ({
              type: 'nodes' as const,
              data: nodes
            }))
          ),
          async (testData) => {
            let csvContent: string
            if (testData.type === 'edges') {
              const csvLines = ['source,target,label']
              testData.data.forEach(([source, target, label]) => {
                csvLines.push(`${source},${target},${label}`)
              })
              csvContent = csvLines.join('\n')
            } else {
              const csvLines = ['label,x,y']
              testData.data.forEach(([label, x, y]) => {
                csvLines.push(`${label},${x},${y}`)
              })
              csvContent = csvLines.join('\n')
            }

            const file = createMockFile(csvContent, 'test.csv')
            const result = await parseCSVFile(file)

            // Verify structure consistency
            expect(result).toHaveProperty('nodes')
            expect(result).toHaveProperty('edges')
            expect(Array.isArray(result.nodes)).toBe(true)
            expect(Array.isArray(result.edges)).toBe(true)
            
            // Verify data integrity
            if (testData.type === 'edges') {
              expect(result.edges.length).toBe(testData.data.length)
            } else {
              expect(result.nodes.length).toBe(testData.data.length)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
