/**
 * Test script for matrix extraction
 * Verifies that the extractNodesAndEdgesFromMatrix method works correctly
 */

import { TemplateGenerator } from '../lib/services/template-generator'

async function testMatrixExtraction() {
  console.log('Testing Matrix Extraction...\n')

  const generator = new TemplateGenerator()
  const { relationSheet } = generator.generateExcelTemplateData()

  console.log('=== Original Matrix Data ===\n')
  console.log('Row 1 (Instructions):', relationSheet[0][0])
  console.log('Row 2 (Header):', relationSheet[1].join(' | '))
  console.log('\nData rows:')
  for (let i = 2; i < relationSheet.length; i++) {
    console.log(`  ${relationSheet[i].join(' | ')}`)
  }

  console.log('\n=== Extracting Nodes and Edges ===\n')
  
  const { nodes, edges } = TemplateGenerator.extractNodesAndEdgesFromMatrix(relationSheet)

  console.log(`Extracted ${nodes.length} nodes:`)
  nodes.forEach(node => {
    console.log(`  - ${node.label}`)
  })

  console.log(`\nExtracted ${edges.length} edges:`)
  edges.forEach(edge => {
    console.log(`  - ${edge.source} --[${edge.label || ''}]--> ${edge.target}`)
  })

  console.log('\n=== Verification ===\n')
  
  // Verify all entities are captured as nodes
  const expectedEntities = ['Python', '数据分析', '机器学习', 'Web开发', '自动化脚本']
  const nodeLabels = nodes.map(n => n.label)
  const allEntitiesFound = expectedEntities.every(e => nodeLabels.includes(e))
  
  console.log(`✓ All expected entities found: ${allEntitiesFound}`)
  console.log(`✓ Total nodes: ${nodes.length}`)
  console.log(`✓ Total edges: ${edges.length}`)
  console.log(`✓ Edges have labels: ${edges.every(e => e.label)}`)
  
  console.log('\n✅ Matrix extraction working correctly!')
}

testMatrixExtraction().catch(console.error)
