/**
 * 修复缺失的边
 * 运行: npx tsx scripts/fix-missing-edge.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 修复缺失的边...\n')

  // 获取所有节点
  const nodes = await prisma.node.findMany({
    orderBy: { createdAt: 'asc' },
  })

  // 找到孤立节点 (5, 8, 0) - 这是分支1的末端
  const isolatedNode = nodes.find(n => n.x === 5 && n.y === 8 && n.z === 0)
  
  // 找到分支1的中间节点 (-5, 6, 0)
  const branch1Mid = nodes.find(n => n.x === -5 && n.y === 6 && n.z === 0)

  if (!isolatedNode || !branch1Mid) {
    console.error('❌ 找不到相关节点')
    return
  }

  console.log(`找到孤立节点: ${isolatedNode.name} (${isolatedNode.id.slice(0, 8)})`)
  console.log(`找到分支1中间节点: ${branch1Mid.name} (${branch1Mid.id.slice(0, 8)})`)

  // 检查是否已存在这条边
  const existingEdge = await prisma.edge.findFirst({
    where: {
      fromNodeId: branch1Mid.id,
      toNodeId: isolatedNode.id,
    },
  })

  if (existingEdge) {
    console.log('✓ 边已存在，无需创建')
    return
  }

  // 创建缺失的边
  const newEdge = await prisma.edge.create({
    data: {
      fromNodeId: branch1Mid.id,
      toNodeId: isolatedNode.id,
      label: 'LEADS_TO',
      weight: 0.9,
      color: '#888888',
    },
  })

  console.log(`✅ 成功创建边: ${branch1Mid.name} → ${isolatedNode.name}`)
  
  // 验证
  const totalEdges = await prisma.edge.count()
  console.log(`\n📊 当前总边数: ${totalEdges}`)
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
