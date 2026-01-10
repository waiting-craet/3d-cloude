import { NextResponse } from 'next/server'
import { getGraphStats } from '@/lib/db-helpers'

// 使用 Node.js Runtime（开发环境）
export const runtime = 'nodejs'

export async function GET() {
  try {
    const stats = await getGraphStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return NextResponse.json(
      { error: '获取统计信息失败', details: String(error) },
      { status: 500 }
    )
  }
}
