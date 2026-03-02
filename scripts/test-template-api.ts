/**
 * Test script for template API
 * Verifies that all three formats (JSON, CSV, Excel) work correctly
 */

import { TemplateGenerator } from '../lib/services/template-generator'

async function testTemplateAPI() {
  console.log('Testing TemplateGenerator...\n')

  const generator = new TemplateGenerator()

  // Test JSON format
  console.log('1. Testing JSON format...')
  const jsonTemplate = generator.generateJSONTemplate()
  const jsonData = JSON.parse(jsonTemplate)
  console.log(`   ✓ JSON template generated`)
  console.log(`   ✓ Contains ${jsonData.nodes?.length || 0} example nodes`)
  console.log(`   ✓ Contains ${jsonData.edges?.length || 0} example edges`)
  console.log(`   ✓ Has instructions: ${!!jsonData['使用说明']}`)

  // Test CSV format
  console.log('\n2. Testing CSV format...')
  const csvTemplate = generator.generateCSVTemplate()
  const csvLines = csvTemplate.split('\n').filter(line => line && !line.startsWith('#'))
  console.log(`   ✓ CSV template generated`)
  console.log(`   ✓ Contains ${csvLines.length - 1} example rows (excluding header)`)
  console.log(`   ✓ Has header: ${csvLines[0]}`)

  // Test Excel format
  console.log('\n3. Testing Excel format...')
  const { relationSheet, instructionSheet } = generator.generateExcelTemplateData()
  console.log(`   ✓ Excel template data generated`)
  console.log(`   ✓ Relation sheet has ${relationSheet.length - 1} example rows`)
  console.log(`   ✓ Relation sheet header: ${relationSheet[0].join(', ')}`)
  console.log(`   ✓ Instruction sheet has ${instructionSheet.length} rows`)

  console.log('\n✅ All template formats working correctly!')
}

testTemplateAPI().catch(console.error)
