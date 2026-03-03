/**
 * 测试节点间距设置
 * 验证生成的3D图谱中节点之间的距离是否合理
 */

import { CoordinateGenerator, NodeData, EdgeData } from '../lib/services/coordinate-generator'

function calculateDistance(node1: NodeData, node2: NodeData): number {
  const dx = node1.x! - node2.x!
  const dy = node1.y! - node2.y!
  const dz = node1.z! - node2.z!
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

async function testNodeDistance() {
  console.log('=== 测试节点间距设置 ===\n')

  const generator = new CoordinateGenerator()

  // 创建测试数据
  const nodes: NodeData[] = [
    { label: 'Python' },
    { label: '数据分析' },
    { label: '机器学习' },
    { label: 'Web开发' },
    { label: '自动化脚本' }
  ]

  const edges: EdgeData[] = [
    { source: 'Python', target: '数据分析' },
    { source: 'Python', target: '机器学习' },
    { source: 'Python', target: 'Web开发' },
    { source: 'Python', target: '自动化脚本' },
    { source: '数据分析', target: '机器学习' }
  ]

  console.log(`节点数量: ${nodes.length}`)
  console.log(`边数量: ${edges.length}\n`)

  // 生成坐标
  const result = generator.generateCoordinates(nodes, edges)

  console.log('生成结果:')
  console.log(`  生成坐标的节点: ${result.generatedCount}`)
  console.log(`  用户提供坐标的节点: ${result.providedCount}`)
  console.log(`  执行时间: ${result.executionTime}ms`)
  console.log(`  使用后备算法: ${result.usedFallback}\n`)

  // 分析节点间距
  console.log('节点坐标:')
  result.nodes.forEach(node => {
    console.log(`  ${node.label}: (${node.x?.toFixed(2)}, ${node.y?.toFixed(2)}, ${node.z?.toFixed(2)})`)
  })

  console.log('\n节点间距分析:')
  
  // 计算所有节点对之间的距离
  const distances: number[] = []
  const connectedDistances: number[] = []
  
  for (let i = 0; i < result.nodes.length; i++) {
    for (let j = i + 1; j < result.nodes.length; j++) {
      const node1 = result.nodes[i]
      const node2 = result.nodes[j]
      const distance = calculateDistance(node1, node2)
      distances.push(distance)
      
      // 检查是否有边连接
      const isConnected = edges.some(
        e => (e.source === node1.label && e.target === node2.label) ||
             (e.source === node2.label && e.target === node1.label)
      )
      
      if (isConnected) {
        connectedDistances.push(distance)
        console.log(`  ${node1.label} <-> ${node2.label}: ${distance.toFixed(2)} (已连接)`)
      }
    }
  }

  // 统计信息
  const minDistance = Math.min(...distances)
  const maxDistance = Math.max(...distances)
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
  
  const avgConnectedDistance = connectedDistances.length > 0
    ? connectedDistances.reduce((a, b) => a + b, 0) / connectedDistances.length
    : 0

  console.log('\n距离统计:')
  console.log(`  最小距离: ${minDistance.toFixed(2)}`)
  console.log(`  最大距离: ${maxDistance.toFixed(2)}`)
  console.log(`  平均距离: ${avgDistance.toFixed(2)}`)
  console.log(`  连接节点平均距离: ${avgConnectedDistance.toFixed(2)}`)

  // 验证最小间距
  const minDistanceThreshold = 50
  const tooClose = distances.filter(d => d < minDistanceThreshold)
  
  if (tooClose.length > 0) {
    console.log(`\n⚠️  警告: 有 ${tooClose.length} 对节点距离小于 ${minDistanceThreshold}`)
  } else {
    console.log(`\n✅ 所有节点间距都大于 ${minDistanceThreshold}`)
  }

  // 验证连接节点的距离是否合理
  const expectedConnectedDistance = 100 // springLength
  const connectedDistanceVariance = connectedDistances.map(d => 
    Math.abs(d - expectedConnectedDistance)
  )
  const avgVariance = connectedDistanceVariance.length > 0
    ? connectedDistanceVariance.reduce((a, b) => a + b, 0) / connectedDistanceVariance.length
    : 0

  console.log(`\n连接节点距离分析:`)
  console.log(`  期望距离: ${expectedConnectedDistance}`)
  console.log(`  实际平均距离: ${avgConnectedDistance.toFixed(2)}`)
  console.log(`  平均偏差: ${avgVariance.toFixed(2)}`)

  if (avgVariance < 30) {
    console.log(`  ✅ 连接节点距离合理`)
  } else {
    console.log(`  ⚠️  连接节点距离偏差较大`)
  }

  console.log('\n✅ 节点间距测试完成!')
}

testNodeDistance().catch(console.error)
