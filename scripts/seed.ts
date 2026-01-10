/**
 * 数据库种子脚本 - RAG 知识图谱示例数据（7个节点）
 * 运行: npx tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充 RAG 知识图谱数据（7个节点）...')

  // 清空现有数据
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  console.log('✓ 清空现有数据')

  // 创建中心文档节点
  const centerDoc = await prisma.node.create({
    data: {
      name: 'RAG 系统',
      type: 'document',
      description: 'Retrieval-Augmented Generation 核心文档',
      content: 'RAG 是一种结合检索和生成的 AI 技术，用于提高大语言模型的准确性。',
      color: '#6BB6FF',
      size: 2.0,
      x: 0,
      y: 8,
      z: 0,
      tags: JSON.stringify(['AI', 'RAG', 'NLP']),
      category: '核心概念',
    },
  })

  // 创建第一层子节点（主要组件）
  const retrieval = await prisma.node.create({
    data: {
      name: '检索模块',
      type: 'chunk',
      content: '负责从知识库中检索相关信息',
      description: '使用向量相似度搜索找到最相关的文档片段',
      documentId: centerDoc.id,
      chunkIndex: 0,
      color: '#6BB6FF',
      size: 1.5,
      x: -6,
      y: 3,
      z: -3,
      tags: JSON.stringify(['检索', '向量搜索']),
    },
  })

  const generation = await prisma.node.create({
    data: {
      name: '生成模块',
      type: 'chunk',
      content: '基于检索结果生成回答',
      description: '使用大语言模型根据检索到的上下文生成准确的回答',
      documentId: centerDoc.id,
      chunkIndex: 1,
      color: '#6BB6FF',
      size: 1.5,
      x: 6,
      y: 3,
      z: -3,
      tags: JSON.stringify(['生成', 'LLM']),
    },
  })

  const knowledge = await prisma.node.create({
    data: {
      name: '知识库',
      type: 'chunk',
      content: '存储向量化的文档数据',
      description: '包含所有文档的向量表示，支持快速相似度搜索',
      documentId: centerDoc.id,
      chunkIndex: 2,
      color: '#6BB6FF',
      size: 1.5,
      x: 0,
      y: 3,
      z: 4,
      tags: JSON.stringify(['存储', '向量数据库']),
    },
  })

  console.log('✓ 创建核心节点')

  // 创建第二层子节点（详细功能）- 只创建3个
  const vectorDB = await prisma.node.create({
    data: {
      name: '向量数据库',
      type: 'entity',
      content: 'Pinecone, Weaviate, Milvus',
      description: '专门用于存储和检索向量嵌入的数据库',
      color: '#6BB6FF',
      size: 1.2,
      x: -3,
      y: -2,
      z: 5,
      tags: JSON.stringify(['数据库', '向量']),
    },
  })

  const embedding = await prisma.node.create({
    data: {
      name: '嵌入模型',
      type: 'entity',
      content: 'OpenAI, Cohere, Sentence-BERT',
      description: '将文本转换为向量表示的模型',
      color: '#6BB6FF',
      size: 1.2,
      x: 3,
      y: -2,
      z: 5,
      tags: JSON.stringify(['嵌入', '模型']),
    },
  })

  const llm = await prisma.node.create({
    data: {
      name: 'LLM',
      type: 'entity',
      content: 'GPT-4, Claude, Llama',
      description: '大语言模型，用于生成最终的回答',
      color: '#6BB6FF',
      size: 1.2,
      x: 8,
      y: -2,
      z: -3,
      tags: JSON.stringify(['LLM', '生成']),
    },
  })

  console.log('✓ 创建子节点')

  // 创建关系
  await Promise.all([
    // 中心节点到第一层
    prisma.edge.create({
      data: {
        fromNodeId: retrieval.id,
        toNodeId: centerDoc.id,
        label: 'PART_OF',
        weight: 1.0,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: generation.id,
        toNodeId: centerDoc.id,
        label: 'PART_OF',
        weight: 1.0,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: knowledge.id,
        toNodeId: centerDoc.id,
        label: 'PART_OF',
        weight: 1.0,
        color: '#888888',
      },
    }),
    
    // 第一层到第二层
    prisma.edge.create({
      data: {
        fromNodeId: vectorDB.id,
        toNodeId: knowledge.id,
        label: 'IMPLEMENTS',
        weight: 0.9,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: embedding.id,
        toNodeId: knowledge.id,
        label: 'IMPLEMENTS',
        weight: 0.9,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: llm.id,
        toNodeId: generation.id,
        label: 'IMPLEMENTS',
        weight: 0.9,
        color: '#888888',
      },
    }),
    
    // 横向关系
    prisma.edge.create({
      data: {
        fromNodeId: retrieval.id,
        toNodeId: generation.id,
        label: 'FEEDS_INTO',
        weight: 0.8,
        color: '#888888',
        bidirectional: false,
      },
    }),
  ])

  console.log('✓ 创建关系')

  // 创建图谱记录
  await prisma.graph.create({
    data: {
      name: 'RAG 知识图谱',
      description: 'Retrieval-Augmented Generation 系统架构',
      nodeCount: 7,
      edgeCount: 7,
      isPublic: true,
    },
  })

  console.log('✓ 创建图谱记录')

  // 统计信息
  const nodeCount = await prisma.node.count()
  const edgeCount = await prisma.edge.count()

  console.log('\n📊 RAG 知识图谱填充完成！')
  console.log(`   节点数: ${nodeCount}`)
  console.log(`   关系数: ${edgeCount}`)
  console.log('\n🎯 图谱结构:')
  console.log('   - 1 个中心文档节点（RAG 系统）')
  console.log('   - 3 个第一层节点（检索、生成、知识库）')
  console.log('   - 3 个第二层节点（向量数据库、嵌入模型、LLM）')
}

main()
  .catch((e) => {
    console.error('❌ 填充数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
