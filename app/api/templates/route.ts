import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { TemplateGenerator } from '@/lib/services/template-generator'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'excel' // 'json', 'csv', 'excel'

  try {
    const generator = new TemplateGenerator()

    switch (format) {
      case 'json': {
        const jsonTemplate = generator.generateJSONTemplate()
        return new NextResponse(jsonTemplate, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="3d-graph-template.json"',
          },
        })
      }

      case 'csv': {
        const csvTemplate = generator.generateCSVTemplate()
        return new NextResponse(csvTemplate, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="3d-graph-template.csv"',
          },
        })
      }

      case 'excel': {
        // Create workbook
        const wb = XLSX.utils.book_new()

        // Generate template data using TemplateGenerator
        const { relationSheet, instructionSheet } = generator.generateExcelTemplateData()

        // Add relation data sheet (triplet format)
        const relationWs = XLSX.utils.aoa_to_sheet(relationSheet)
        XLSX.utils.book_append_sheet(wb, relationWs, '关系数据')

        // Add instruction sheet
        const instructionWs = XLSX.utils.aoa_to_sheet(instructionSheet)
        XLSX.utils.book_append_sheet(wb, instructionWs, '使用说明')

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="3d-graph-template.xlsx"',
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
