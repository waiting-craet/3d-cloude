/**
 * 数据迁移脚本
 * 将旧的未关联节点和边迁移到项目-图谱系统
 */

import { prisma } from '../lib/db'

async function migrateOldData() {
  console.log('=== 开始数据迁移 ===\n')
  
  try {
    // 1. 检查未关联的数据
    const orphanNodes = await prisma.node.count({
      where: { 
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
    })
    
    const orphanEdges = await prisma.edge.count({
      where: { 
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
    })
    
    console.log(`📊 发现未关联数据:`)
    console.log(`   节点: ${orphanNodes}`)
    console.log(`   边: ${orphanEdges}\n`)
    
    if (orphanNodes === 0 && orphanEdges === 0) {
      console.log('✅ 没有需要迁移的数据')
      return
    }
    
    // 2. 获取或创建默认项目和图谱
    console.log('📁 准备目标项目和图谱...')
    
    let project = await prisma.project.findFirst({
      where: { name: '历史数据' },
    })
    
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: '历史数据',
          description: '从旧系统迁移的数据',
        },
      })
      console.log(`   ✅ 创建项目: ${project.name} (${project.id})`)
    } else {
      console.log(`   ✅ 使用现有项目: ${project.name} (${project.id})`)
    }
    
    let graph = await prisma.graph.findFirst({
      where: { 
        projectId: project.id,
        name: '默认图谱',
      },
    })
    
    if (!graph) {
      graph = await prisma.graph.create({
        data: {
          name: '默认图谱',
          description: '从旧系统迁移的数据',
          projectId: project.id,
        },
      })
      console.log(`   ✅ 创建图谱: ${graph.name} (${graph.id})\n`)
    } else {
      console.log(`   ✅ 使用现有图谱: ${graph.name} (${graph.id})\n`)
    }
    
    // 3. 迁移节点
    console.log('🔄 迁移节点...')
    const updatedNodes = await prisma.node.updateMany({
      where: {
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
      data: {
        projectId: project.id,
        graphId: graph.id,
      },
    })
    console.log(`   ✅ 更新了 ${updatedNodes.count} 个节点\n`)
    
    // 4. 迁移边
    console.log('🔄 迁移边...')
    const updatedEdges = await prisma.edge.updateMany({
      where: {
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
      data: {
        projectId: project.id,
        graphId: graph.id,
      },
    })
    console.log(`   ✅ 更新了 ${updatedEdges.count} 条边\n`)
    
    // 5. 更新图谱的统计信息
    console.log('📊 更新统计信息...')
    const nodeCount = await prisma.node.count({
      where: { graphId: graph.id },
    })
    const edgeCount = await prisma.edge.count({
      where: { graphId: graph.id },
    })
    
    await prisma.graph.update({
      where: { id: graph.id },
      data: {
        nodeCount,
        edgeCount,
      },
    })
    
    await prisma.project.update({
      where: { id: project.id },
      data: {
        nodeCount,
        edgeCount,
      },
    })
    
    console.log(`   ✅ 图谱统计: ${nodeCount} 节点, ${edgeCount} 边`)
    console.log(`   ✅ 项目统计: ${nodeCount} 节点, ${edgeCount} 边\n`)
    
    // 6. 验证迁移结果
    console.log('✅ 验证迁移结果...')
    const remainingOrphanNodes = await prisma.node.count({
      where: { 
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
    })
    
    const remainingOrphanEdges = await prisma.edge.count({
      where: { 
        OR: [
          { projectId: null },
          { graphId: null },
        ],
      },
    })
    
    if (remainingOrphanNodes === 0 && remainingOrphanEdges === 0) {
      console.log('   ✅ 所有数据已成功迁移')
    } else {
      console.log(`   ⚠️ 仍有未关联数据: ${remainingOrphanNodes} 节点, ${remainingOrphanEdges} 边`)
    }
    
    console.log('\n=== 迁移完成 ===')
    console.log(`\n💡 提示: 现在可以在网站上查看 "${project.name}" 项目下的 "${graph.name}" 图谱`)
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

migrateOldData()
