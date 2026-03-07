/**
 * 诊断 API 错误脚本
 * 模拟 API 调用来查看具体错误
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function diagnoseError() {
  console.log('🔍 开始诊断 API 错误...\n')

  try {
    // 测试 1: 检查数据库连接
    console.log('1️⃣ 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功\n')

    // 测试 2: 检查 Prisma Client 模型
    console.log('2️⃣ 检查 Prisma Client 模型...')
    console.log('可用的模型:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')))
    console.log('')

    // 测试 3: 尝试查询 project 表（小写）
    console.log('3️⃣ 尝试查询 project 表（小写）...')
    try {
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
              graphs: true,
            },
          },
        },
      })
      console.log(`✅ 成功查询到 ${projects.length} 个项目`)
      console.log('项目数据:', JSON.stringify(projects, null, 2))
    } catch (error) {
      console.error('❌ 查询失败:', error.message)
      console.error('错误详情:', error)
    }

    console.log('')

    // 测试 4: 检查表结构
    console.log('4️⃣ 检查数据库表结构...')
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'neondb'
    `
    console.log('数据库中的表:', tables)
    console.log('')

    // 测试 5: 检查 project 表的列
    console.log('5️⃣ 检查 project 表的列结构...')
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'neondb' AND TABLE_NAME = 'project'
      ORDER BY ORDINAL_POSITION
    `
    console.log('project 表的列:', columns)

  } catch (error) {
    console.error('\n❌ 诊断过程中发生错误:')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    if (error.stack) {
      console.error('堆栈跟踪:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseError()
