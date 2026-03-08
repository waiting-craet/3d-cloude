/**
 * Bug Condition Exploration Test for CSV Encoding
 * 
 * Feature: csv-encoding-fix
 * Property 1: Fault Condition - 非UTF-8编码CSV文件解码失败
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 */

import { describe, it, expect } from '@jest/globals'
import { parseCSVFile } from '../graph-import'
import { TextDecoder, TextEncoder } from 'util'
import * as iconv from 'iconv-lite'

// Helper to create a File-like object with specific encoding
function createEncodedFile(content: string, encoding: string, filename: string): File {
  let uint8Array: Uint8Array
  
  if (encoding === 'UTF-8') {
    // UTF-8 encoding
    const encoder = new TextEncoder()
    uint8Array = encoder.encode(content)
  } else {
    // Use iconv-lite for other encodings
    const buffer = iconv.encode(content, encoding)
    uint8Array = new Uint8Array(buffer)
  }
  
  const blob = new Blob([uint8Array], { type: 'text/csv' })
  const file = new File([blob], filename, { type: 'text/csv' })
  
  // Add text() method for Node.js environment
  // This simulates the bug: file.text() always decodes as UTF-8
  if (!file.text) {
    (file as any).text = async () => {
      // Simulate UTF-8 decoding (which causes garbled text for non-UTF-8 files)
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(uint8Array)
    }
  }
  
  // Add arrayBuffer() method for Node.js environment
  // This is needed for the fixed code to read raw bytes
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = async () => {
      return uint8Array.buffer
    }
  }
  
  return file
}

describe('CSV Encoding - Bug Condition Exploration', () => {
  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * This test demonstrates the bug where CSV files with GBK encoding containing
   * Chinese characters (like "拥有") are decoded incorrectly, resulting in garbled text.
   * 
   * Expected behavior: CSV with GBK encoding should decode correctly, showing "拥有"
   * Current behavior (unfixed): Produces garbled text like "4???" or similar
   */

  it('should correctly decode GBK encoded CSV with Chinese characters "拥有"', async () => {
    const csvContent = 'source,target,label\nNode1,Node2,拥有\nNode2,Node3,拥有'
    const file = createEncodedFile(csvContent, 'GBK', 'test-gbk.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    
    // The key assertion: Chinese characters should be decoded correctly
    expect(result.edges[0].label).toBe('拥有')
    expect(result.edges[1].label).toBe('拥有')
    
    // Verify no garbled text (common patterns: ???, �, or random characters)
    expect(result.edges[0].label).not.toMatch(/\?/)
    expect(result.edges[0].label).not.toMatch(/�/)
    expect(result.edges[0].label).not.toMatch(/[^\u4e00-\u9fa5\w\s]/) // Should only contain Chinese/alphanumeric
  })

  /**
   * **Validates: Requirements 1.2, 2.2**
   * 
   * This test demonstrates the bug where CSV files with GB2312 encoding containing
   * Chinese characters (like "关系") are decoded incorrectly.
   * 
   * Expected behavior: CSV with GB2312 encoding should decode correctly, showing "关系"
   * Current behavior (unfixed): Produces garbled text
   */

  it('should correctly decode GB2312 encoded CSV with Chinese characters "关系"', async () => {
    const csvContent = 'source,target,label\nNode1,Node2,关系\nNode2,Node3,关系'
    const file = createEncodedFile(csvContent, 'GB2312', 'test-gb2312.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    
    // The key assertion: Chinese characters should be decoded correctly
    expect(result.edges[0].label).toBe('关系')
    expect(result.edges[1].label).toBe('关系')
    
    // Verify no garbled text
    expect(result.edges[0].label).not.toMatch(/\?/)
    expect(result.edges[0].label).not.toMatch(/�/)
  })

  /**
   * **Validates: Requirements 1.3, 2.3**
   * 
   * This test demonstrates the bug where CSV files with Big5 encoding containing
   * Traditional Chinese characters (like "擁有") are decoded incorrectly.
   * 
   * Expected behavior: CSV with Big5 encoding should decode correctly, showing "擁有"
   * Current behavior (unfixed): Produces garbled text
   */

  it('should correctly decode Big5 encoded CSV with Traditional Chinese "擁有"', async () => {
    const csvContent = 'source,target,label\nNode1,Node2,擁有\nNode2,Node3,擁有'
    const file = createEncodedFile(csvContent, 'Big5', 'test-big5.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    
    // The key assertion: Traditional Chinese characters should be decoded correctly
    expect(result.edges[0].label).toBe('擁有')
    expect(result.edges[1].label).toBe('擁有')
    
    // Verify no garbled text
    expect(result.edges[0].label).not.toMatch(/\?/)
    expect(result.edges[0].label).not.toMatch(/�/)
  })

  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * This test demonstrates the bug with mixed content (English + Chinese) in GBK encoding.
   * 
   * Expected behavior: Both English and Chinese should decode correctly
   * Current behavior (unfixed): Chinese characters produce garbled text
   */

  it('should correctly decode GBK encoded CSV with mixed English and Chinese content', async () => {
    const csvContent = 'source,target,label\nCompany,Person,拥有\nPerson,Asset,拥有'
    const file = createEncodedFile(csvContent, 'GBK', 'test-mixed-gbk.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    
    // English node names should be correct
    expect(result.edges[0].source).toBe('Company')
    expect(result.edges[0].target).toBe('Person')
    
    // Chinese label should be decoded correctly
    expect(result.edges[0].label).toBe('拥有')
    expect(result.edges[1].label).toBe('拥有')
  })

  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * This test demonstrates the bug with Chinese characters in node names (not just labels).
   * 
   * Expected behavior: Chinese node names should decode correctly
   * Current behavior (unfixed): Chinese node names produce garbled text
   */

  it('should correctly decode GBK encoded CSV with Chinese node names', async () => {
    const csvContent = 'source,target,label\n公司,员工,拥有\n员工,资产,拥有'
    const file = createEncodedFile(csvContent, 'GBK', 'test-chinese-nodes-gbk.csv')

    const result = await parseCSVFile(file)

    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBe(2)
    
    // Chinese node names should be decoded correctly
    expect(result.edges[0].source).toBe('公司')
    expect(result.edges[0].target).toBe('员工')
    expect(result.edges[0].label).toBe('拥有')
    
    expect(result.edges[1].source).toBe('员工')
    expect(result.edges[1].target).toBe('资产')
    expect(result.edges[1].label).toBe('拥有')
  })
})
