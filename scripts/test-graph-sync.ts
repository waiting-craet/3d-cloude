/**
 * 测试图谱同步功能
 * 
 * 运行: npx tsx scripts/test-graph-sync.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGraphSync() {
  try {
    console.log('Testing graph sync functionality...')
    
    // Test basic database connection
    const nodeCount = await prisma.node.count()
    const edgeCount = await prisma.edge.count()
    
    console.log(`Current graph state:`)
    console.log(`- Nodes: ${nodeCount}`)
    console.log(`- Edges: ${edgeCount}`)
    
    console.log('\nGraph sync test completed successfully!')
  } catch (error) {
    console.error('Graph sync test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testGraphSync()
