import { NextRequest, NextResponse } from 'next/server'
import { createDocumentNode, splitDocumentIntoChunks } from '@/lib/db-helpers'

// 使用 Node.js Runtime（开发环境）
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, content, description, tags, category, autoSplit } = body
    
    if (!name) {
      return NextResponse.json(
        { error: '文档名称为必填项' },
        { status: 400 }
      )
    }
    
    // 创建文档节点
    const document = await createDocumentNode({
      name,
      content,
      description,
      tags,
      category,
    })
    
    // 如果需要自动分割成 chunks
    if (autoSplit && content) {
      const chunks = await splitDocumentIntoChunks(document.id, content)
      
      return NextResponse.json({
        document,
        chunks,
        message: `文档已创建，并分割成 ${chunks.length} 个 chunks`,
      }, { status: 201 })
    }
    
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('创建文档失败:', error)
    return NextResponse.json(
      { error: '创建文档失败', details: String(error) },
      { status: 500 }
    )
  }
}
