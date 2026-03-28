import { NextResponse } from 'next/server'

export async function GET() {
  // 临时实现：总是返回未登录状态
  // TODO: 实现真实的会话验证逻辑
  return NextResponse.json(
    {
      success: false,
      error: '未登录',
    },
    { status: 401 }
  )
}
