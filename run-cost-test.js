/**
 * Simple Cost Test Runner
 * 
 * Run this script to test chatbot costs with real API calls
 */

// Environment variables loaded via tsx -r dotenv/config

console.log('🧪 Chatbot Cost Analysis Test Runner');
console.log('=====================================\n');

// Import the cost tester
import { ChatbotCostTester } from './test-chatbot-cost-analysis.js';

async function runQuickTest() {
  console.log('🚀 Starting Quick Cost Test...\n');
  
  const tester = new ChatbotCostTester();
  
  // Test with just one video and fewer questions for quick results
  const quickTestVideo = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - short video
  const quickTestQuestions = [
    "What is the main topic of this video?",
    "Can you summarize what happens in the video?",
    "Who is the main person in this video?"
  ];

  console.log(`📺 Testing with: Rick Astley - Never Gonna Give You Up`);
  console.log(`❓ ${quickTestQuestions.length} test questions\n`);

  try {
    // Test all three approaches
    console.log('1️⃣ Testing Current Approach (Pre-processed)...');
    const currentResult = await tester.testCurrentApproach(quickTestVideo, quickTestQuestions);
    
    console.log('2️⃣ Testing Full Reprocessing Approach...');
    const reprocessingResult = await tester.testFullReprocessing(quickTestVideo, quickTestQuestions);
    
    console.log('3️⃣ Testing RAG Approach (Simulated)...');
    const ragResult = await tester.testRAGApproach(quickTestVideo, quickTestQuestions);

    // Print results
    tester.printVideoComparison('Rick Astley Test', currentResult, reprocessingResult, ragResult);
    
    console.log('\n🎯 Quick Test Results:');
    console.log('─'.repeat(40));
    console.log(`Current approach cost:    $${currentResult.totalCost.toFixed(4)}`);
    console.log(`Full reprocessing cost:   $${reprocessingResult.totalCost.toFixed(4)}`);
    console.log(`RAG approach cost:        $${ragResult.totalCost.toFixed(4)}`);
    
    const savings = ((reprocessingResult.totalCost - ragResult.totalCost) / reprocessingResult.totalCost * 100);
    console.log(`\n💡 RAG saves ${savings.toFixed(1)}% compared to reprocessing!`);
    
    if (ragResult.totalCost < currentResult.totalCost) {
      const currentSavings = ((currentResult.totalCost - ragResult.totalCost) / currentResult.totalCost * 100);
      console.log(`💡 RAG saves ${currentSavings.toFixed(1)}% compared to current approach!`);
    }

    return {
      current: currentResult,
      reprocessing: reprocessingResult,
      rag: ragResult
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Full Cost Analysis...\n');
  
  const tester = new ChatbotCostTester();
  return await tester.runCostAnalysis();
}

// Check command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'quick';

if (testType === 'full') {
  runFullTest().then(() => {
    console.log('\n✅ Full cost analysis complete!');
    console.log('\nℹ️  Results show estimated costs based on current Gemini pricing.');
    console.log('ℹ️  Actual costs may vary based on video complexity and response length.');
  }).catch(error => {
    console.error('❌ Full test failed:', error);
  });
} else {
  runQuickTest().then(() => {
    console.log('\n✅ Quick cost test complete!');
    console.log('\nℹ️  Run `node run-cost-test.js full` for comprehensive analysis.');
    console.log('ℹ️  Results show estimated costs based on current Gemini pricing.');
  }).catch(error => {
    console.error('❌ Quick test failed:', error);
  });
}