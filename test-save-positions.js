// 简单的API测试脚本
// 用法: node test-save-positions.js

const testSavePositions = async () => {
  const testData = {
    graphId: 'test-graph-id',
    nodes: [
      { id: 'node1', x: 100, y: 200 },
      { id: 'node2', x: 300, y: 400 }
    ],
    metadata: {
      scale: 1.0,
      offset: { x: 0, y: 0 }
    }
  };

  try {
    console.log('🧪 测试保存位置API...');
    console.log('📤 发送数据:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/graphs/save-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📥 响应状态:', response.status);
    console.log('📥 响应数据:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ 测试通过！');
    } else {
      console.log('❌ 测试失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试出错:', error);
  }
};

testSavePositions();
