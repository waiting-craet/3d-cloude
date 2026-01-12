import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/blob-storage'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'node' | 'document' | 'general'
    const id = formData.get('id') as string // 节点或文档的 ID
    
    if (!file) {
      return NextResponse.json(
        { error: '请提供文件' },
        { status: 400 }
      )
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持 JPEG、PNG、GIF 和 WebP 格式的图片' },
        { status: 400 }
      )
    }
    
    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过 5MB' },
        { status: 400 }
      )
    }
    
    // 构建文件名
    let filename = file.name
    if (type && id) {
      const extension = file.name.split('.').pop()
      filename = `${type}/${id}/${Date.now()}.${extension}`
    }
    
    // 上传到 Vercel Blob
    const url = await uploadImage(file, filename)
    
    return NextResponse.json({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, { status: 201 })
    
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: '上传失败', details: String(error) },
      { status: 500 }
    )
  }
}
