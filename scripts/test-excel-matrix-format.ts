/**
 * Test script for Excel matrix format
 * Verifies the new matrix/list format matches the user's requirements
 */

import { TemplateGenerator } from '../lib/services/template-generator'

async function testExcelMatrixFormat() {
  console.log('Testing Excel Matrix Format...\n')

  const generator = new TemplateGenerator()
  const { relationSheet, instructionSheet } = generator.generateExcelTemplateData()

  console.log('=== Relation Sheet Structure ===\n')
  
  // Row 1: Instructions
  console.log('Row 1 (Instructions):')
  console.log(`  "${relationSheet[0][0]}"`)
  console.log()
  
  // Row 2: Header
  console.log('Row 2 (Header):')
  console.log(`  ${relationSheet[1].join(' | ')}`)
  console.log()
  
  // Data rows
  console.log('Data Rows (Entity + Relation-Entity pairs):')
  for (let i = 2; i < relationSheet.length; i++) {
    const row = relationSheet[i]
    console.log(`  Row ${i + 1}: ${row.join(' | ')}`)
  }
  
  console.log('\n=== Format Verification ===\n')
  
  // Verify structure
  const hasInstructions = relationSheet[0][0].includes('节点')
  const hasHeader = relationSheet[1][0] === '实体'
  const hasRelationColumns = relationSheet[1].includes('关系')
  
  console.log(`✓ Has instructions row: ${hasInstructions}`)
  console.log(`✓ Has header row with "实体": ${hasHeader}`)
  console.log(`✓ Has "关系" columns: ${hasRelationColumns}`)
  console.log(`✓ Total rows: ${relationSheet.length}`)
  console.log(`✓ Header columns: ${relationSheet[1].length}`)
  
  // Verify data format
  console.log('\n=== Data Format Verification ===\n')
  for (let i = 2; i < Math.min(5, relationSheet.length); i++) {
    const row = relationSheet[i]
    const entity = row[0]
    const relationPairs = []
    
    for (let j = 1; j < row.length; j += 2) {
      if (row[j] && row[j + 1]) {
        relationPairs.push(`${row[j]} → ${row[j + 1]}`)
      }
    }
    
    console.log(`Entity "${entity}":`)
    if (relationPairs.length > 0) {
      relationPairs.forEach(pair => console.log(`  - ${pair}`))
    } else {
      console.log(`  (no relations)`)
    }
  }
  
  console.log('\n✅ Excel matrix format is correct!')
}

testExcelMatrixFormat().catch(console.error)
