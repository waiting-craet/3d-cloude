/**
 * Test AI Integration Service
 * 
 * This script tests the AI integration service to verify it's working correctly
 */

import { getAIIntegrationService } from '../lib/services/ai-integration';

async function testAIService() {
  console.log('🧪 Testing AI Integration Service...\n');

  try {
    const aiService = getAIIntegrationService();
    
    const testText = `
      Apple Inc. is a technology company founded by Steve Jobs in 1976.
      The company is headquartered in Cupertino, California.
      Apple produces the iPhone, iPad, and Mac computers.
      Tim Cook is the current CEO of Apple.
      Apple has partnerships with many companies including Microsoft and Google.
    `;

    console.log('📝 Test Document:');
    console.log(testText);
    console.log('\n⏳ Analyzing document...\n');

    const result = await aiService.analyzeDocument(testText);

    console.log('✅ Analysis Complete!\n');
    
    console.log('📊 Extracted Entities:');
    result.entities.forEach((entity, index) => {
      console.log(`  ${index + 1}. ${entity.name} (${entity.type})`);
      if (Object.keys(entity.properties).length > 0) {
        console.log(`     Properties: ${JSON.stringify(entity.properties)}`);
      }
    });

    console.log('\n🔗 Extracted Relationships:');
    result.relationships.forEach((rel, index) => {
      console.log(`  ${index + 1}. ${rel.from} --[${rel.type}]--> ${rel.to}`);
      if (Object.keys(rel.properties).length > 0) {
        console.log(`     Properties: ${JSON.stringify(rel.properties)}`);
      }
    });

    console.log('\n📈 Statistics:');
    console.log(`  Total Entities: ${result.entities.length}`);
    console.log(`  Total Relationships: ${result.relationships.length}`);

    console.log('\n✨ AI Service is working correctly!');

  } catch (error) {
    console.error('❌ Error testing AI service:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      console.error(`  ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testAIService();
