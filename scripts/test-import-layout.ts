/**
 * 测试导入布局生成
 * 验证力导向布局算法是否正确生成节点坐标
 */

import { generateLayout } from '../lib/services/graph-import'

// 测试数据：4个节点，3条边
const testNodes = [
  { id: '1', label: '使用者', description: '' },
  { id: '2', label: '仪器', description: '' },
  { id: '3', label: '实验室', description: '' },
  { id: '4', label: '学习', description: '' }
]

const testEdges = [
  { source: '1', target: '2', label: '使用' },
  { source: '2', target: '3', label: '位于' },
  { source: '1', target: '4', label: '进行' }
]

console.log('测试导入布局生成...\n')
console.log('输入节点（无坐标）:')
console.log(JSON.stringify(testNodes, null, 2))
console.log('\n输入边:')
console.log(JSON.stringify(testEdges, null, 2))

// 生成布局
const nodesWithLayout = generateLayout(testNodes, testEdges)

console.log('\n生成的节点坐标:')
nodesWithLayout.forEach(node => {
  console.log(`${node.label}: x=${node.x?.toFixed(2)}, y=${node.y?.toFixed(2)}, z=${node.z?.toFixed(2)}`)
})

// 计算节点间距离
console.log('\n节点间距离:')
for (let i = 0; i < nodesWithLayout.length; i++) {
  for (let j = i + 1; j < nodesWithLayout.length; j++) {
    const n1 = nodesWithLayout[i]
    const n2 = nodesWithLayout[j]
    const dx = (n1.x || 0) - (n2.x || 0)
    const dy = (n1.y || 0) - (n2.y || 0)
    const dz = (n1.z || 0) - (n2.z || 0)
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    console.log(`${n1.label} <-> ${n2.label}: ${distance.toFixed(2)}`)
  }
}

// 检查是否所有坐标都是0
const allZero = nodesWithLayout.every(n => n.x === 0 && n.y === 0 && n.z === 0)
if (allZero) {
  console.log('\n❌ 错误：所有节点坐标都是0！')
} else {
  console.log('\n✅ 成功：节点坐标已生成')
}
