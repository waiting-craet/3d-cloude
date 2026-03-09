import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码', field: 'general' },
        { status: 400 }
      );
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误', field: 'general' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误', field: 'general' },
        { status: 401 }
      );
    }

    // 登录成功，返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    // 创建响应并设置cookie
    const response = NextResponse.json({
      success: true,
      user: userInfo,
      message: '登录成功'
    });

    // 设置userId cookie（HttpOnly for security）
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30天
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
