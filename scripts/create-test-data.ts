/**
 * 创建测试数据
 * 用于测试项目-图谱-节点系统
 */

async function createTestData() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🚀 开始创建测试数据...\n')

  try {
    // 1. 创建项目
    console.log('📁 创建项目...')
    const projectRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试项目',
        description: '这是一个测试项目'
      })
    })
    
    if (!projectRes.ok) {
      throw new Error('创建项目失败')
    }
    
    const projectData = await projectRes.json()
    const project = projectData.project
    console.log(`✅ 项目创建成功: ${project.name} (${project.id})\n`)

    // 2. 创建图谱A
    console.log('🗺️  创建图谱A...')
    const graphARes = await fetch(`${baseUrl}/api/projects/${project.id}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '知识图谱A',
        description: '第一个测试图谱'
      })
    })
    
    if (!graphARes.ok) {
      throw new Error('创建图谱A失败')
    }
    
    const graphAData = await graphARes.json()
    const graphA = graphAData.graph
    console.log(`✅ 图谱A创建成功: ${graphA.name} (${graphA.id})\n`)

    // 3. 在图谱A中创建节点
    console.log('📍 在图谱A中创建节点...')
    const nodesA = []
    
    for (let i = 1; i <= 5; i++) {
      const nodeRes = await fetch(`${baseUrl}/api/graphs/${graphA.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `概念${i}`,
          type: 'concept',
          description: `这是图谱A的第${i}个概念`,
          x: Math.cos((i - 1) * Math.PI * 2 / 5) * 5,
          y: Math.sin((i - 1) * Math.PI * 2 / 5) * 5,
          z: 0,
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i - 1],
          size: 1.5 + Math.random() * 0.5,
        })
      })
      
      if (nodeRes.ok) {
        const nodeData = await nodeRes.json()
        nodesA.push(nodeData.node)
        console.log(`  ✓ 节点${i}创建成功`)
      }
    }
    console.log(`✅ 图谱A创建了 ${nodesA.length} 个节点\n`)

    // 4. 在图谱A中创建边
    console.log('🔗 在图谱A中创建边...')
    let edgeCount = 0
    for (let i = 0; i < nodesA.length; i++) {
      const nextIndex = (i + 1) % nodesA.length
      const edgeRes = await fetch(`${baseUrl}/api/graphs/${graphA.id}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNodeId: nodesA[i].id,
          toNodeId: nodesA[nextIndex].id,
          label: 'RELATES_TO',
          weight: 1.0,
        })
      })
      
      if (edgeRes.ok) {
        edgeCount++
      }
    }
    console.log(`✅ 图谱A创建了 ${edgeCount} 条边\n`)

    // 5. 创建图谱B
    console.log('🗺️  创建图谱B...')
    const graphBRes = await fetch(`${baseUrl}/api/projects/${project.id}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '知识图谱B',
        description: '第二个测试图谱'
      })
    })
    
    if (!graphBRes.ok) {
      throw new Error('创建图谱B失败')
    }
    
    const graphBData = await graphBRes.json()
    const graphB = graphBData.graph
    console.log(`✅ 图谱B创建成功: ${graphB.name} (${graphB.id})\n`)

    // 6. 在图谱B中创建节点
    console.log('📍 在图谱B中创建节点...')
    const nodesB = []
    
    for (let i = 1; i <= 3; i++) {
      const nodeRes = await fetch(`${baseUrl}/api/graphs/${graphB.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `实体${i}`,
          type: 'entity',
          description: `这是图谱B的第${i}个实体`,
          x: (i - 2) * 4,
          y: 0,
          z: 0,
          color: ['#FFD93D', '#6BCF7F', '#A78BFA'][i - 1],
          size: 2.0,
        })
      })
      
      if (nodeRes.ok) {
        const nodeData = await nodeRes.json()
        nodesB.push(nodeData.node)
        console.log(`  ✓ 节点${i}创建成功`)
      }
    }
    console.log(`✅ 图谱B创建了 ${nodesB.length} 个节点\n`)

    // 7. 在图谱B中创建边
    console.log('🔗 在图谱B中创建边...')
    edgeCount = 0
    for (let i = 0; i < nodesB.length - 1; i++) {
      const edgeRes = await fetch(`${baseUrl}/api/graphs/${graphB.id}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNodeId: nodesB[i].id,
          toNodeId: nodesB[i + 1].id,
          label: 'CONNECTS_TO',
          weight: 1.5,
        })
      })
      
      if (edgeRes.ok) {
        edgeCount++
      }
    }
    console.log(`✅ 图谱B创建了 ${edgeCount} 条边\n`)

    // 8. 显示总结
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 测试数据创建完成！\n')
    console.log('📊 数据统计:')
    console.log(`  项目: ${project.name}`)
    console.log(`    └─ 图谱A: ${graphA.name} (${nodesA.length} 节点, 5 边)`)
    console.log(`    └─ 图谱B: ${graphB.name} (${nodesB.length} 节点, 2 边)`)
    console.log('\n💡 现在你可以在网站上选择不同的图谱查看数据了！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
    throw error
  }
}

// 运行
createTestData()
  .then(() => {
    console.log('\n✅ 完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 失败:', error)
    process.exit(1)
  })
