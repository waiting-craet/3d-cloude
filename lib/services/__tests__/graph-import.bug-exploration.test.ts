/**
 * Bug Condition Exploration Test for CSV Import Column Validation
 * 
 * Feature: csv-import-column-validation-fix
 * Property 1: Fault Condition - CSV列名规范化失败导致匹配错误
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 */

import { describe, it, expect } from '@jest/globals'
import { parseCSVFile } from '../graph-import'

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

describe('CSV Import Column Validation - Bug Condition Exploration', () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
   * 
   * This test demonstrates the bug where CSV files with valid column names
   * fail to parse due to:
   * - BOM (Byte Order Mark) at the start of the file
   * - Extra whitespace around column names
   * - Invisible Unicode characters (zero-width spaces)
   * - Case variations (uppercase, mixed case)
   * - Alias variations with different cases
   * 
   * Expected behavior: All these CSV files should parse successfully
   * Current behavior (unfixed): These CSV files throw errors
   */

  it('should parse CSV with BOM marker at start', async () => {
    // CSV content with UTF-8 BOM marker
    const csvContent = '\uFEFFSource,Target,Label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with extra whitespace around column names', async () => {
    // CSV content with spaces around column names
    const csvContent = ' Source , Target , Label \nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with invisible zero-width characters', async () => {
    // CSV content with zero-width space (U+200B) after column names
    const csvContent = 'Source\u200B,Target\u200B,Label\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with uppercase column names', async () => {
    // CSV content with all uppercase column names
    const csvContent = 'SOURCE,TARGET,LABEL\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with mixed case alias column names', async () => {
    // CSV content with mixed case aliases (FROM, TO, Type)
    const csvContent = 'FROM,TO,Type\nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with combination of BOM and extra whitespace', async () => {
    // CSV content with both BOM and extra whitespace
    const csvContent = '\uFEFF Source , Target , Label \nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })

  it('should parse CSV with uppercase aliases and whitespace', async () => {
    // CSV content with uppercase aliases and extra spaces
    const csvContent = ' FROM , TO , RELATIONSHIP \nNode1,Node2,connects\nNode2,Node3,links'
    const file = createMockFile(csvContent, 'test.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.edges).toEqual([
      { source: 'Node1', target: 'Node2', label: 'connects' },
      { source: 'Node2', target: 'Node3', label: 'links' }
    ])
  })
})
