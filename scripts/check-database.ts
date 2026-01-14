/**
 * 数据库连接和数据检查脚本
 * 用于诊断部署后的数据加载问题
 */

import { prisma } from '../lib/db'

async function checkDatabase() {
  console.log('=== 数据库连接检查 ===\n')
  
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功\n')
    
    // 2. 检查项目数据
    console.log('2️⃣ 检查项目数据...')
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            nodes: true,
            edges: true,
            graphs: true,
          },
        },
      },
    })
    console.log(`✅ 找到 ${projects.length} 个项目`)
    projects.forEach(project => {
      console.log(`   - ${project.name} (ID: ${project.id})`)
      console.log(`     节点: ${project._count.nodes}, 边: ${project._count.edges}, 图谱: ${project._count.graphs}`)
    })
    console.log()
    
    // 3. 检查图谱数据
    console.log('3️⃣ 检查图谱数据...')
    const graphs = await prisma.graph.findMany({
      include: {
        project: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
    })
    console.log(`✅ 找到 ${graphs.length} 个图谱`)
    graphs.forEach(graph => {
      console.log(`   - ${graph.name} (ID: ${graph.id})`)
      console.log(`     所属项目: ${graph.project.name}`)
      console.log(`     节点: ${graph._count.nodes}, 边: ${graph._count.edges}`)
    })
    console.log()
    
    // 4. 检查节点数据
    console.log('4️⃣ 检查节点数据...')
    const nodes = await prisma.node.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        projectId: true,
        graphId: true,
      },
      take: 10, // 只显示前10个
    })
    console.log(`✅ 找到节点总数: ${await prisma.node.count()}`)
    console.log(`   显示前 ${Math.min(nodes.length, 10)} 个:`)
    nodes.forEach(node => {
      console.log(`   - ${node.name} (类型: ${node.type})`)
      console.log(`     项目ID: ${node.projectId || '无'}, 图谱ID: ${node.graphId || '无'}`)
    })
    console.log()
    
    // 5. 检查边数据
    console.log('5️⃣ 检查边数据...')
    const edges = await prisma.edge.findMany({
      select: {
        id: true,
        label: true,
        projectId: true,
        graphId: true,
      },
      take: 10,
    })
    console.log(`✅ 找到边总数: ${await prisma.edge.count()}`)
    console.log(`   显示前 ${Math.min(edges.length, 10)} 个:`)
    edges.forEach(edge => {
      console.log(`   - ${edge.label}`)
      console.log(`     项目ID: ${edge.projectId || '无'}, 图谱ID: ${edge.graphId || '无'}`)
    })
    console.log()
    
    // 6. 测试 with-graphs API 的查询
    console.log('6️⃣ 测试 with-graphs API 查询...')
    const projectsWithGraphs = await prisma.project.findMany({
      include: {
        graphs: {
          select: {
            id: true,
            name: true,
            projectId: true,
            createdAt: true,
            _count: {
              select: {
                nodes: true,
                edges: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`✅ with-graphs 查询返回 ${projectsWithGraphs.length} 个项目`)
    projectsWithGraphs.forEach(project => {
      console.log(`   - ${project.name}`)
      console.log(`     包含 ${project.graphs.length} 个图谱:`)
      project.graphs.forEach(graph => {
        console.log(`       * ${graph.name} (节点: ${graph._count.nodes}, 边: ${graph._count.edges})`)
      })
    })
    console.log()
    
    // 7. 检查数据关联完整性
    console.log('7️⃣ 检查数据关联完整性...')
    const nodesWithoutProject = await prisma.node.count({
      where: { projectId: null },
    })
    const nodesWithoutGraph = await prisma.node.count({
      where: { graphId: null },
    })
    const edgesWithoutProject = await prisma.edge.count({
      where: { projectId: null },
    })
    const edgesWithoutGraph = await prisma.edge.count({
      where: { graphId: null },
    })
    
    console.log(`   节点未关联项目: ${nodesWithoutProject}`)
    console.log(`   节点未关联图谱: ${nodesWithoutGraph}`)
    console.log(`   边未关联项目: ${edgesWithoutProject}`)
    console.log(`   边未关联图谱: ${edgesWithoutGraph}`)
    
    if (nodesWithoutProject > 0 || nodesWithoutGraph > 0 || edgesWithoutProject > 0 || edgesWithoutGraph > 0) {
      console.log('   ⚠️ 发现未关联的数据，这可能导致数据无法正确显示')
    } else {
      console.log('   ✅ 所有数据关联完整')
    }
    console.log()
    
    console.log('=== 检查完成 ===')
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
      console.error('错误堆栈:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
