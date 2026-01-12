/**
 * 检查边的连接情况
 * 运行: npx tsx scripts/check-edges.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查节点和边的连接情况...\n')

  const nodes = await prisma.node.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const edges = await prisma.edge.findMany()

  console.log('📊 节点列表:')
  nodes.forEach((node, i) => {
    console.log(`${i + 1}. ${node.name} (ID: ${node.id.slice(0, 8)}) - 位置: (${node.x}, ${node.y}, ${node.z})`)
  })

  console.log('\n🔗 边列表:')
  edges.forEach((edge, i) => {
    const fromNode = nodes.find(n => n.id === edge.fromNodeId)
    const toNode = nodes.find(n => n.id === edge.toNodeId)
    console.log(`${i + 1}. ${fromNode?.name} → ${toNode?.name}`)
  })

  console.log('\n🔍 孤立节点检查:')
  nodes.forEach(node => {
    const hasConnection = edges.some(
      e => e.fromNodeId === node.id || e.toNodeId === node.id
    )
    if (!hasConnection) {
      console.log(`⚠️  孤立节点: ${node.name} (ID: ${node.id.slice(0, 8)}) - 位置: (${node.x}, ${node.y}, ${node.z})`)
    }
  })
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
