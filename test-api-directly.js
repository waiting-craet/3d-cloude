/**
 * 直接测试 API 路由
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testAPI() {
  console.log('🧪 直接测试 /api/projects 的逻辑...\n')

  try {
    console.log('1️⃣ 执行与 API 相同的查询...')
    
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

    console.log('✅ 查询成功！')
    console.log(`找到 ${projects.length} 个项目\n`)

    // 转换数据
    const projectsWithGraphCount = projects.map(project => ({
      ...project,
      graphCount: project._count.graph,
      _count: undefined,
    }))

    console.log('2️⃣ 转换后的数据:')
    console.log(JSON.stringify({ projects: projectsWithGraphCount }, null, 2))

    console.log('\n✅ API 逻辑测试通过！')
    console.log('💡 如果这里成功但浏览器还是 500，说明是服务器端的其他问题')

  } catch (error) {
    console.error('\n❌ 测试失败!')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('\n完整错误:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI()
