#!/usr/bin/env ts-node

/**
 * ArkaneMatch Test Script
 *
 * Tests the conversational scout search system with various scenarios
 *
 * Usage:
 * 1. Ensure server is running: npm run start:dev
 * 2. Set AUTH_TOKEN environment variable with valid JWT token
 * 3. Run: ts-node src/scripts/test-arkane-match.ts
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ Error: AUTH_TOKEN environment variable is required');
  console.error('Usage: AUTH_TOKEN=your_jwt_token ts-node src/scripts/test-arkane-match.ts');
  process.exit(1);
}

// Create axios instance with auth
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Test scenarios
const testScenarios = [
  {
    name: 'Simple search - LaLiga scout',
    message: 'I need a LaLiga scout',
  },
  {
    name: 'Complex search - Bundesliga defenders',
    message: 'Find me a Bundesliga specialist who scouts center backs, speaks German, and costs under 150€ per hour',
  },
  {
    name: 'Vague search - General help',
    message: 'I need help finding a scout',
  },
  {
    name: 'Budget-focused search',
    message: 'Looking for scouts under €100/hr',
  },
  {
    name: 'Position-focused search',
    message: 'I need a scout who specializes in attackers and forwards',
  },
  {
    name: 'Multi-criteria search',
    message: 'Find verified LaLiga scouts for midfielders with 4+ stars',
  },
  {
    name: 'Language requirement',
    message: 'I need a scout who speaks English and Spanish',
  },
  {
    name: 'General question',
    message: 'How does the marketplace work?',
  },
];

// Conversation test (multi-turn)
const conversationTest = [
  'I need a scout for defenders',
  'Actually, I prefer LaLiga specialists',
  'And they should speak Spanish',
  'What is the price range?',
];

/**
 * Test chat endpoint
 */
async function testChat(message: string, conversationId?: string) {
  try {
    const response = await api.post('/api/arkane-match/chat', {
      message,
      conversationId,
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Test get conversation
 */
async function getConversation(conversationId: string) {
  try {
    const response = await api.get(`/api/arkane-match/conversations/${conversationId}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Test info endpoint
 */
async function getInfo() {
  try {
    const response = await api.get('/api/arkane-match/info');
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Print formatted test results
 */
function printResult(scenario: string, result: any, success: boolean = true) {
  console.log('\n' + '='.repeat(80));
  console.log(success ? '✅' : '❌', scenario);
  console.log('='.repeat(80));

  if (!success) {
    console.error('Error:', result.message || result);
    return;
  }

  console.log('\n📝 User Message:', result.userMessage || 'N/A');
  console.log('\n🤖 AI Response:');
  console.log(result.response);

  if (result.intent) {
    console.log('\n🎯 Detected Intent:', result.intent);
  }

  if (result.extractedCriteria && Object.keys(result.extractedCriteria).length > 0) {
    console.log('\n🔍 Extracted Criteria:');
    console.log(JSON.stringify(result.extractedCriteria, null, 2));
  }

  if (result.scouts && result.scouts.length > 0) {
    console.log(`\n👥 Found Scouts: ${result.scouts.length}`);
    result.scouts.slice(0, 2).forEach((scout: any, i: number) => {
      console.log(`\n  ${i + 1}. ${scout.users.firstName} ${scout.users.lastName}`);
      if (scout.headline) console.log(`     ${scout.headline}`);
      if (scout.hourlyRate) console.log(`     Rate: ${scout.currency || 'EUR'}${scout.hourlyRate}/hr`);
    });
  } else {
    console.log('\n👥 Found Scouts: 0');
  }

  if (result.suggestions && result.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    result.suggestions.forEach((s: string) => console.log(`   • ${s}`));
  }

  if (result.conversationId) {
    console.log('\n🆔 Conversation ID:', result.conversationId);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting ArkaneMatch Tests\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Get Info
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Test: Get ArkaneMatch Info');
    console.log('='.repeat(80));

    const info = await getInfo();
    console.log('\n✅ Service Info:');
    console.log(JSON.stringify(info, null, 2));
    passedTests++;
  } catch (error: any) {
    console.error('\n❌ Failed to get info:', error.message);
    failedTests++;
  }

  // Test 2: Single-turn conversations
  for (const scenario of testScenarios) {
    try {
      const result = await testChat(scenario.message);
      printResult(scenario.name, { ...result, userMessage: scenario.message });
      passedTests++;
    } catch (error: any) {
      printResult(scenario.name, error, false);
      failedTests++;
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 3: Multi-turn conversation
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Test: Multi-turn Conversation');
    console.log('='.repeat(80));

    let conversationId: string | undefined;

    for (const message of conversationTest) {
      console.log(`\n👤 User: ${message}`);

      const result = await testChat(message, conversationId);
      conversationId = result.conversationId;

      console.log(`🤖 AI: ${result.response.substring(0, 200)}${result.response.length > 200 ? '...' : ''}`);

      if (result.scouts && result.scouts.length > 0) {
        console.log(`   Found ${result.scouts.length} scout(s)`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Multi-turn conversation completed');
    console.log(`🆔 Final Conversation ID: ${conversationId}`);

    // Test 4: Get conversation history
    if (conversationId) {
      console.log('\n📜 Retrieving conversation history...');
      const history = await getConversation(conversationId);
      console.log(`✅ Retrieved ${history.messageCount || history.messages?.length || 0} messages`);
    }

    passedTests++;
  } catch (error: any) {
    console.error('\n❌ Multi-turn conversation failed:', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Total: ${passedTests + failedTests}`);
  console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test run completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test run failed:', error);
    process.exit(1);
  });
