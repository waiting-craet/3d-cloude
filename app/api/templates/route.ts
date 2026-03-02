import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') // 'excel'

  if (format !== 'excel') {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }

  try {
    // Create workbook
    const wb = XLSX.utils.book_new()

    // 简化的3D Graph Template - Nodes sheet (只需填写必要信息)
    const nodesData = [
      ['label', 'description'],
      ['Python', '一种简单易学的编程语言'],
      ['数据分析', '使用数据发现规律和洞察'],
      ['机器学习', '让计算机从数据中学习'],
      ['Web开发', '构建网站和Web应用'],
      ['自动化脚本', '自动化重复性任务'],
    ]
    const nodesSheet = XLSX.utils.aoa_to_sheet(nodesData)
    XLSX.utils.book_append_sheet(wb, nodesSheet, 'Nodes')

    // 简化的3D Graph Template - Edges sheet
    const edgesData = [
      ['source', 'target', 'label'],
      ['Python', '数据分析', '应用于'],
      ['Python', '机器学习', '应用于'],
      ['Python', 'Web开发', '应用于'],
      ['Python', '自动化脚本', '应用于'],
      ['数据分析', '机器学习', '支撑'],
    ]
    const edgesSheet = XLSX.utils.aoa_to_sheet(edgesData)
    XLSX.utils.book_append_sheet(wb, edgesSheet, 'Edges')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return file - 固定为3D模板
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="3d-graph-template.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
