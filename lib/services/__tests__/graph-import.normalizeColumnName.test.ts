import { describe, it, expect } from '@jest/globals'
import { normalizeColumnName } from '../graph-import'

describe('normalizeColumnName', () => {
  it('should remove BOM marker from start of string', () => {
    const result = normalizeColumnName('\uFEFFSource')
    expect(result).toBe('source')
  })

  it('should handle whitespace correctly', () => {
    const result = normalizeColumnName(' Source ')
    expect(result).toBe('source')
  })

  it('should remove invisible characters (zero-width space)', () => {
    const result = normalizeColumnName('Source\u200B')
    expect(result).toBe('source')
  })

  it('should convert uppercase to lowercase', () => {
    const result = normalizeColumnName('SOURCE')
    expect(result).toBe('source')
  })

  it('should replace multiple spaces with single space', () => {
    const result = normalizeColumnName('Source  Name')
    expect(result).toBe('source name')
  })

  it('should handle standard input without changes', () => {
    const result = normalizeColumnName('source')
    expect(result).toBe('source')
  })

  // Additional edge cases for comprehensive coverage
  it('should handle combination of BOM, whitespace, and case', () => {
    const result = normalizeColumnName('\uFEFF  SOURCE  ')
    expect(result).toBe('source')
  })

  it('should handle multiple invisible characters', () => {
    const result = normalizeColumnName('Source\u200B\u200C\u200D')
    expect(result).toBe('source')
  })

  it('should handle mixed case with spaces', () => {
    const result = normalizeColumnName('  Source   Name  ')
    expect(result).toBe('source name')
  })

  it('should handle all edge cases combined', () => {
    const result = normalizeColumnName('\uFEFF  SOURCE  \u200B  NAME  \u200C')
    expect(result).toBe('source name')
  })
})
