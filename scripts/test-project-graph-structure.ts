/**
 * 测试项目-图谱-节点三层数据结构
 * 
 * 数据结构:
 * Project (项目) -> Graph (图谱) -> Node (节点) + Edge (边)
 * 
 * 运行: npx tsx scripts/test-project-graph-structure.ts
 */

import { prisma } from '../lib/db'

async function testProjectGraphStructure() {
  console.log('🚀 开始测试项目-图谱-节点数据结构...\n')

  try {
    // 1. 创建项目
    console.log('📁 步骤 1: 创建项目 "委屈"')
    const project = await prisma.project.create({
      data: {
        name: '委屈',
        description: '这是一个测试项目，用于演示项目-图谱-节点的数据关联',
      },
    })
    console.log(`✅ 项目创建成功! ID: ${project.id}`)
    console.log(`   名称: ${project.name}`)
    console.log(`   描述: ${project.description}\n`)

    // 2. 在项目下创建图谱
    console.log('🗺️  步骤 2: 在项目下创建图谱 "知识图谱A"')
    const graphA = await prisma.graph.create({
      data: {
        name: '知识图谱A',
        description: '第一个知识图谱，包含核心概念',
        projectId: project.id,
        isPublic: false,
      },
    })
    console.log(`✅ 图谱A创建成功! ID: ${graphA.id}`)
    console.log(`   名称: ${graphA.name}`)
    console.log(`   所属项目: ${project.name} (${project.id})\n`)

    console.log('🗺️  步骤 3: 在项目下创建图谱 "知识图谱B"')
    const graphB = await prisma.graph.create({
      data: {
        name: '知识图谱B',
        description: '第二个知识图谱，包含扩展内容',
        projectId: project.id,
        isPublic: true,
      },
    })
    console.log(`✅ 图谱B创建成功! ID: ${graphB.id}`)
    console.log(`   名称: ${graphB.name}`)
    console.log(`   所属项目: ${project.name} (${project.id})\n`)

    // 3. 在图谱A中创建节点
    console.log('📍 步骤 4: 在图谱A中创建节点')
    const node1 = await prisma.node.create({
      data: {
        name: '核心概念1',
        type: 'concept',
        description: '这是图谱A的第一个核心概念',
        content: '详细内容...',
        x: 0,
        y: 0,
        z: 0,
        color: '#FF6B6B',
        size: 2.0,
        projectId: project.id,
        graphId: graphA.id,
      },
    })
    console.log(`✅ 节点1创建成功! ID: ${node1.id}`)
    console.log(`   名称: ${node1.name}`)
    console.log(`   所属图谱: ${graphA.name} (${graphA.id})`)
    console.log(`   所属项目: ${project.name} (${project.id})\n`)

    const node2 = await prisma.node.create({
      data: {
        name: '核心概念2',
        type: 'concept',
        description: '这是图谱A的第二个核心概念',
        content: '详细内容...',
        x: 5,
        y: 0,
        z: 0,
        color: '#4ECDC4',
        size: 1.8,
        imageUrl: 'https://example.com/image1.jpg', // 示例图片URL
        projectId: project.id,
        graphId: graphA.id,
      },
    })
    console.log(`✅ 节点2创建成功! ID: ${node2.id}`)
    console.log(`   名称: ${node2.name}`)
    console.log(`   图片URL: ${node2.imageUrl}\n`)

    // 4. 在图谱B中创建节点
    console.log('📍 步骤 5: 在图谱B中创建节点')
    const node3 = await prisma.node.create({
      data: {
        name: '扩展概念1',
        type: 'entity',
        description: '这是图谱B的扩展概念',
        x: 0,
        y: 5,
        z: 0,
        color: '#95E1D3',
        size: 1.5,
        coverUrl: 'https://example.com/cover1.jpg', // 示例封面URL
        projectId: project.id,
        graphId: graphB.id,
      },
    })
    console.log(`✅ 节点3创建成功! ID: ${node3.id}`)
    console.log(`   名称: ${node3.name}`)
    console.log(`   所属图谱: ${graphB.name} (${graphB.id})`)
    console.log(`   封面URL: ${node3.coverUrl}\n`)

    // 5. 创建边（节点之间的关系）
    console.log('🔗 步骤 6: 创建节点之间的关系（边）')
    const edge1 = await prisma.edge.create({
      data: {
        fromNodeId: node1.id,
        toNodeId: node2.id,
        label: 'RELATES_TO',
        weight: 1.5,
        color: '#FFD93D',
        style: 'solid',
        projectId: project.id,
        graphId: graphA.id,
      },
    })
    console.log(`✅ 边创建成功! ID: ${edge1.id}`)
    console.log(`   从: ${node1.name} -> 到: ${node2.name}`)
    console.log(`   关系类型: ${edge1.label}\n`)

    // 6. 更新统计信息
    console.log('📊 步骤 7: 更新统计信息')
    await prisma.graph.update({
      where: { id: graphA.id },
      data: {
        nodeCount: 2,
        edgeCount: 1,
      },
    })
    await prisma.graph.update({
      where: { id: graphB.id },
      data: {
        nodeCount: 1,
        edgeCount: 0,
      },
    })
    await prisma.project.update({
      where: { id: project.id },
      data: {
        nodeCount: 3,
        edgeCount: 1,
      },
    })
    console.log('✅ 统计信息更新完成\n')

    // 7. 查询验证数据结构
    console.log('🔍 步骤 8: 验证数据结构')
    const projectWithData = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        graphs: {
          include: {
            nodes: true,
            edges: true,
          },
        },
      },
    })

    console.log('\n📋 完整数据结构:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`项目: ${projectWithData?.name}`)
    console.log(`  ID: ${projectWithData?.id}`)
    console.log(`  描述: ${projectWithData?.description}`)
    console.log(`  节点总数: ${projectWithData?.nodeCount}`)
    console.log(`  边总数: ${projectWithData?.edgeCount}`)
    console.log(`  图谱数量: ${projectWithData?.graphs.length}`)
    console.log()

    projectWithData?.graphs.forEach((graph, index) => {
      console.log(`  图谱 ${index + 1}: ${graph.name}`)
      console.log(`    ID: ${graph.id}`)
      console.log(`    描述: ${graph.description}`)
      console.log(`    节点数: ${graph.nodes.length}`)
      console.log(`    边数: ${graph.edges.length}`)
      console.log(`    公开: ${graph.isPublic ? '是' : '否'}`)
      console.log()

      graph.nodes.forEach((node, nodeIndex) => {
        console.log(`      节点 ${nodeIndex + 1}: ${node.name}`)
        console.log(`        ID: ${node.id}`)
        console.log(`        类型: ${node.type}`)
        console.log(`        位置: (${node.x}, ${node.y}, ${node.z})`)
        console.log(`        颜色: ${node.color}`)
        if (node.imageUrl) console.log(`        图片: ${node.imageUrl}`)
        if (node.coverUrl) console.log(`        封面: ${node.coverUrl}`)
        console.log()
      })

      graph.edges.forEach((edge, edgeIndex) => {
        console.log(`      边 ${edgeIndex + 1}: ${edge.label}`)
        console.log(`        ID: ${edge.id}`)
        console.log(`        从: ${edge.fromNodeId}`)
        console.log(`        到: ${edge.toNodeId}`)
        console.log(`        权重: ${edge.weight}`)
        console.log()
      })
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n✅ 测试完成! 数据结构验证成功!')
    console.log('\n💡 数据关联说明:')
    console.log('   1. 项目 (Project) 包含多个图谱 (Graph)')
    console.log('   2. 图谱 (Graph) 属于一个项目，包含多个节点和边')
    console.log('   3. 节点 (Node) 同时关联项目和图谱')
    console.log('   4. 边 (Edge) 同时关联项目和图谱')
    console.log('   5. 节点可以存储图片、视频URL (imageUrl, iconUrl, coverUrl)')
    console.log('   6. 边存储节点之间的关系和属性')

    console.log('\n🗑️  清理测试数据...')
    await prisma.project.delete({
      where: { id: project.id },
    })
    console.log('✅ 测试数据已清理')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testProjectGraphStructure()
  .then(() => {
    console.log('\n🎉 所有测试通过!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 测试失败:', error)
    process.exit(1)
  })
