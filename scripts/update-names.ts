/**
 * 批量更新节点名称为"文本"
 * 运行: npx tsx scripts/update-names.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 开始批量更新节点名称为"文本"...')

  try {
    // 获取所有节点
    const nodes = await prisma.node.findMany()
    console.log(`找到 ${nodes.length} 个节点`)

    // 批量更新所有节点的名称
    const result = await prisma.node.updateMany({
      data: {
        name: '文本',
      },
    })

    console.log(`✅ 成功更新 ${result.count} 个节点的名称为"文本"`)
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
