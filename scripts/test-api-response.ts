/**
 * 测试 API 响应格式
 * 运行: npx tsx scripts/test-api-response.ts
 */

async function main() {
  console.log('🧪 测试 API 响应格式...\n')

  try {
    // 测试 1: 获取所有图谱
    console.log('📊 测试 1: 获取所有图谱')
    const response1 = await fetch('http://localhost:3000/api/gallery/graphs?page=1&pageSize=20&sort=latest')
    const data1 = await response1.json()
    
    console.log(`   状态码: ${response1.status}`)
    console.log(`   总数: ${data1.data.total}`)
    console.log(`   返回项数: ${data1.data.items.length}`)
    
    if (data1.data.items.length > 0) {
      const item = data1.data.items[0]
      console.log(`\n   第一个图谱:`)
      console.log(`   - ID: ${item.id}`)
      console.log(`   - 标题: ${item.title}`)
      console.log(`   - 描述: ${item.description}`)
      console.log(`   - 类型: ${item.type}`)
      console.log(`   - 缩略图: ${item.thumbnail}`)
      console.log(`   - 创建者: ${item.creator.name}`)
      console.log(`   - 节点数: ${item.nodeCount}`)
      console.log(`   - 边数: ${item.edgeCount}`)
    }

    // 测试 2: 获取 3D 图谱
    console.log('\n📊 测试 2: 获取 3D 图谱')
    const response2 = await fetch('http://localhost:3000/api/gallery/graphs?page=1&pageSize=20&type=3d&sort=latest')
    const data2 = await response2.json()
    
    console.log(`   状态码: ${response2.status}`)
    console.log(`   总数: ${data2.data.total}`)
    console.log(`   返回项数: ${data2.data.items.length}`)
    
    data2.data.items.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type})`)
    })

    // 测试 3: 获取 2D 图谱
    console.log('\n📊 测试 3: 获取 2D 图谱')
    const response3 = await fetch('http://localhost:3000/api/gallery/graphs?page=1&pageSize=20&type=2d&sort=latest')
    const data3 = await response3.json()
    
    console.log(`   状态码: ${response3.status}`)
    console.log(`   总数: ${data3.data.total}`)
    console.log(`   返回项数: ${data3.data.items.length}`)
    
    data3.data.items.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type})`)
    })

    console.log('\n✅ API 响应格式测试完成！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

main()
