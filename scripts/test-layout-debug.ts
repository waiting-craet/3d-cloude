/**
 * 测试布局生成算法
 * 用于调试节点间距和分布问题
 */

import { generateLayout } from '../lib/services/graph-import'
import type { NodeData, EdgeData } from '../lib/services/graph-import'

// 创建测试数据：5个节点，4条边（线性连接）
const testNodes: NodeData[] = [
  { label: '使用者', description: '' },
  { label: '仪器', description: '' },
  { label: '实验室', description: '' },
  { label: '学习', description: '' },
  { label: '研究', description: '' }
]

const testEdges: EdgeData[] = [
  { source: '使用者', target: '仪器', label: '使用' },
  { source: '仪器', target: '实验室', label: '位于' },
  { source: '实验室', target: '学习', label: '用于' },
  { source: '学习', target: '研究', label: '促进' }
]

console.log('=== 测试布局生成算法 ===\n')
console.log('输入节点数:', testNodes.length)
console.log('输入边数:', testEdges.length)
console.log('\n原始节点（无坐标）:')
testNodes.forEach(node => {
  console.log(`  ${node.label}: x=${node.x}, y=${node.y}, z=${node.z}`)
})

// 生成布局
const nodesWithLayout = generateLayout(testNodes, testEdges)

console.log('\n生成布局后的节点:')
nodesWithLayout.forEach(node => {
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
    console.log(`  ${n1.label} <-> ${n2.label}: ${dist.toFixed(2)}`)
  }
}

const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length
const minDist = Math.min(...distances)
const maxDist = Math.max(...distances)

console.log('\n统计信息:')
console.log(`  平均距离: ${avgDist.toFixed(2)}`)
console.log(`  最小距离: ${minDist.toFixed(2)}`)
console.log(`  最大距离: ${maxDist.toFixed(2)}`)

// 计算坐标范围
const xCoords = nodesWithLayout.map(n => n.x || 0)
const yCoords = nodesWithLayout.map(n => n.y || 0)
const zCoords = nodesWithLayout.map(n => n.z || 0)

console.log('\n坐标范围:')
console.log(`  X: [${Math.min(...xCoords).toFixed(2)}, ${Math.max(...xCoords).toFixed(2)}]`)
console.log(`  Y: [${Math.min(...yCoords).toFixed(2)}, ${Math.max(...yCoords).toFixed(2)}]`)
console.log(`  Z: [${Math.min(...zCoords).toFixed(2)}, ${Math.max(...zCoords).toFixed(2)}]`)
