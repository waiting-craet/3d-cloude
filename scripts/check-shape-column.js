// 检查数据库中是否有 shape 列
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkShapeColumn() {
  try {
    console.log('🔍 检查数据库中的 shape 列...')
    
    // 尝试查询一个节点并检查是否有 shape 字段
    const node = await prisma.node.findFirst()
    
    if (!node) {
      console.log('⚠️ 数据库中没有节点')
      return
    }
    
    console.log('✅ 找到节点:', node.id)
    console.log('📊 节点字段:')
    console.log('  - name:', node.name)
    console.log('  - color:', node.color)
    console.log('  - shape:', node.shape)
    console.log('  - size:', node.size)
    
    if (node.shape !== undefined) {
      console.log('✅ shape 列存在！')
    } else {
      console.log('❌ shape 列不存在！')
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    if (error.message.includes('shape')) {
      console.log('💡 提示: shape 列可能不存在于数据库中')
      console.log('   请运行: npx prisma db push')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkShapeColumn()
