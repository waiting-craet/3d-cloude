import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { TemplateGenerator } from '@/lib/services/template-generator'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'excel' // 'json', 'csv', 'excel'

  try {
    const generator = new TemplateGenerator()
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    switch (format) {
      case 'json': {
        const jsonTemplate = generator.generateJSONTemplate()
        return new NextResponse(jsonTemplate, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="graph-template-edgelist-v2-${timestamp}.json"`,
          },
        })
      }

      case 'csv': {
        const csvTemplate = generator.generateCSVTemplate()
        return new NextResponse(csvTemplate, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="graph-template-edgelist-v2-${timestamp}.csv"`,
          },
        })
      }

      case 'excel': {
        // Create workbook
        const wb = XLSX.utils.book_new()

        // Generate edge-list template data using TemplateGenerator
        const { edgeSheet, instructionSheet } = generator.generateExcelEdgeListTemplateData()

        // Add edge data sheet (edge-list format)
        const edgeWs = XLSX.utils.aoa_to_sheet(edgeSheet)
        XLSX.utils.book_append_sheet(wb, edgeWs, '边数据')

        // Add instruction sheet
        const instructionWs = XLSX.utils.aoa_to_sheet(instructionSheet)
        XLSX.utils.book_append_sheet(wb, instructionWs, '使用说明')

        // Add metadata to workbook
        wb.Props = {
          Title: '知识图谱导入模板 - 边列表格式',
          Subject: '3D知识图谱数据导入',
          Author: '系统自动生成',
          CreatedDate: new Date()
        }

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="graph-template-edgelist-v2-${timestamp}.xlsx"`,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid format. Supported formats: json, csv, excel' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
