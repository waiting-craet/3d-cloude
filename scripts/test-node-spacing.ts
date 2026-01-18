/**
 * 测试节点间距算法
 * 
 * 这个脚本用于验证智能动态间距系统
 */

import { convertTo3DCoordinates, type Node2D } from '../lib/coordinate-converter'

// 创建测试节点
function createTestNodes(count: number): Node2D[] {
  const nodes: Node2D[] = []
  
  // 在一个网格中创建节点
  const gridSize = Math.ceil(Math.sqrt(count))
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize)
    const col = i % gridSize
    
    nodes.push({
      id: `node-${i}`,
      label: `节点 ${i + 1}`,
      description: `测试节点 ${i + 1}`,
      x: col * 100,
      y: row * 100,
    })
  }
  
  return nodes
}

// 计算平均节点距离
function calculateAverageDistance(nodes: any[]): number {
  if (nodes.length <= 1) return 0
  
  let totalDistance = 0
  let count = 0
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x3d - nodes[i].x3d
      const dy = nodes[j].y3d - nodes[i].y3d
      const dz = nodes[j].z3d - nodes[i].z3d
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      totalDistance += distance
      count++
    }
  }
  
  return totalDistance / count
}

// 找到最小节点距离
function findMinimumDistance(nodes: any[]): number {
  if (nodes.length <= 1) return Infinity
  
  let minDistance = Infinity
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x3d - nodes[i].x3d
      const dy = nodes[j].y3d - nodes[i].y3d
      const dz = nodes[j].z3d - nodes[i].z3d
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (distance < minDistance) {
        minDistance = distance
      }
    }
  }
  
  return minDistance
}

// 测试不同数量的节点
console.log('🧪 测试智能动态间距系统\n')
console.log('=' .repeat(80))

const testCases = [5, 10, 20, 50, 100, 150]

for (const nodeCount of testCases) {
  const nodes2d = createTestNodes(nodeCount)
  
  // 转换为 3D 坐标
  const nodes3d = nodes2d.map(node => 
    convertTo3DCoordinates(node, nodes2d, {
      heightVariation: 5,
      minNodeDistance: 6,
    })
  )
  
  // 计算统计数据
  const avgDistance = calculateAverageDistance(nodes3d)
  const minDistance = findMinimumDistance(nodes3d)
  
  // 确定间距因子（从算法中复制）
  let spacingFactor = 1.0
  if (nodeCount <= 10) {
    spacingFactor = 1.0
  } else if (nodeCount <= 20) {
    spacingFactor = 1.5
  } else if (nodeCount <= 50) {
    spacingFactor = 2.0
  } else if (nodeCount <= 100) {
    spacingFactor = 2.5
  } else {
    spacingFactor = 3.0
  }
  
  console.log(`\n📊 节点数量: ${nodeCount}`)
  console.log(`   间距因子: ${spacingFactor}x`)
  console.log(`   平均距离: ${avgDistance.toFixed(2)} 单位`)
  console.log(`   最小距离: ${minDistance.toFixed(2)} 单位`)
  console.log(`   最小距离要求: 6.00 单位`)
  console.log(`   ✅ 符合要求: ${minDistance >= 6 ? '是' : '否'}`)
}

console.log('\n' + '='.repeat(80))
console.log('✅ 测试完成！\n')
