import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url) {
      return NextResponse.json(
        { error: '未提供图片 URL' },
        { status: 400 }
      )
    }
    
    // 删除 Blob 中的文件
    await del(url)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('删除文件失败:', error)
    return NextResponse.json(
      { error: '删除文件失败', details: String(error) },
      { status: 500 }
    )
  }
}
