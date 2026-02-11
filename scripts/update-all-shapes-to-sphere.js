const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 开始更新所有节点的形状为球体...')
    
    // 更新所有节点的shape为'sphere'
    const result = await prisma.node.updateMany({
      data: {
        shape: 'sphere',
      },
    })
    
    console.log(`✅ 成功更新 ${result.count} 个节点的形状为球体`)
    
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
