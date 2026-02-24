import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只支持图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 获取文件扩展名
    const ext = file.name.split('.').pop() || 'png'
    const filename = `banner.${ext}`

    // 确保目录存在
    const uploadDir = join(process.cwd(), 'public', 'images')
    await mkdir(uploadDir, { recursive: true })

    // 保存文件
    const filepath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      message: '图片上传成功',
      filename,
    })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    )
  }
}
