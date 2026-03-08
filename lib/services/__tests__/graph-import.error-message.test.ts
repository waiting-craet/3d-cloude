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

describe('parseCSVWithEdgeData - Error Message Improvement', () => {
  it('should include actual column names in error message when source/target columns are missing', async () => {
    // CSV with invalid column names (no source/target)
    const csvContent = 'Name,Description,Type\nNode1,Desc1,TypeA\nNode2,Desc2,TypeB'
    const file = createMockFile(csvContent, 'test.csv')
    
    await expect(parseCSVFile(file)).rejects.toThrow(
      'CSV文件必须包含source和target列。找到的列：name, description, type'
    )
  })

  it('should include actual column names when only source is missing', async () => {
    const csvContent = 'target,label\nNode1,Label1\nNode2,Label2'
    const file = createMockFile(csvContent, 'test.csv')
    
    await expect(parseCSVFile(file)).rejects.toThrow(
      'CSV文件必须包含source和target列。找到的列：target, label'
    )
  })

  it('should include actual column names when only target is missing', async () => {
    const csvContent = 'source,label\nNode1,Label1\nNode2,Label2'
    const file = createMockFile(csvContent, 'test.csv')
    
    await expect(parseCSVFile(file)).rejects.toThrow(
      'CSV文件必须包含source和target列。找到的列：source, label'
    )
  })

  it('should not throw error when valid source/target columns exist', async () => {
    const csvContent = 'source,target,label\nNode1,Node2,connects'
    const file = createMockFile(csvContent, 'test.csv')
    
    await expect(parseCSVFile(file)).resolves.not.toThrow()
  })

  it('should not throw error when valid aliases are used', async () => {
    const csvContent = 'from,to,relationship\nNode1,Node2,connects'
    const file = createMockFile(csvContent, 'test.csv')
    
    await expect(parseCSVFile(file)).resolves.not.toThrow()
  })
})
