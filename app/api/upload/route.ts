import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * 上传媒体文件到 Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    // 检查是否配置了 Blob token
    console.log('🔍 检查 BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '已配置' : '未配置')
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN 未配置')
      return NextResponse.json(
        { 
          error: '未配置 Vercel Blob 存储',
          message: '请在 .env 文件中添加 BLOB_READ_WRITE_TOKEN 环境变量。\n查看 VERCEL-BLOB-SETUP.md 了解配置方法。'
        },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const nodeId = formData.get('nodeId') as string
    const type = formData.get('type') as string

    console.log('📦 接收到上传请求:', { 
      fileName: file?.name, 
      fileSize: file?.size,
      fileType: file?.type,
      nodeId, 
      type 
    })

    if (!file) {
      return NextResponse.json(
        { error: '没有文件' },
        { status: 400 }
      )
    }

    if (!nodeId) {
      return NextResponse.json(
        { error: '缺少节点ID' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 验证文件大小
    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件太大，${isImage ? '图片' : '视频'}最大${isImage ? '5MB' : '50MB'}` },
        { status: 400 }
      )
    }

    // 生成文件名
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `nodes/${nodeId}/${type}-${timestamp}.${extension}`

    // 上传到 Vercel Blob
    console.log('⬆️ 开始上传到 Vercel Blob:', filename)
    const blob = await put(filename, file, {
      access: 'public',
    })
    console.log('✅ 上传成功:', blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      mediaType: isImage ? 'image' : 'video',
    })

  } catch (error) {
    console.error('❌ 上传失败:', error)
    console.error('错误详情:', error instanceof Error ? error.stack : error)
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
