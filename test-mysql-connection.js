/**
 * 测试本地 MySQL 数据库连接
 * 运行: node test-mysql-connection.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 测试本地 MySQL 数据库连接...\n')

    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')

    // 查询所有表的记录数
    const projectCount = await prisma.project.count()
    const graphCount = await prisma.graph.count()
    const nodeCount = await prisma.node.count()
    const edgeCount = await prisma.edge.count()
    const userCount = await prisma.user.count()
    const searchHistoryCount = await prisma.searchhistory.count()

    console.log('\n📊 数据库统计信息:')
    console.log(`   - 数据库类型: MySQL (本地)`)
    console.log(`   - 主机: localhost:3306`)
    console.log(`   - 数据库名: neondb`)
    console.log(`   - 连接状态: 正常`)
    console.log(`\n📈 数据统计:`)
    console.log(`   - Project 表: ${projectCount} 条记录`)
    console.log(`   - Graph 表: ${graphCount} 条记录`)
    console.log(`   - Node 表: ${nodeCount} 条记录`)
    console.log(`   - Edge 表: ${edgeCount} 条记录`)
    console.log(`   - User 表: ${userCount} 条记录`)
    console.log(`   - SearchHistory 表: ${searchHistoryCount} 条记录`)

    console.log('\n✅ 所有测试通过！')
    console.log('🎉 本地 MySQL 数据库配置成功，可以正常使用！\n')

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.error('\n请检查:')
    console.error('1. MySQL 服务是否正在运行')
    console.error('2. 数据库名称、用户名、密码是否正确')
    console.error('3. neondb 数据库是否已创建')
    console.error('4. 所有表是否已创建\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
