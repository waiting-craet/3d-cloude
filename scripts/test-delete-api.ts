/**
 * 测试删除 API 功能
 * 
 * 使用方法：
 * npx ts-node scripts/test-delete-api.ts
 */

async function testDeleteAPI() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('=== 测试删除 API ===\n')
  
  try {
    // 1. 获取所有项目
    console.log('1. 获取所有项目...')
    const projectsRes = await fetch(`${baseUrl}/api/projects`)
    const projectsData = await projectsRes.json()
    const projects = projectsData.projects || []
    
    console.log(`   找到 ${projects.length} 个项目`)
    
    if (projects.length === 0) {
      console.log('   ⚠️  没有项目可以测试删除功能')
      console.log('   请先创建一个测试项目')
      return
    }
    
    // 显示所有项目
    projects.forEach((project: any, index: number) => {
      console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`)
    })
    
    // 2. 选择第一个项目进行测试
    const testProject = projects[0]
    console.log(`\n2. 测试删除项目: ${testProject.name}`)
    console.log(`   项目 ID: ${testProject.id}`)
    
    // 3. 获取项目详情
    console.log('\n3. 获取项目详情...')
    const projectRes = await fetch(`${baseUrl}/api/projects/${testProject.id}`)
    const projectData = await projectRes.json()
    
    console.log(`   节点数: ${projectData.nodes?.length || 0}`)
    console.log(`   边数: ${projectData.edges?.length || 0}`)
    
    // 4. 测试删除（注意：这会真的删除数据！）
    console.log('\n4. 执行删除操作...')
    console.log('   ⚠️  警告：这将真的删除项目！')
    console.log('   如果不想删除，请按 Ctrl+C 退出')
    console.log('   等待 5 秒...')
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const deleteRes = await fetch(`${baseUrl}/api/projects/${testProject.id}`, {
      method: 'DELETE',
    })
    
    if (!deleteRes.ok) {
      const errorData = await deleteRes.json()
      console.error('   ❌ 删除失败:', errorData.error)
      console.error('   详情:', errorData.details)
      return
    }
    
    const deleteData = await deleteRes.json()
    console.log('   ✅ 删除成功!')
    console.log(`   删除的节点数: ${deleteData.deletedNodeCount}`)
    console.log(`   删除的边数: ${deleteData.deletedEdgeCount}`)
    console.log(`   删除的文件数: ${deleteData.deletedFileCount || 0}`)
    
    // 5. 验证删除
    console.log('\n5. 验证删除结果...')
    const verifyRes = await fetch(`${baseUrl}/api/projects/${testProject.id}`)
    
    if (verifyRes.status === 404) {
      console.log('   ✅ 验证成功：项目已被删除')
    } else {
      console.log('   ❌ 验证失败：项目仍然存在')
    }
    
    console.log('\n=== 测试完成 ===')
    
  } catch (error) {
    console.error('测试过程中出错:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
      console.error('错误堆栈:', error.stack)
    }
  }
}

// 运行测试
testDeleteAPI()
