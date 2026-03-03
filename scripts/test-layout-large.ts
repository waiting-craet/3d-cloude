/**
 * 测试布局生成算法 - 大数据集
 */

import { generateLayout } from '../lib/services/graph-import'
import type { NodeData, EdgeData } from '../lib/services/graph-import'

// 创建测试数据：20个节点，形成一个更复杂的图结构
const testNodes: NodeData[] = Array.from({ length: 20 }, (_, i) => ({
  label: `节点${i + 1}`,
  description: ''
}))

// 创建一些边：混合线性和网状结构
const testEdges: EdgeData[] = [
  // 主链
  ...Array.from({ length: 19 }, (_, i) => ({
    source: `节点${i + 1}`,
    target: `节点${i + 2}`,
    label: '连接'
  })),
  // 交叉连接
  { source: '节点1', target: '节点10', label: '跨越' },
  { source: '节点5', target: '节点15', label: '跨越' },
  { source: '节点10', target: '节点20', label: '跨越' },
  { source: '节点3', target: '节点8', label: '跨越' },
  { source: '节点12', target: '节点18', label: '跨越' }
]

console.log('=== 测试布局生成算法（大数据集）===\n')
console.log('输入节点数:', testNodes.length)
console.log('输入边数:', testEdges.length)

// 生成布局
const nodesWithLayout = generateLayout(testNodes, testEdges)

console.log('\n前5个节点的坐标:')
nodesWithLayout.slice(0, 5).forEach(node => {
  console.log(`  ${node.label}: x=${node.x?.toFixed(2)}, y=${node.y?.toFixed(2)}, z=${node.z?.toFixed(2)}`)
})

// 计算节点间距统计
console.log('\n=== 节点间距分析 ===')
const distances: number[] = []
for (let i = 0; i < nodesWithLayout.length; i++) {
  for (let j = i + 1; j < nodesWithLayout.length; j++) {
    const n1 = nodesWithLayout[i]
    const n2 = nodesWithLayout[j]
    const dx = (n1.x || 0) - (n2.x || 0)
    const dy = (n1.y || 0) - (n2.y || 0)
    const dz = (n1.z || 0) - (n2.z || 0)
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    distances.push(dist)
  }
}

const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length
const minDist = Math.min(...distances)
const maxDist = Math.max(...distances)

console.log('统计信息:')
console.log(`  平均距离: ${avgDist.toFixed(2)}`)
console.log(`  最小距离: ${minDist.toFixed(2)}`)
console.log(`  最大距离: ${maxDist.toFixed(2)}`)

// 计算坐标范围
const xCoords = nodesWithLayout.map(n => n.x || 0)
const yCoords = nodesWithLayout.map(n => n.y || 0)
const zCoords = nodesWithLayout.map(n => n.z || 0)

const xRange = Math.max(...xCoords) - Math.min(...xCoords)
const yRange = Math.max(...yCoords) - Math.min(...yCoords)
const zRange = Math.max(...zCoords) - Math.min(...zCoords)

console.log('\n坐标范围:')
console.log(`  X: [${Math.min(...xCoords).toFixed(2)}, ${Math.max(...xCoords).toFixed(2)}] (范围: ${xRange.toFixed(2)})`)
console.log(`  Y: [${Math.min(...yCoords).toFixed(2)}, ${Math.max(...yCoords).toFixed(2)}] (范围: ${yRange.toFixed(2)})`)
console.log(`  Z: [${Math.min(...zCoords).toFixed(2)}, ${Math.max(...zCoords).toFixed(2)}] (范围: ${zRange.toFixed(2)})`)

// 检查分布均匀性
const avgRange = (xRange + yRange + zRange) / 3
const maxDeviation = Math.max(
  Math.abs(xRange - avgRange),
  Math.abs(yRange - avgRange),
  Math.abs(zRange - avgRange)
)
const uniformity = 1 - (maxDeviation / avgRange)

console.log(`\n分布均匀性: ${(uniformity * 100).toFixed(1)}% (越接近100%越均匀)`)
