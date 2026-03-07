/**
 * 测试修复后的 API
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPI() {
  console.log('🧪 测试修复后的 API 查询...\n')

  try {
    // 测试修复后的查询
    console.log('1️⃣ 测试 project.findMany with _count...')
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        nodeCount: true,
        edgeCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            graph: true,
          },
        },
      },
    })

    console.log(`✅ 成功！查询到 ${projects.length} 个项目`)
    
    const projectsWithGraphCount = projects.map(project => ({
      ...project,
      graphCount: project._count.graph,
      _count: undefined,
    }))

    console.log('格式化后的数据:', JSON.stringify(projectsWithGraphCount, null, 2))
    console.log('')

    // 测试 with-graphs 查询
    console.log('2️⃣ 测试 with-graphs 查询...')
    const projectsWithGraphs = await prisma.project.findMany({
      include: {
        graph: {
          select: {
            id: true,
            name: true,
            projectId: true,
            createdAt: true,
            _count: {
              select: {
                node: true,
                edge: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`✅ 成功！查询到 ${projectsWithGraphs.length} 个项目`)
    console.log('')

    console.log('✅ 所有 API 测试通过！')
    console.log('🎉 现在可以刷新浏览器查看效果了！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI()
