import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    });

    // 清除userId cookie
    response.cookies.delete('userId');

    return response;
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
