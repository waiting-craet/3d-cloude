/**
 * Test script to verify AI API environment variables are loaded
 */

// Load environment variables
import { config } from 'dotenv';
config();

console.log('=== Environment Variables Check ===');
console.log('AI_API_KEY:', process.env.AI_API_KEY ? `${process.env.AI_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('AI_API_ENDPOINT:', process.env.AI_API_ENDPOINT || 'NOT SET');
console.log('');

// Test if we can make a simple API call
async function testAIAPI() {
  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_API_ENDPOINT;

  if (!apiKey || !endpoint) {
    console.error('❌ Environment variables not set!');
    process.exit(1);
  }

  console.log('=== Testing AI API Connection ===');
  console.log('Endpoint:', endpoint);
  console.log('Testing DeepSeek API...');
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond in JSON format.'
          },
          {
            role: 'user',
            content: 'Say hello in JSON format with a "message" field containing "Hello from DeepSeek"'
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('✅ AI API is working correctly!');
    
  } catch (error) {
    console.error('❌ Connection Error:', error);
    process.exit(1);
  }
}

testAIAPI();
