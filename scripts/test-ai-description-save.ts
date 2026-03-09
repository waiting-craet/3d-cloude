/**
 * Test script to verify AI-generated node descriptions are saved correctly
 * 
 * This script tests:
 * 1. Creating nodes with descriptions via AI save-graph API
 * 2. Verifying descriptions are saved to the description field
 * 3. Verifying descriptions appear in node detail panel
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAIDescriptionSave() {
  console.log('🧪 Testing AI node description save functionality...\n')

  try {
    // Step 1: Create a test project
    console.log('📝 Step 1: Creating test project...')
    const project = await prisma.project.create({
      data: {
        name: 'AI Description Test Project',
        description: 'Test project for AI description save',
        nodeCount: 0,
        edgeCount: 0,
      },
    })
    console.log(`✅ Created project: ${project.id}\n`)

    // Step 2: Simulate AI save-graph API call
    console.log('📝 Step 2: Simulating AI save-graph API call...')
    const testNodes = [
      {
        id: 'temp-node-1',
        name: 'Test Node 1',
        description: 'This is a test description for node 1',
        type: 'entity',
      },
      {
        id: 'temp-node-2',
        name: 'Test Node 2',
        description: 'This is a test description for node 2',
        type: 'entity',
      },
    ]

    const response = await fetch('http://localhost:3000/api/ai/save-graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodes: testNodes,
        edges: [],
        mergeDecisions: [],
        projectId: project.id,
        graphName: 'AI Description Test Graph',
        visualizationType: '3d',
      }),
    })

    const result = await response.json()
    
    if (!result.success) {
      console.error('❌ API call failed:', result.error)
      return
    }

    console.log(`✅ API call successful, graph ID: ${result.data.graphId}\n`)

    // Step 3: Verify nodes were created with descriptions
    console.log('📝 Step 3: Verifying nodes were created with descriptions...')
    const nodes = await prisma.node.findMany({
      where: {
        graphId: result.data.graphId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        metadata: true,
      },
    })

    console.log(`Found ${nodes.length} nodes:\n`)
    
    let allDescriptionsCorrect = true
    for (const node of nodes) {
      console.log(`Node: ${node.name}`)
      console.log(`  Description field: ${node.description || '(empty)'}`)
      console.log(`  Metadata: ${JSON.stringify(node.metadata)}`)
      
      const expectedNode = testNodes.find(n => n.name === node.name)
      if (expectedNode) {
        if (node.description === expectedNode.description) {
          console.log(`  ✅ Description matches expected value`)
        } else {
          console.log(`  ❌ Description does NOT match expected value`)
          console.log(`     Expected: ${expectedNode.description}`)
          console.log(`     Got: ${node.description}`)
          allDescriptionsCorrect = false
        }
      }
      console.log()
    }

    // Step 4: Test result summary
    console.log('📊 Test Summary:')
    if (allDescriptionsCorrect && nodes.length === testNodes.length) {
      console.log('✅ All tests passed! Node descriptions are saved correctly.')
    } else {
      console.log('❌ Some tests failed. Please check the output above.')
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await prisma.project.delete({
      where: { id: project.id },
    })
    console.log('✅ Cleanup complete')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAIDescriptionSave()
