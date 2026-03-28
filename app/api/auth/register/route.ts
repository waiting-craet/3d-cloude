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
        { success: false, error: '请填写用户名和密码', field: 'general' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (username.length < 2 || username.length > 30) {
      return NextResponse.json(
        { success: false, error: '用户名长度应在2-30个字符之间', field: 'username' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: '密码长度应在6-128个字符之间', field: 'password' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该用户名已被使用', field: 'username' },
        { status: 409 }
      );
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 生成默认邮箱
    const email = `${username}@example.com`;

    // 插入新用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt
    };

    // 创建响应并设置cookie
    const response = NextResponse.json({
      success: true,
      user: userInfo,
      message: '注册成功'
    });

    // 设置userId cookie（HttpOnly for security）
    response.cookies.set('userId', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30天
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
