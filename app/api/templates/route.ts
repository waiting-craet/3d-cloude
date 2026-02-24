import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') // '2d' or '3d'
  const format = searchParams.get('format') // 'excel'

  if (format !== 'excel') {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }

  try {
    // Create workbook
    const wb = XLSX.utils.book_new()

    if (type === '3d') {
      // 3D Graph Template - Nodes sheet
      const nodesData = [
        ['id', 'label', 'description', 'x', 'y', 'z', 'color', 'size', 'shape'],
        ['node1', '中心节点', '这是中心节点的描述', 0, 0, 0, '#00bfa5', 1.5, 'sphere'],
        ['node2', '技术节点', '这是技术节点的描述', 100, 0, 0, '#ff6b6b', 1, 'sphere'],
        ['node3', '业务节点', '这是业务节点的描述', 0, 100, 0, '#4ecdc4', 1, 'sphere'],
        ['node4', '开发节点', '这是开发节点的描述', 0, 0, 100, '#ffe66d', 1, 'sphere'],
        ['node5', '测试节点', '这是测试节点的描述', 50, 50, 50, '#a8e6cf', 0.8, 'sphere'],
      ]
      const nodesSheet = XLSX.utils.aoa_to_sheet(nodesData)
      XLSX.utils.book_append_sheet(wb, nodesSheet, 'Nodes')

      // 3D Graph Template - Edges sheet
      const edgesData = [
        ['source', 'target', 'label'],
        ['node1', 'node2', '技术关系'],
        ['node1', 'node3', '业务关系'],
        ['node1', 'node4', '开发关系'],
        ['node2', 'node4', '技术开发'],
        ['node4', 'node5', '开发测试'],
      ]
      const edgesSheet = XLSX.utils.aoa_to_sheet(edgesData)
      XLSX.utils.book_append_sheet(wb, edgesSheet, 'Edges')
    } else {
      // 2D Graph Template - Nodes sheet
      const nodesData = [
        ['id', 'label', 'description', 'x', 'y', 'color', 'size', 'shape'],
        ['node1', '节点A', '这是节点A的描述', 100, 100, '#00bfa5', 1, 'sphere'],
        ['node2', '节点B', '这是节点B的描述', 300, 100, '#ff6b6b', 1.2, 'sphere'],
        ['node3', '节点C', '这是节点C的描述', 200, 300, '#4ecdc4', 1, 'sphere'],
        ['node4', '节点D', '这是节点D的描述', 400, 250, '#ffe66d', 0.8, 'sphere'],
      ]
      const nodesSheet = XLSX.utils.aoa_to_sheet(nodesData)
      XLSX.utils.book_append_sheet(wb, nodesSheet, 'Nodes')

      // 2D Graph Template - Edges sheet
      const edgesData = [
        ['source', 'target', 'label'],
        ['node1', 'node2', '关系1'],
        ['node2', 'node3', '关系2'],
        ['node1', 'node3', '关系3'],
        ['node3', 'node4', '关系4'],
      ]
      const edgesSheet = XLSX.utils.aoa_to_sheet(edgesData)
      XLSX.utils.book_append_sheet(wb, edgesSheet, 'Edges')
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}-graph-template.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
