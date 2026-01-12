/**
 * 测试 Neon 数据库连接
 * 运行: npx tsx scripts/test-connection.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔍 测试 Neon 数据库连接...\n')

  try {
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功！\n')

    // 获取统计信息
    const [nodeCount, edgeCount, graphCount] = await Promise.all([
      prisma.node.count(),
      prisma.edge.count(),
      prisma.graph.count(),
    ])

    console.log('📊 数据库统计:')
    console.log(`   节点数: ${nodeCount}`)
    console.log(`   关系数: ${edgeCount}`)
    console.log(`   图谱数: ${graphCount}\n`)

    // 获取节点类型分布
    const nodesByType = await prisma.node.groupBy({
      by: ['type'],
      _count: true,
    })

    console.log('📈 节点类型分布:')
    nodesByType.forEach((item) => {
      console.log(`   ${item.type}: ${item._count}`)
    })
    console.log()

    // 获取最近创建的节点
    const recentNodes = await prisma.node.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        type: true,
        createdAt: true,
      },
    })

    console.log('🕐 最近创建的节点:')
    recentNodes.forEach((node) => {
      console.log(`   - ${node.name} (${node.type})`)
    })
    console.log()

    // 测试查询性能
    const startTime = Date.now()
    await prisma.node.findMany({
      include: {
        outgoingEdges: true,
        incomingEdges: true,
      },
    })
    const queryTime = Date.now() - startTime

    console.log(`⚡ 查询性能: ${queryTime}ms\n`)

    console.log('✅ 所有测试通过！')
    console.log('🎉 Neon 数据库配置正确，可以正常使用！')

  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    console.error('\n请检查:')
    console.error('1. DATABASE_URL 环境变量是否正确')
    console.error('2. 网络连接是否正常')
    console.error('3. Neon 项目是否处于活动状态')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
