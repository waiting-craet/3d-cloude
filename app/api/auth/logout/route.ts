import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 临时实现：简单返回成功
    // TODO: 实现真实的会话清除逻辑
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '登出失败，请稍后重试',
      },
      { status: 500 }
    )
  }
}
