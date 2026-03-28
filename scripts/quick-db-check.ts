/**
 * 快速数据库检查脚本
 * 用于快速验证数据库连接和基本状态
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickCheck() {
  console.log('🔍 快速数据库检查...\n')

  try {
    // 连接测试
    await prisma.$connect()
    console.log('✅ 数据库连接: 正常')

    // 获取统计
    const [projectCount, graphCount, nodeCount, edgeCount] = await Promise.all([
      prisma.project.count(),
      prisma.graph.count(),
      prisma.node.count(),
      prisma.edge.count(),
    ])

    console.log('\n📊 数据统计:')
    console.log(`   项目: ${projectCount} 个`)
    console.log(`   图谱: ${graphCount} 个`)
    console.log(`   节点: ${nodeCount} 个`)
    console.log(`   边:   ${edgeCount} 条`)

    // 检查最近的项目
    const recentProjects = await prisma.project.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        graphs: true,
      },
    })

    console.log('\n📁 最近的项目:')
    recentProjects.forEach((project) => {
      console.log(`   - ${project.name} (${project.graphs.length} 个图谱)`)
    })

    console.log('\n✅ 数据库状态: 正常')
    console.log('🟢 所有检查通过！')

  } catch (error) {
    console.error('\n❌ 数据库检查失败:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

quickCheck()
