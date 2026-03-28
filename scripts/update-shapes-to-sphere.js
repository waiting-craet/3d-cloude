// 将所有节点的 shape 更新为 sphere
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateShapesToSphere() {
  try {
    console.log('🔄 开始更新所有节点的形状为球体...')
    
    // 更新所有 shape 为 'box' 的节点
    const result = await prisma.node.updateMany({
      where: {
        shape: 'box'
      },
      data: {
        shape: 'sphere'
      }
    })
    
    console.log(`✅ 成功更新 ${result.count} 个节点的形状为球体`)
    
    // 验证更新
    const sphereCount = await prisma.node.count({
      where: { shape: 'sphere' }
    })
    
    const boxCount = await prisma.node.count({
      where: { shape: 'box' }
    })
    
    console.log('📊 当前统计:')
    console.log(`  - 球体节点: ${sphereCount}`)
    console.log(`  - 正方体节点: ${boxCount}`)
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateShapesToSphere()
