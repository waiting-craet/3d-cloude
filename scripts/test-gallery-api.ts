/**
 * 测试首页图库 API
 * 运行: npx tsx scripts/test-gallery-api.ts
 */

import { prisma } from '@/lib/db'

async function main() {
  console.log('🧪 测试首页图库 API...\n')

  try {
    // 测试 1: 获取所有图谱
    console.log('📊 测试 1: 获取所有图谱')
    const allGraphs = await prisma.graph.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            coverUrl: true,
          },
          take: 1,
        },
      },
    })

    console.log(`   找到 ${allGraphs.length} 个图谱`)
    allGraphs.forEach((graph) => {
      const settings = graph.settings ? JSON.parse(graph.settings) : {}
      console.log(`   - ${graph.name} (${settings.graphType || '3d'})`)
    })

    // 测试 2: 获取 3D 图谱
    console.log('\n📊 测试 2: 获取 3D 图谱')
    const graphs3d = await prisma.graph.findMany({
      where: {
        settings: {
          contains: '"graphType":"3d"',
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            coverUrl: true,
          },
          take: 1,
        },
      },
    })

    console.log(`   找到 ${graphs3d.length} 个 3D 图谱`)
    graphs3d.forEach((graph) => {
      console.log(`   - ${graph.name}`)
      console.log(`     节点数: ${graph.nodeCount}`)
      console.log(`     边数: ${graph.edgeCount}`)
      if (graph.nodes.length > 0) {
        console.log(`     缩略图: ${graph.nodes[0].imageUrl || graph.nodes[0].coverUrl || '无'}`)
      }
    })

    // 测试 3: 获取 2D 图谱
    console.log('\n📊 测试 3: 获取 2D 图谱')
    const graphs2d = await prisma.graph.findMany({
      where: {
        settings: {
          contains: '"graphType":"2d"',
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            coverUrl: true,
          },
          take: 1,
        },
      },
    })

    console.log(`   找到 ${graphs2d.length} 个 2D 图谱`)
    graphs2d.forEach((graph) => {
      console.log(`   - ${graph.name}`)
      console.log(`     节点数: ${graph.nodeCount}`)
      console.log(`     边数: ${graph.edgeCount}`)
      if (graph.nodes.length > 0) {
        console.log(`     缩略图: ${graph.nodes[0].imageUrl || graph.nodes[0].coverUrl || '无'}`)
      }
    })

    // 测试 4: 验证数据格式
    console.log('\n📊 测试 4: 验证数据格式')
    if (graphs3d.length > 0) {
      const graph = graphs3d[0]
      const settings = JSON.parse(graph.settings || '{}')
      console.log(`   3D 图谱数据格式:`)
      console.log(`   - ID: ${graph.id}`)
      console.log(`   - 名称: ${graph.name}`)
      console.log(`   - 描述: ${graph.description}`)
      console.log(`   - 类型: ${settings.graphType}`)
      console.log(`   - 是否模板: ${settings.isTemplate}`)
      console.log(`   - 缩略图: ${settings.thumbnail}`)
      console.log(`   - 项目: ${graph.project.name}`)
      console.log(`   - 节点数: ${graph.nodeCount}`)
      console.log(`   - 边数: ${graph.edgeCount}`)
    }

    console.log('\n✅ API 测试完成！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
