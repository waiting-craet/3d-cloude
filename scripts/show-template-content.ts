/**
 * Display the content of all three template formats
 */

import { TemplateGenerator } from '../lib/services/template-generator'

async function showTemplateContent() {
  console.log('=== TEMPLATE CONTENT PREVIEW ===\n')

  const generator = new TemplateGenerator()

  // Excel format
  console.log('1. EXCEL FORMAT')
  console.log('===============\n')
  const { relationSheet } = generator.generateExcelTemplateData()
  console.log('关系数据工作表:')
  relationSheet.forEach((row, index) => {
    console.log(`Row ${index + 1}: ${row.join(' | ')}`)
  })

  // CSV format
  console.log('\n\n2. CSV FORMAT')
  console.log('=============\n')
  const csvTemplate = generator.generateCSVTemplate()
  console.log(csvTemplate)

  // JSON format
  console.log('\n3. JSON FORMAT')
  console.log('==============\n')
  const jsonTemplate = generator.generateJSONTemplate()
  const jsonData = JSON.parse(jsonTemplate)
  console.log('使用说明:')
  console.log(JSON.stringify(jsonData['使用说明'], null, 2))
  console.log('\n节点:')
  console.log(JSON.stringify(jsonData.nodes, null, 2))
  console.log('\n边:')
  console.log(JSON.stringify(jsonData.edges, null, 2))

  console.log('\n\n✅ All templates are clean and ready for users to fill in!')
}

showTemplateContent().catch(console.error)
