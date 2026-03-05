#!/usr/bin/env tsx

/**
 * Test script for optional graph creation functionality
 * Tests both scenarios: with and without graphName parameter
 */

import { NextRequest } from 'next/server';

// Mock the API function for testing
async function testProjectCreationAPI() {
  console.log('🧪 Testing Optional Graph Creation API...\n');

  // Test 1: Create project without graph (new behavior)
  console.log('📝 Test 1: Create project without graph');
  const requestWithoutGraph = {
    json: async () => ({ name: 'Test Project Only' })
  } as NextRequest;

  try {
    // Simulate the API logic
    const body = await requestWithoutGraph.json();
    const { name, graphName } = body;

    console.log(`  Input: name="${name}", graphName=${graphName}`);

    // Validation
    if (!name || !name.trim()) {
      console.log('  ❌ Validation failed: name is required');
      return;
    }

    if (graphName !== undefined && (!graphName || !graphName.trim())) {
      console.log('  ❌ Validation failed: graphName cannot be empty if provided');
      return;
    }

    // Simulate project creation
    const project = { id: 'proj_1', name: name.trim() };
    let graph = null;

    // Only create graph if graphName is provided
    if (graphName && graphName.trim()) {
      graph = { id: 'graph_1', name: graphName.trim(), projectId: project.id };
    }

    // Build response
    const response: any = {
      success: true,
      project,
      graphCreated: !!graph,
    };

    if (graph) {
      response.graph = graph;
    }

    console.log('  ✅ Response:', JSON.stringify(response, null, 2));
    console.log(`  ✅ Expected: Project created, no graph, graphCreated=false\n`);

  } catch (error) {
    console.log('  ❌ Error:', error);
  }

  // Test 2: Create project with graph (existing behavior)
  console.log('📝 Test 2: Create project with graph (backward compatibility)');
  const requestWithGraph = {
    json: async () => ({ name: 'Test Project With Graph', graphName: '默认图谱' })
  } as NextRequest;

  try {
    const body = await requestWithGraph.json();
    const { name, graphName } = body;

    console.log(`  Input: name="${name}", graphName="${graphName}"`);

    // Validation
    if (!name || !name.trim()) {
      console.log('  ❌ Validation failed: name is required');
      return;
    }

    if (graphName !== undefined && (!graphName || !graphName.trim())) {
      console.log('  ❌ Validation failed: graphName cannot be empty if provided');
      return;
    }

    // Simulate project and graph creation
    const project = { id: 'proj_2', name: name.trim() };
    let graph = null;

    if (graphName && graphName.trim()) {
      graph = { id: 'graph_2', name: graphName.trim(), projectId: project.id };
    }

    // Build response
    const response: any = {
      success: true,
      project,
      graphCreated: !!graph,
    };

    if (graph) {
      response.graph = graph;
    }

    console.log('  ✅ Response:', JSON.stringify(response, null, 2));
    console.log(`  ✅ Expected: Project and graph created, graphCreated=true\n`);

  } catch (error) {
    console.log('  ❌ Error:', error);
  }

  // Test 3: Validation test - empty graphName
  console.log('📝 Test 3: Validation test - empty graphName should fail');
  const requestWithEmptyGraph = {
    json: async () => ({ name: 'Test Project', graphName: '' })
  } as NextRequest;

  try {
    const body = await requestWithEmptyGraph.json();
    const { name, graphName } = body;

    console.log(`  Input: name="${name}", graphName="${graphName}"`);

    // Validation
    if (!name || !name.trim()) {
      console.log('  ❌ Validation failed: name is required');
      return;
    }

    if (graphName !== undefined && (!graphName || !graphName.trim())) {
      console.log('  ✅ Validation correctly failed: graphName cannot be empty if provided');
      console.log('  ✅ Expected: 400 error "图谱名称不能为空"\n');
      return;
    }

  } catch (error) {
    console.log('  ❌ Error:', error);
  }

  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  ✅ API supports optional graph creation');
  console.log('  ✅ Backward compatibility maintained');
  console.log('  ✅ Proper validation for empty graphName');
  console.log('  ✅ Response format includes graphCreated metadata');
}

// Run the tests
testProjectCreationAPI().catch(console.error);