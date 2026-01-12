import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nodeId = formData.get('nodeId') as string
    const type = formData.get('type') as string // 'thumbnail', 'attachment', 'image', 'video'
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }
    
    // 验证文件类型
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: '不支持的文件类型，仅支持图片和视频' },
        { status: 400 }
      )
    }
    
    // 验证文件大小（图片最大 5MB，视频最大 50MB）
    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件大小超过限制（${isImage ? '最大 5MB' : '最大 50MB'}）` },
        { status: 400 }
      )
    }
    
    // 构建文件路径
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = nodeId 
      ? `nodes/${nodeId}/${type || 'media'}-${timestamp}.${fileExtension}`
      : `uploads/${timestamp}-${file.name}`
    
    // 上传到 Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })
    
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      mediaType: isImage ? 'image' : 'video',
    }, { status: 201 })
    
  } catch (error) {
    console.error('上传文件失败:', error)
    return NextResponse.json(
      { error: '上传文件失败', details: String(error) },
      { status: 500 }
    )
  }
}
