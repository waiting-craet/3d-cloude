/**
 * 数据库种子脚本 - 创建 3D 和 2D 测试图谱
 * 运行: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始生成测试数据...')

  // 清空现有数据
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.graph.deleteMany()
  await prisma.project.deleteMany()
  console.log('✓ 清空现有数据')

  // 创建项目
  const project = await prisma.project.create({
    data: {
      name: '知识图谱示例项目',
      description: '用于展示的示例项目',
      settings: JSON.stringify({
        theme: 'dark',
        layout: 'force',
      }),
    },
  })

  console.log('✓ 项目创建成功')

  // ============ 创建 3D 图谱 ============
  const graph3d = await prisma.graph.create({
    data: {
      name: '人工智能知识体系',
      description: '展示人工智能领域的核心概念和关系',
      projectId: project.id,
      isPublic: true,
      settings: JSON.stringify({
        graphType: '3d',
        isTemplate: false,
        thumbnail: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=400&h=300&fit=crop',
      }),
      nodeCount: 5,
      edgeCount: 4,
    },
  })

  console.log('✓ 3D 图谱创建成功')

  // 为 3D 图谱添加节点
  const nodes3d = await Promise.all([
    prisma.node.create({
      data: {
        name: '机器学习',
        type: 'concept',
        description: '机器学习是人工智能的核心分支',
        graphId: graph3d.id,
        projectId: project.id,
        color: '#3b82f6',
        imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=200&h=200&fit=crop',
        x: 0,
        y: 0,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: '深度学习',
        type: 'concept',
        description: '深度学习是机器学习的重要方向',
        graphId: graph3d.id,
        projectId: project.id,
        color: '#8b5cf6',
        imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=200&h=200&fit=crop',
        x: 100,
        y: 0,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: '神经网络',
        type: 'concept',
        description: '神经网络是深度学习的基础',
        graphId: graph3d.id,
        projectId: project.id,
        color: '#ec4899',
        imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=200&h=200&fit=crop',
        x: 50,
        y: 100,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: '自然语言处理',
        type: 'concept',
        description: '自然语言处理是深度学习的应用领域',
        graphId: graph3d.id,
        projectId: project.id,
        color: '#f59e0b',
        imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=200&h=200&fit=crop',
        x: 150,
        y: 100,
        z: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: '计算机视觉',
        type: 'concept',
        description: '计算机视觉是深度学习的重要应用',
        graphId: graph3d.id,
        projectId: project.id,
        color: '#10b981',
        imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8d5a32b9c94d39be18c6b1d8c?w=200&h=200&fit=crop',
        x: 200,
        y: 50,
        z: 0,
      },
    }),
  ])

  console.log('✓ 3D 图谱节点创建成功')

  // 为 3D 图谱添加边
  await Promise.all([
    prisma.edge.create({
      data: {
        fromNodeId: nodes3d[0].id,
        toNodeId: nodes3d[1].id,
        label: 'INCLUDES',
        graphId: graph3d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes3d[1].id,
        toNodeId: nodes3d[2].id,
        label: 'BASED_ON',
        graphId: graph3d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes3d[1].id,
        toNodeId: nodes3d[3].id,
        label: 'APPLIED_TO',
        graphId: graph3d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes3d[1].id,
        toNodeId: nodes3d[4].id,
        label: 'APPLIED_TO',
        graphId: graph3d.id,
        projectId: project.id,
      },
    }),
  ])

  console.log('✓ 3D 图谱边创建成功')

  // ============ 创建 2D 图谱 ============
  const graph2d = await prisma.graph.create({
    data: {
      name: '数据科学工具链',
      description: '数据科学领域常用的工具和库',
      projectId: project.id,
      isPublic: true,
      settings: JSON.stringify({
        graphType: '2d',
        isTemplate: false,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      }),
      nodeCount: 5,
      edgeCount: 4,
    },
  })

  console.log('✓ 2D 图谱创建成功')

  // 为 2D 图谱添加节点
  const nodes2d = await Promise.all([
    prisma.node.create({
      data: {
        name: 'Python',
        type: 'tool',
        description: '数据科学的主要编程语言',
        graphId: graph2d.id,
        projectId: project.id,
        color: '#3776ab',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
        x: 0,
        y: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Pandas',
        type: 'library',
        description: '数据处理和分析库',
        graphId: graph2d.id,
        projectId: project.id,
        color: '#150458',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
        x: 100,
        y: 0,
      },
    }),
    prisma.node.create({
      data: {
        name: 'NumPy',
        type: 'library',
        description: '数值计算库',
        graphId: graph2d.id,
        projectId: project.id,
        color: '#013243',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
        x: 100,
        y: 100,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Scikit-learn',
        type: 'library',
        description: '机器学习库',
        graphId: graph2d.id,
        projectId: project.id,
        color: '#f7931e',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
        x: 200,
        y: 50,
      },
    }),
    prisma.node.create({
      data: {
        name: 'Matplotlib',
        type: 'library',
        description: '数据可视化库',
        graphId: graph2d.id,
        projectId: project.id,
        color: '#11557c',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
        x: 0,
        y: 100,
      },
    }),
  ])

  console.log('✓ 2D 图谱节点创建成功')

  // 为 2D 图谱添加边
  await Promise.all([
    prisma.edge.create({
      data: {
        fromNodeId: nodes2d[0].id,
        toNodeId: nodes2d[1].id,
        label: 'USES',
        graphId: graph2d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes2d[0].id,
        toNodeId: nodes2d[2].id,
        label: 'USES',
        graphId: graph2d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes2d[0].id,
        toNodeId: nodes2d[3].id,
        label: 'USES',
        graphId: graph2d.id,
        projectId: project.id,
      },
    }),
    prisma.edge.create({
      data: {
        fromNodeId: nodes2d[0].id,
        toNodeId: nodes2d[4].id,
        label: 'USES',
        graphId: graph2d.id,
        projectId: project.id,
      },
    }),
  ])

  console.log('✓ 2D 图谱边创建成功')

  console.log('\n✅ 测试数据生成完成！')
  console.log(`   项目: ${project.name}`)
  console.log(`   3D 图谱: ${graph3d.name}`)
  console.log(`   2D 图谱: ${graph2d.name}`)
}

main()
  .catch((e) => {
    console.error('❌ 生成测试数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
