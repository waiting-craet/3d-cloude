/**
 * 数据库种子脚本 - 树状结构知识图谱（8个节点）
 * 运行: npx tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充树状知识图谱数据（8个节点）...')

  // 清空现有数据
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.graph.deleteMany()
  console.log('✓ 清空现有数据')

  // 创建根节点（最左边）
  const root = await prisma.node.create({
    data: {
      name: '文本',
      type: 'document',
      description: 'Retrieval-Augmented Generation 核心系统',
      content: 'RAG 是一种结合检索和生成的 AI 技术',
      color: '#6BB6FF',
      size: 2.0,
      x: -15,
      y: 0,
      z: 0,
      tags: JSON.stringify(['AI', 'RAG', '核心']),
      category: '根节点',
    },
  })

  console.log('✓ 创建根节点')

  // 分支 1（上方）- 检索路径
  const branch1_mid = await prisma.node.create({
    data: {
      name: '文本',
      type: 'chunk',
      description: '负责从知识库检索相关信息',
      content: '使用向量相似度搜索',
      color: '#6BB6FF',
      size: 1.5,
      x: -5,
      y: 6,
      z: 0,
      tags: JSON.stringify(['检索', '向量']),
      category: '检索',
    },
  })

  const branch1_end = await prisma.node.create({
    data: {
      name: '文本',
      type: 'entity',
      description: '存储和检索向量嵌入',
      content: 'Pinecone, Weaviate, Milvus',
      color: '#6BB6FF',
      size: 1.2,
      x: 5,
      y: 8,
      z: 0,
      tags: JSON.stringify(['数据库', '向量']),
      category: '检索',
    },
  })

  console.log('✓ 创建分支 1（检索路径）')

  // 分支 2（中间）- 知识库路径
  const branch2_mid = await prisma.node.create({
    data: {
      name: '文本',
      type: 'chunk',
      description: '存储向量化的文档数据',
      content: '包含所有文档的向量表示',
      color: '#6BB6FF',
      size: 1.5,
      x: -5,
      y: 0,
      z: 0,
      tags: JSON.stringify(['存储', '知识']),
      category: '知识',
    },
  })

  const branch2_mid2 = await prisma.node.create({
    data: {
      name: '文本',
      type: 'entity',
      description: '将文本转换为向量',
      content: 'OpenAI, Cohere, Sentence-BERT',
      color: '#6BB6FF',
      size: 1.2,
      x: 0,
      y: 0,
      z: 0,
      tags: JSON.stringify(['嵌入', '模型']),
      category: '知识',
    },
  })

  const branch2_end = await prisma.node.create({
    data: {
      name: '文本',
      type: 'entity',
      description: '文档分块和预处理',
      content: '文本清洗、分块、向量化',
      color: '#6BB6FF',
      size: 1.2,
      x: 5,
      y: 0,
      z: 0,
      tags: JSON.stringify(['处理', '文档']),
      category: '知识',
    },
  })

  console.log('✓ 创建分支 2（知识库路径）')

  // 分支 3（下方）- 生成路径
  const branch3_mid = await prisma.node.create({
    data: {
      name: '文本',
      type: 'chunk',
      description: '基于检索结果生成回答',
      content: '使用大语言模型生成',
      color: '#6BB6FF',
      size: 1.5,
      x: -5,
      y: -6,
      z: 0,
      tags: JSON.stringify(['生成', 'LLM']),
      category: '生成',
    },
  })

  const branch3_end = await prisma.node.create({
    data: {
      name: '文本',
      type: 'entity',
      description: '大语言模型',
      content: 'GPT-4, Claude, Llama',
      color: '#6BB6FF',
      size: 1.2,
      x: 5,
      y: -8,
      z: 0,
      tags: JSON.stringify(['LLM', '模型']),
      category: '生成',
    },
  })

  console.log('✓ 创建分支 3（生成路径）')

  // 创建边（树状连接）
  await Promise.all([
    // 根节点到三个分支的中间节点
    prisma.edge.create({
      data: {
        fromNodeId: root.id,
        toNodeId: branch1_mid.id,
        label: 'CONNECTS_TO',
        weight: 1.0,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: root.id,
        toNodeId: branch2_mid.id,
        label: 'CONNECTS_TO',
        weight: 1.0,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: root.id,
        toNodeId: branch3_mid.id,
        label: 'CONNECTS_TO',
        weight: 1.0,
        color: '#888888',
      },
    }),
    
    // 分支 1 内部连接
    prisma.edge.create({
      data: {
        fromNodeId: branch1_mid.id,
        toNodeId: branch1_end.id,
        label: 'LEADS_TO',
        weight: 0.9,
        color: '#888888',
      },
    }),
    
    // 分支 2 内部连接（3个节点）
    prisma.edge.create({
      data: {
        fromNodeId: branch2_mid.id,
        toNodeId: branch2_mid2.id,
        label: 'LEADS_TO',
        weight: 0.9,
        color: '#888888',
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: branch2_mid2.id,
        toNodeId: branch2_end.id,
        label: 'LEADS_TO',
        weight: 0.9,
        color: '#888888',
      },
    }),
    
    // 分支 3 内部连接
    prisma.edge.create({
      data: {
        fromNodeId: branch3_mid.id,
        toNodeId: branch3_end.id,
        label: 'LEADS_TO',
        weight: 0.9,
        color: '#888888',
      },
    }),
  ])

  console.log('✓ 创建边（树状连接）')

  // 创建图谱记录
  await prisma.graph.create({
    data: {
      name: 'RAG 树状知识图谱',
      description: 'RAG 系统的树状结构展示',
      nodeCount: 8,
      edgeCount: 7,
      isPublic: true,
    },
  })

  console.log('✓ 创建图谱记录')

  // 统计信息
  const nodeCount = await prisma.node.count()
  const edgeCount = await prisma.edge.count()

  console.log('\n📊 树状知识图谱填充完成！')
  console.log(`   节点数: ${nodeCount}`)
  console.log(`   关系数: ${edgeCount}`)
  console.log('\n🎯 树状结构:')
  console.log('   - 1 个根节点（RAG 系统）在左侧 x=-15')
  console.log('   - 分支 1（上方）: 检索模块 → 向量数据库')
  console.log('   - 分支 2（中间）: 知识库 → 嵌入模型 → 文档处理')
  console.log('   - 分支 3（下方）: 生成模块 → LLM')
  console.log('   - 所有分支从左向右延伸，呈现放射状树形')
}

main()
  .catch((e) => {
    console.error('❌ 填充数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
