/**
 * 数据库种子脚本 - 用于初始化示例数据
 * 运行: npx tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充数据库...')

  // 清空现有数据
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  console.log('✓ 清空现有数据')

  // 创建示例文档
  const doc1 = await prisma.node.create({
    data: {
      name: 'Next.js 文档',
      type: 'document',
      description: 'Next.js 14 完整指南',
      content: 'Next.js 是一个用于构建全栈 Web 应用的 React 框架。它提供了路由、渲染、数据获取等功能。',
      color: '#FFB6C1',
      size: 2.0,
      x: 0,
      y: 5,
      z: 0,
      tags: JSON.stringify(['React', 'Next.js', 'Web开发']),
      category: '技术文档',
    },
  })

  const doc2 = await prisma.node.create({
    data: {
      name: 'Three.js 教程',
      type: 'document',
      description: '3D 图形库入门',
      content: 'Three.js 是一个 JavaScript 3D 库，可以在浏览器中创建和显示 3D 图形。',
      color: '#FFB6C1',
      size: 2.0,
      x: 10,
      y: 5,
      z: 0,
      tags: JSON.stringify(['Three.js', '3D', 'WebGL']),
      category: '技术文档',
    },
  })

  console.log('✓ 创建文档节点')

  // 创建 Chunks
  const chunks = await Promise.all([
    prisma.node.create({
      data: {
        name: 'Next.js 文档 - Chunk 1',
        type: 'chunk',
        content: 'Next.js 提供了基于文件系统的路由功能。',
        documentId: doc1.id,
        chunkIndex: 0,
        color: '#FFE4B5',
        size: 1.5,
        x: -5,
        y: -5,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Next.js 文档 - Chunk 2',
        type: 'chunk',
        content: 'App Router 是 Next.js 13+ 的新路由系统。',
        documentId: doc1.id,
        chunkIndex: 1,
        color: '#FFE4B5',
        size: 1.5,
        x: 0,
        y: -5,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Next.js 文档 - Chunk 3',
        type: 'chunk',
        content: 'Server Components 允许在服务器端渲染组件。',
        documentId: doc1.id,
        chunkIndex: 2,
        color: '#FFE4B5',
        size: 1.5,
        x: 5,
        y: -5,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Three.js 教程 - Chunk 1',
        type: 'chunk',
        content: 'Three.js 的核心概念包括场景、相机和渲染器。',
        documentId: doc2.id,
        chunkIndex: 0,
        color: '#FFE4B5',
        size: 1.5,
        x: 10,
        y: -5,
        z: 5,
      },
    }),
  ])

  console.log('✓ 创建 Chunk 节点')

  // 创建关系
  await Promise.all([
    // PART_OF 关系
    ...chunks.slice(0, 3).map((chunk) =>
      prisma.edge.create({
        data: {
          fromNodeId: chunk.id,
          toNodeId: doc1.id,
          label: 'PART_OF',
          weight: 1.0,
          color: '#666666',
        },
      })
    ),
    prisma.edge.create({
      data: {
        fromNodeId: chunks[3].id,
        toNodeId: doc2.id,
        label: 'PART_OF',
        weight: 1.0,
        color: '#666666',
      },
    }),
    // RELATES_TO 关系
    prisma.edge.create({
      data: {
        fromNodeId: doc1.id,
        toNodeId: doc2.id,
        label: 'RELATES_TO',
        weight: 0.8,
        color: '#3b82f6',
        bidirectional: true,
      },
    }),
  ])

  console.log('✓ 创建关系')

  // 创建图谱记录
  await prisma.graph.create({
    data: {
      name: '技术知识图谱',
      description: '前端开发相关的技术文档和教程',
      nodeCount: 6,
      edgeCount: 5,
      isPublic: true,
    },
  })

  console.log('✓ 创建图谱记录')

  // 统计信息
  const nodeCount = await prisma.node.count()
  const edgeCount = await prisma.edge.count()

  console.log('\n📊 数据库填充完成！')
  console.log(`   节点数: ${nodeCount}`)
  console.log(`   关系数: ${edgeCount}`)
}

main()
  .catch((e) => {
    console.error('❌ 填充数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
