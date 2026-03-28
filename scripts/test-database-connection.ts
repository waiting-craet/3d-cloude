/**
 * 数据库连接测试脚本
 * 测试 Neon PostgreSQL 和 Vercel Blob 的连接
 */

import { PrismaClient } from '@prisma/client'
import { put, list } from '@vercel/blob'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...\n')

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试 PostgreSQL 连接...')
    await prisma.$connect()
    console.log('✅ PostgreSQL 连接成功！')

    // 2. 测试数据库查询
    console.log('\n2️⃣ 测试数据库查询...')
    const projectCount = await prisma.project.count()
    const graphCount = await prisma.graph.count()
    const nodeCount = await prisma.node.count()
    const edgeCount = await prisma.edge.count()

    console.log('✅ 数据库查询成功！')
    console.log(`   - 项目数量: ${projectCount}`)
    console.log(`   - 图谱数量: ${graphCount}`)
    console.log(`   - 节点数量: ${nodeCount}`)
    console.log(`   - 边数量: ${edgeCount}`)

    // 3. 测试数据库写入（创建测试项目）
    console.log('\n3️⃣ 测试数据库写入...')
    const testProject = await prisma.project.create({
      data: {
        name: '测试项目 - 连接验证',
        description: '这是一个用于验证数据库连接的测试项目',
      },
    })
    console.log('✅ 数据库写入成功！')
    console.log(`   - 创建的项目 ID: ${testProject.id}`)

    // 4. 测试数据库更新
    console.log('\n4️⃣ 测试数据库更新...')
    const updatedProject = await prisma.project.update({
      where: { id: testProject.id },
      data: { description: '已更新的描述' },
    })
    console.log('✅ 数据库更新成功！')

    // 5. 测试数据库删除
    console.log('\n5️⃣ 测试数据库删除...')
    await prisma.project.delete({
      where: { id: testProject.id },
    })
    console.log('✅ 数据库删除成功！')

    // 6. 测试 Vercel Blob 连接
    console.log('\n6️⃣ 测试 Vercel Blob 存储...')
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // 创建一个测试文件
        const testContent = 'Database connection test - ' + new Date().toISOString()
        const blob = await put('test-connection.txt', testContent, {
          access: 'public',
        })
        console.log('✅ Vercel Blob 写入成功！')
        console.log(`   - Blob URL: ${blob.url}`)

        // 列出 blob
        const { blobs } = await list()
        console.log(`✅ Vercel Blob 读取成功！`)
        console.log(`   - 存储的文件数量: ${blobs.length}`)
      } catch (blobError) {
        console.error('❌ Vercel Blob 测试失败:', blobError)
      }
    } else {
      console.log('⚠️  未配置 BLOB_READ_WRITE_TOKEN，跳过 Blob 测试')
    }

    console.log('\n✅ 所有数据库连接测试通过！')
    console.log('\n📊 数据库信息:')
    console.log(`   - 数据库类型: PostgreSQL (Neon)`)
    console.log(`   - 连接状态: 正常`)
    console.log(`   - 当前数据: ${projectCount} 个项目, ${graphCount} 个图谱, ${nodeCount} 个节点, ${edgeCount} 条边`)

  } catch (error) {
    console.error('\n❌ 数据库连接测试失败:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testDatabaseConnection()
  .then(() => {
    console.log('\n✅ 测试完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  })
