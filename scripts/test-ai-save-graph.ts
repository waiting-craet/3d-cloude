/**
 * Test script for AI save-graph API endpoint
 * 
 * This script helps debug the save-graph functionality by:
 * 1. Creating a test project
 * 2. Sending a test save-graph request
 * 3. Logging detailed request/response information
 */

async function testSaveGraph() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== AI Save Graph Test ===\n');
  
  // Step 1: Create a test project
  console.log('Step 1: Creating test project...');
  const projectResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Test Project ${Date.now()}`,
    }),
  });
  
  const projectResult = await projectResponse.json();
  console.log('Project creation response:', projectResult);
  
  if (!projectResult.project) {
    console.error('Failed to create project');
    return;
  }
  
  const projectId = projectResult.project.id;
  console.log(`✓ Project created: ${projectId}\n`);
  
  // Step 2: Prepare test graph data
  console.log('Step 2: Preparing test graph data...');
  const testData = {
    nodes: [
      {
        id: 'temp-node-1',
        name: '节点1',
        type: 'entity',
        properties: { description: '测试节点1' },
      },
      {
        id: 'temp-node-2',
        name: '节点2',
        type: 'entity',
        properties: { description: '测试节点2' },
      },
    ],
    edges: [
      {
        id: 'temp-edge-1',
        fromNodeId: 'temp-node-1',
        toNodeId: 'temp-node-2',
        label: '关联',
        properties: {},
      },
    ],
    mergeDecisions: [],
    projectId: projectId,
    graphName: `测试图谱 ${new Date().toLocaleString('zh-CN')}`,
    visualizationType: '3d',
  };
  
  console.log('Test data structure:', {
    nodeCount: testData.nodes.length,
    edgeCount: testData.edges.length,
    projectId: testData.projectId,
    graphName: testData.graphName,
    hasNodes: !!testData.nodes,
    hasEdges: !!testData.edges,
    nodesIsArray: Array.isArray(testData.nodes),
    edgesIsArray: Array.isArray(testData.edges),
  });
  console.log('');
  
  // Step 3: Send save-graph request
  console.log('Step 3: Sending save-graph request...');
  const saveResponse = await fetch(`${baseUrl}/api/ai/save-graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData),
  });
  
  console.log('Response status:', saveResponse.status);
  console.log('Response ok:', saveResponse.ok);
  
  const saveResult = await saveResponse.json();
  console.log('Response body:', JSON.stringify(saveResult, null, 2));
  
  if (saveResult.success) {
    console.log('\n✓ Graph saved successfully!');
    console.log('Graph ID:', saveResult.data.graphId);
    console.log('Graph Name:', saveResult.data.graphName);
    console.log('Nodes Created:', saveResult.data.nodesCreated);
    console.log('Edges Created:', saveResult.data.edgesCreated);
  } else {
    console.error('\n✗ Save failed:', saveResult.error);
  }
}

// Run the test
testSaveGraph().catch(console.error);
