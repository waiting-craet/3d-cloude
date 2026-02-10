/**
 * Test script for AI API integration
 * Tests the AI service directly to diagnose issues
 */

import { createAIIntegrationService } from '../lib/services/ai-integration';

async function testAIAPI() {
  console.log('🧪 Testing AI API Integration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  AI_API_KEY:', process.env.AI_API_KEY ? `${process.env.AI_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('  AI_API_ENDPOINT:', process.env.AI_API_ENDPOINT || 'NOT SET');
  console.log('');

  try {
    // Create AI service
    console.log('🔧 Creating AI Integration Service...');
    const aiService = createAIIntegrationService();
    console.log('✅ Service created successfully\n');

    // Test document
    const testDocument = `
      John Smith works at Microsoft Corporation in Seattle.
      Microsoft is a technology company founded by Bill Gates.
      Seattle is located in Washington State.
    `;

    console.log('📄 Test Document:');
    console.log(testDocument);
    console.log('');

    // Call AI API
    console.log('🤖 Calling AI API...');
    const startTime = Date.now();
    
    const result = await aiService.analyzeDocument(testDocument);
    
    const duration = Date.now() - startTime;
    console.log(`✅ AI API call successful (${duration}ms)\n`);

    // Display results
    console.log('📊 Results:');
    console.log('  Entities:', result.entities.length);
    result.entities.forEach((entity, i) => {
      console.log(`    ${i + 1}. ${entity.name} (${entity.type})`);
    });
    console.log('');
    console.log('  Relationships:', result.relationships.length);
    result.relationships.forEach((rel, i) => {
      console.log(`    ${i + 1}. ${rel.from} --[${rel.type}]--> ${rel.to}`);
    });
    console.log('');

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error instanceof Error) {
      console.error('  Message:', error.message);
      console.error('  Stack:', error.stack);
    } else {
      console.error('  Error:', error);
    }
    process.exit(1);
  }
}

// Run test
testAIAPI();
