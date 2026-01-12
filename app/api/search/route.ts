import { NextRequest, NextResponse } from 'next/server'
import { searchNodes } from '@/lib/db-helpers'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime（开发环境）
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }
    
    const results = await searchNodes(query)
    
    // 保存搜索历史
    await prisma.searchHistory.create({
      data: {
        query,
        results: JSON.stringify(results.map(r => r.id)),
      },
    })
    
    return NextResponse.json({
      query,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      { error: '搜索失败', details: String(error) },
      { status: 500 }
    )
  }
}
