const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 正在测试Neon数据库连接...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功!')
    
    // 查询项目数量
    const projectCount = await prisma.project.count()
    console.log(`📊 当前项目数量: ${projectCount}`)
    
    // 查询图谱数量
    const graphCount = await prisma.graph.count()
    console.log(`📊 当前图谱数量: ${graphCount}`)
    
    // 查询节点数量
    const nodeCount = await prisma.node.count()
    console.log(`📊 当前节点数量: ${nodeCount}`)
    
    // 查询边数量
    const edgeCount = await prisma.edge.count()
    console.log(`📊 当前边数量: ${edgeCount}`)
    
    console.log('✅ 数据库测试完成!')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
