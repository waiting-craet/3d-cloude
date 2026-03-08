/**
 * Bug Condition Exploration Test for CSV Chinese Column Names
 * 
 * Feature: csv-chinese-column-names-fix
 * Property 1: Fault Condition - CSV中文列名无法被识别
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
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
  
  // Add arrayBuffer() method for encoding detection
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = async () => {
      const encoder = new TextEncoder()
      return encoder.encode(content).buffer
    }
  }
  
  return file
}

describe('CSV Chinese Column Names - Bug Condition Exploration', () => {
  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * This test demonstrates the bug where CSV files with Chinese source column names
   * fail to parse. The system should recognize "源节点", "起点", "来源" as source columns.
   * 
   * Expected behavior: CSV with Chinese source column should parse successfully
   * Current behavior (unfixed): Throws error "CSV文件必须包含source和target列"
   */

  it('should parse CSV with Chinese source column "源节点"', async () => {
    const csvContent = '源节点,target,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese source column "起点"', async () => {
    const csvContent = '起点,target,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese source column "来源"', async () => {
    const csvContent = '来源,target,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  /**
   * **Validates: Requirements 1.2, 2.2**
   * 
   * This test demonstrates the bug where CSV files with Chinese target column names
   * fail to parse. The system should recognize "目标节点", "终点", "目的地" as target columns.
   * 
   * Expected behavior: CSV with Chinese target column should parse successfully
   * Current behavior (unfixed): Throws error "CSV文件必须包含source和target列"
   */

  it('should parse CSV with Chinese target column "目标节点"', async () => {
    const csvContent = 'source,目标节点,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese target column "终点"', async () => {
    const csvContent = 'source,终点,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese target column "目的地"', async () => {
    const csvContent = 'source,目的地,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  /**
   * **Validates: Requirements 1.3, 2.3**
   * 
   * This test demonstrates the bug where CSV files with Chinese label column names
   * fail to be recognized. The system should recognize "关系", "关系类型", "边类型", "连接类型" as label columns.
   * 
   * Expected behavior: CSV with Chinese label column should parse successfully with correct labels
   * Current behavior (unfixed): Label column not recognized, all labels default to empty string
   */

  it('should parse CSV with Chinese label column "关系"', async () => {
    const csvContent = 'source,target,关系\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese label column "关系类型"', async () => {
    const csvContent = 'source,target,关系类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese label column "边类型"', async () => {
    const csvContent = 'source,target,边类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with Chinese label column "连接类型"', async () => {
    const csvContent = 'source,target,连接类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * This test demonstrates the bug where CSV files with all Chinese column names
   * fail to parse. The system should recognize all Chinese column names together.
   * 
   * Expected behavior: CSV with all Chinese columns should parse successfully
   * Current behavior (unfixed): Throws error showing Chinese column names but cannot recognize them
   */

  it('should parse CSV with all Chinese columns "源节点,目标节点,关系"', async () => {
    const csvContent = '源节点,目标节点,关系\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with all Chinese columns "起点,终点,关系类型"', async () => {
    const csvContent = '起点,终点,关系类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with all Chinese columns "来源,目的地,边类型"', async () => {
    const csvContent = '来源,目的地,边类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  /**
   * **Validates: Requirement 2.5**
   * 
   * This test demonstrates the bug where CSV files with mixed Chinese and English column names
   * fail to parse. The system should recognize both Chinese and English column names.
   * 
   * Expected behavior: CSV with mixed Chinese/English columns should parse successfully
   * Current behavior (unfixed): Throws error when any column is Chinese
   */

  it('should parse CSV with mixed Chinese/English columns "源节点,target,关系"', async () => {
    const csvContent = '源节点,target,关系\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with mixed Chinese/English columns "source,目标节点,label"', async () => {
    const csvContent = 'source,目标节点,label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with mixed Chinese/English columns "起点,to,关系类型"', async () => {
    const csvContent = '起点,to,关系类型\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  /**
   * **Property-Based Test: Chinese Column Names Recognition**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * Property: For all CSV inputs with Chinese column names, the system should
   * successfully parse the data and create valid nodes and edges.
   * 
   * This property test generates random combinations of Chinese column names
   * and verifies they are all recognized correctly.
   */

  it('property: all Chinese column name combinations should be recognized', async () => {
    const sourceAliases = ['源节点', '起点', '来源']
    const targetAliases = ['目标节点', '终点', '目的地']
    const labelAliases = ['关系', '关系类型', '边类型', '连接类型']

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
      { numRuns: 20 }
    )
  })

  /**
   * **Property-Based Test: Mixed Chinese/English Column Names**
   * **Validates: Requirement 2.5**
   * 
   * Property: For all CSV inputs with mixed Chinese and English column names,
   * the system should successfully parse the data.
   */

  it('property: mixed Chinese/English column names should be recognized', async () => {
    const sourceAliases = ['source', 'from', 'src', '源节点', '起点', '来源']
    const targetAliases = ['target', 'to', 'dest', 'dst', '目标节点', '终点', '目的地']
    const labelAliases = ['label', 'relationship', 'relation', 'type', '关系', '关系类型', '边类型', '连接类型']

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...sourceAliases),
        fc.constantFrom(...targetAliases),
        fc.constantFrom(...labelAliases),
        fc.array(fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes(',') && !s.includes('\n') && !s.includes('"'))
        ), { minLength: 1, maxLength: 5 }),
        async (sourceAlias, targetAlias, labelAlias, edges) => {
          const csvLines = [`${sourceAlias},${targetAlias},${labelAlias}`]
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
