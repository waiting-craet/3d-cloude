import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * 从 Vercel Blob 删除媒体文件
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: '缺少文件URL' },
        { status: 400 }
      )
    }

    // 从 Vercel Blob 删除文件
    await del(url)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('删除失败:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
