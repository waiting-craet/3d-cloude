import { NextRequest, NextResponse } from 'next/server'
import { deleteImage } from '@/lib/blob-storage'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url) {
      return NextResponse.json(
        { error: '请提供图片 URL' },
        { status: 400 }
      )
    }
    
    await deleteImage(url)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('删除失败:', error)
    return NextResponse.json(
      { error: '删除失败', details: String(error) },
      { status: 500 }
    )
  }
}
