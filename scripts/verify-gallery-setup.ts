/**
 * 验证首页图库设置
 * 运行: npx tsx scripts/verify-gallery-setup.ts
 */

import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🔍 验证首页图库设置...\n')

  let allPassed = true

  // 检查 1: 数据库连接
  console.log('✓ 检查 1: 数据库连接')
  try {
    const graphCount = await prisma.graph.count()
    console.log(`  ✅ 数据库连接成功，找到 ${graphCount} 个图谱\n`)
  } catch (error) {
    console.log(`  ❌ 数据库连接失败: ${error}\n`)
    allPassed = false
  }

  // 检查 2: 3D 图谱数据
  console.log('✓ 检查 2: 3D 图谱数据')
  try {
    const graphs3d = await prisma.graph.findMany({
      where: {
        settings: {
          contains: '"graphType":"3d"',
        },
      },
    })
    if (graphs3d.length > 0) {
      console.log(`  ✅ 找到 ${graphs3d.length} 个 3D 图谱`)
      graphs3d.forEach((g) => {
        console.log(`     - ${g.name} (${g.nodeCount} 节点, ${g.edgeCount} 边)`)
      })
    } else {
      console.log(`  ⚠️  未找到 3D 图谱，请运行 npm run db:seed`)
      allPassed = false
    }
    console.log()
  } catch (error) {
    console.log(`  ❌ 查询 3D 图谱失败: ${error}\n`)
    allPassed = false
  }

  // 检查 3: 2D 图谱数据
  console.log('✓ 检查 3: 2D 图谱数据')
  try {
    const graphs2d = await prisma.graph.findMany({
      where: {
        settings: {
          contains: '"graphType":"3d"',  // 系统已统一为3D
        },
      },
    })
    if (graphs2d.length > 0) {
      console.log(`  ✅ 找到 ${graphs2d.length} 个 2D 图谱`)
      graphs2d.forEach((g) => {
        console.log(`     - ${g.name} (${g.nodeCount} 节点, ${g.edgeCount} 边)`)
      })
    } else {
      console.log(`  ⚠️  未找到 2D 图谱，请运行 npm run db:seed`)
      allPassed = false
    }
    console.log()
  } catch (error) {
    console.log(`  ❌ 查询 2D 图谱失败: ${error}\n`)
    allPassed = false
  }

  // 检查 4: 节点图片数据
  console.log('✓ 检查 4: 节点图片数据')
  try {
    const nodesWithImages = await prisma.node.findMany({
      where: {
        imageUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        graphId: true,
      },
      take: 5,
    })
    if (nodesWithImages.length > 0) {
      console.log(`  ✅ 找到 ${nodesWithImages.length} 个有图片的节点`)
      nodesWithImages.forEach((n) => {
        console.log(`     - ${n.name}: ${n.imageUrl?.substring(0, 50)}...`)
      })
    } else {
      console.log(`  ⚠️  未找到有图片的节点`)
      allPassed = false
    }
    console.log()
  } catch (error) {
    console.log(`  ❌ 查询节点图片失败: ${error}\n`)
    allPassed = false
  }

  // 检查 5: API 文件存在
  console.log('✓ 检查 5: API 文件存在')
  const apiFile = path.join(process.cwd(), 'app/api/gallery/graphs/route.ts')
  if (fs.existsSync(apiFile)) {
    console.log(`  ✅ API 文件存在: app/api/gallery/graphs/route.ts\n`)
  } else {
    console.log(`  ❌ API 文件不存在: app/api/gallery/graphs/route.ts\n`)
    allPassed = false
  }

  // 检查 6: Hook 文件存在
  console.log('✓ 检查 6: Hook 文件存在')
  const hookFile = path.join(process.cwd(), 'lib/hooks/useGalleryGraphs.ts')
  if (fs.existsSync(hookFile)) {
    console.log(`  ✅ Hook 文件存在: lib/hooks/useGalleryGraphs.ts\n`)
  } else {
    console.log(`  ❌ Hook 文件不存在: lib/hooks/useGalleryGraphs.ts\n`)
    allPassed = false
  }

  // 检查 7: 组件文件存在
  console.log('✓ 检查 7: 组件文件存在')
  const components = [
    'components/gallery/FilterBar.tsx',
    'components/gallery/GalleryGrid.tsx',
    'components/gallery/GraphCard.tsx',
  ]
  let allComponentsExist = true
  for (const comp of components) {
    const compFile = path.join(process.cwd(), comp)
    if (fs.existsSync(compFile)) {
      console.log(`  ✅ ${comp}`)
    } else {
      console.log(`  ❌ ${comp}`)
      allComponentsExist = false
      allPassed = false
    }
  }
  console.log()

  // 最终结果
  console.log('═'.repeat(50))
  if (allPassed) {
    console.log('✅ 所有检查通过！首页图库已准备就绪。')
    console.log('\n📝 后续步骤:')
    console.log('  1. 运行 npm run dev 启动开发服务器')
    console.log('  2. 访问 http://localhost:3000 查看首页')
    console.log('  3. 测试筛选功能 (3D/2D/模板)')
    console.log('  4. 测试分页功能')
  } else {
    console.log('❌ 某些检查失败，请查看上面的错误信息。')
    console.log('\n💡 常见问题:')
    console.log('  - 如果没有图谱数据，请运行: npm run db:seed')
    console.log('  - 如果数据库连接失败，请检查 DATABASE_URL 环境变量')
    console.log('  - 如果文件不存在，请检查文件路径是否正确')
  }
  console.log('═'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ 验证失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
