import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: '请输入用户名' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: '请输入密码' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少需要 6 个字符' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE username = ${username} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: '用户名已被使用' },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 生成唯一 ID
    const userId = createId();

    // 插入新用户
    await prisma.$executeRaw`
      INSERT INTO "User" (id, username, password, "createdAt", "updatedAt")
      VALUES (${userId}, ${username}, ${hashedPassword}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    // 返回用户信息（不含密码）
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: username,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
