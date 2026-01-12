import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nodeId = formData.get('nodeId') as string
    const type = formData.get('type') as string // 'thumbnail' 或 'attachment'
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，仅支持 JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }
    
    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小超过限制（最大 5MB）' },
        { status: 400 }
      )
    }
    
    // 构建文件路径
    const timestamp = Date.now()
    const filename = nodeId 
      ? `nodes/${nodeId}/${type || 'image'}-${timestamp}-${file.name}`
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
    }, { status: 201 })
    
  } catch (error) {
    console.error('上传文件失败:', error)
    return NextResponse.json(
      { error: '上传文件失败', details: String(error) },
      { status: 500 }
    )
  }
}
