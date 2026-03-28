import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetUserTable() {
  try {
    console.log('🔄 开始重置 User 表...')

    // 删除所有用户数据
    const deleteResult = await prisma.user.deleteMany({})
    console.log(`✅ 已删除 ${deleteResult.count} 个用户记录`)

    console.log('✅ User 表已重置完成')
    console.log('📝 表结构保持不变，可以开始注册新用户')
  } catch (error) {
    console.error('❌ 重置 User 表失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetUserTable()
