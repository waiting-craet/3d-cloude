import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/local-storage'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nodeId = formData.get('nodeId') as string
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    if (!nodeId) {
      return NextResponse.json({ error: '缺少节点ID' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
    }

    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件太大，${isImage ? '图片' : '视频'}最大${isImage ? '5MB' : '50MB'}` },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const relativePath = `nodes/${nodeId}/${type}-${timestamp}.${extension}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await saveFile(relativePath, buffer)

    return NextResponse.json({
      url,
      pathname: relativePath,
      contentType: file.type,
      size: file.size,
      mediaType: isImage ? 'image' : 'video',
    })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
