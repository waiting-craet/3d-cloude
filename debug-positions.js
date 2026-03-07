// 调试脚本 - 检查图谱的位置数据
// 用法: node debug-positions.js <graphId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPositions() {
  const graphId = process.argv[2];
  
  if (!graphId) {
    console.log('用法: node debug-positions.js <graphId>');
    process.exit(1);
  }

  try {
    console.log('🔍 查询图谱:', graphId);
    
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: {
        id: true,
        name: true,
        settings: true,
        updatedAt: true
      }
    });

    if (!graph) {
      console.log('❌ 图谱不存在');
      process.exit(1);
    }

    console.log('\n📊 图谱信息:');
    console.log('  名称:', graph.name);
    console.log('  更新时间:', graph.updatedAt);
    console.log('\n📝 Settings字段:');
    
    if (!graph.settings) {
      console.log('  ⚠️ settings为null');
    } else {
      try {
        const settings = JSON.parse(graph.settings);
        console.log('  原始JSON:', graph.settings);
        console.log('\n  解析后的对象:', JSON.stringify(settings, null, 2));
        
        if (settings.workflowPositions) {
          console.log('\n✅ 包含workflowPositions:');
          console.log('  节点数量:', settings.workflowPositions.nodes?.length || 0);
          console.log('  最后保存时间:', settings.workflowPositions.lastSaved);
          console.log('  节点位置:');
          settings.workflowPositions.nodes?.forEach((node, i) => {
            console.log(`    ${i + 1}. ID: ${node.id}, X: ${node.x}, Y: ${node.y}`);
          });
          if (settings.workflowPositions.metadata) {
            console.log('  画布metadata:', settings.workflowPositions.metadata);
          }
        } else {
          console.log('\n⚠️ 不包含workflowPositions');
        }
      } catch (error) {
        console.log('  ❌ JSON解析失败:', error.message);
        console.log('  原始内容:', graph.settings);
      }
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPositions();
