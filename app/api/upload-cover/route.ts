import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/local-storage'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityId = formData.get('entityId') as string
    const entityType = formData.get('entityType') as string

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    if (!entityId || !entityType) {
      return NextResponse.json({ error: '缺少实体ID或类型' }, { status: 400 })
    }

    if (entityType !== 'project' && entityType !== 'graph') {
      return NextResponse.json({ error: '无效的实体类型' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片上传作为封面' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片太大，最大支持 5MB' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const relativePath = `covers/${entityType}s/${entityId}/cover-${timestamp}.${extension}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await saveFile(relativePath, buffer)

    // 更新数据库中的 coverUrl
    if (entityType === 'project') {
      await prisma.project.update({
        where: { id: entityId },
        data: { coverUrl: url }
      })
    } else if (entityType === 'graph') {
      await prisma.graph.update({
        where: { id: entityId },
        data: { coverUrl: url }
      })
    }

    return NextResponse.json({
      url,
      pathname: relativePath,
      success: true,
      message: '封面上传成功'
    })
  } catch (error) {
    console.error('上传封面失败:', error)
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}