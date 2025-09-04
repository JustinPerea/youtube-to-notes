/**
 * Cost Testing Framework for Video Chatbot Approaches
 * 
 * This script tests and compares the costs of different chatbot implementations:
 * 1. Current approach (pre-processed summaries)
 * 2. Full video reprocessing per question
 * 3. Proposed RAG approach
 */

import { GeminiClient } from './lib/gemini/client';

// Test Configuration
const TEST_CONFIG = {
  // Test videos of different lengths and complexities
  testVideos: [
    {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Astley - 3:32 minutes
      name: 'Short Music Video',
      expectedDuration: 212, // seconds
      complexity: 'low'
    },
    {
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', // PSY - Gangnam Style - 4:13 minutes
      name: 'Medium Music Video', 
      expectedDuration: 253,
      complexity: 'medium'
    },
    {
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', // Luis Fonsi - Despacito - 4:42 minutes
      name: 'Educational Content',
      expectedDuration: 282,
      complexity: 'high'
    }
  ],

  // Test questions to ask about each video
  testQuestions: [
    "What is the main topic of this video?",
    "Can you summarize the key points discussed?",
    "What happens at the 2-minute mark?",
    "Who are the main people featured in the video?",
    "What is the overall tone or mood of the content?",
    "Are there any important visual elements or graphics?",
    "What would you say is the target audience?",
    "Can you explain the most important concept discussed?"
  ],

  // Cost tracking
  geminiCosts: {
    // Gemini 2.0 Flash pricing (per 1K tokens)
    inputCost: 0.00015,  // $0.00015 per 1K input tokens
    outputCost: 0.0006,  // $0.0006 per 1K output tokens
    
    // Estimated video processing costs (varies by length)
    videoProcessingBase: 0.10, // Base cost per video analysis
    videoProcessingPerMinute: 0.05 // Additional cost per minute
  }
};

class ChatbotCostTester {
  constructor() {
    this.geminiClient = null; // Initialize later
    this.testResults = {
      currentApproach: [],
      fullReprocessing: [],
      ragApproach: []
    };
  }

  initializeClient() {
    if (!this.geminiClient) {
      this.geminiClient = new GeminiClient();
    }
    return this.geminiClient;
  }

  /**
   * Test 1: Current Approach (Pre-processed Summaries)
   */
  async testCurrentApproach(videoUrl, questions) {
    console.log('🧪 Testing Current Approach (Pre-processed Summaries)');
    
    const results = {
      videoUrl,
      approach: 'current',
      initialProcessingCost: 0,
      questionCosts: [],
      totalCost: 0,
      responses: []
    };

    // Step 1: Initial video processing (current method)
    console.log('📹 Processing video initially...');
    const startTime = Date.now();
    
    const videoProcessingRequest = {
      youtubeUrl: videoUrl,
      template: { name: 'basic-summary', content: 'Basic summary template' },
      processingMode: 'hybrid'
    };

    const geminiClient = this.initializeClient();
    const initialProcessing = await geminiClient.processVideo(videoProcessingRequest);
    const processingTime = Date.now() - startTime;
    
    // Calculate initial processing cost
    results.initialProcessingCost = this.calculateProcessingCost(
      initialProcessing.tokensUsed || 0,
      initialProcessing.processingTime || processingTime
    );

    console.log(`✅ Initial processing: ${results.initialProcessingCost.toFixed(4)} USD`);

    // Step 2: Ask questions using current chatbot approach
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`❓ Question ${i + 1}: ${question}`);

      const questionStart = Date.now();
      
      // Use current chatbot approach (working with pre-processed context)
      const mockVideoContext = this.createMockVideoContext(initialProcessing);
      const contextPrompt = this.buildCurrentApproachPrompt(question, mockVideoContext);
      
      const chatResponse = await geminiClient.generateTextResponse(contextPrompt);
      const questionTime = Date.now() - questionStart;
      
      const questionCost = this.calculateTextResponseCost(chatResponse.tokenUsage || 0);
      
      results.questionCosts.push(questionCost);
      results.responses.push({
        question,
        response: chatResponse.text.substring(0, 200) + '...',
        cost: questionCost,
        responseTime: questionTime
      });

      console.log(`💰 Question cost: ${questionCost.toFixed(4)} USD`);
    }

    results.totalCost = results.initialProcessingCost + results.questionCosts.reduce((a, b) => a + b, 0);
    console.log(`📊 Current Approach Total: ${results.totalCost.toFixed(4)} USD\n`);

    return results;
  }

  /**
   * Test 2: Full Video Reprocessing Per Question
   */
  async testFullReprocessing(videoUrl, questions) {
    console.log('🧪 Testing Full Reprocessing Approach');
    
    const results = {
      videoUrl,
      approach: 'full-reprocessing',
      initialProcessingCost: 0, // No initial processing needed
      questionCosts: [],
      totalCost: 0,
      responses: []
    };

    // Each question triggers full video reprocessing
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`❓ Question ${i + 1}: ${question}`);

      const questionStart = Date.now();
      
      // Simulate full video reprocessing for each question
      const videoAnalysisPrompt = `You are watching this video to answer a user's question.
      
USER QUESTION: "${question}"

INSTRUCTIONS:
1. Watch the entire video carefully
2. Answer the question with specific details, quotes, and timestamps
3. Reference exact moments when relevant (MM:SS format)
4. If the answer isn't in the video, say so clearly
5. Be conversational but thorough

Answer the user's question now:`;

      // This would be the actual API call for full video processing
      const fullResponse = await this.simulateFullVideoProcessing(videoUrl, videoAnalysisPrompt);
      const questionTime = Date.now() - questionStart;
      
      const questionCost = this.calculateFullVideoProcessingCost(videoUrl, fullResponse.tokenUsage);
      
      results.questionCosts.push(questionCost);
      results.responses.push({
        question,
        response: fullResponse.text.substring(0, 200) + '...',
        cost: questionCost,
        responseTime: questionTime
      });

      console.log(`💰 Question cost (full reprocessing): ${questionCost.toFixed(4)} USD`);
    }

    results.totalCost = results.questionCosts.reduce((a, b) => a + b, 0);
    console.log(`📊 Full Reprocessing Total: ${results.totalCost.toFixed(4)} USD\n`);

    return results;
  }

  /**
   * Test 3: Simulated RAG Approach
   */
  async testRAGApproach(videoUrl, questions) {
    console.log('🧪 Testing RAG Approach (Simulated)');
    
    const results = {
      videoUrl,
      approach: 'rag',
      initialProcessingCost: 0,
      embeddingCost: 0,
      questionCosts: [],
      totalCost: 0,
      responses: []
    };

    // Step 1: Initial video processing + embedding creation
    console.log('📹 Processing video and creating embeddings...');
    
    const videoProcessingRequest = {
      youtubeUrl: videoUrl,
      template: { name: 'comprehensive-analysis', content: 'Full analysis template' },
      processingMode: 'hybrid'
    };

    const geminiClient = this.initializeClient();
    const initialProcessing = await geminiClient.processVideo(videoProcessingRequest);
    results.initialProcessingCost = this.calculateProcessingCost(
      initialProcessing.tokensUsed || 0,
      initialProcessing.processingTime || 0
    );

    // Simulate embedding creation cost
    const estimatedChunks = this.estimateVideoChunks(videoUrl);
    results.embeddingCost = this.calculateEmbeddingCost(estimatedChunks);

    console.log(`✅ Initial processing: ${results.initialProcessingCost.toFixed(4)} USD`);
    console.log(`✅ Embedding creation: ${results.embeddingCost.toFixed(4)} USD`);

    // Step 2: Answer questions using RAG simulation
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`❓ Question ${i + 1}: ${question}`);

      const questionStart = Date.now();
      
      // Simulate RAG: embedding lookup + context generation
      const ragPrompt = this.buildRAGPrompt(question, initialProcessing);
      const chatResponse = await this.geminiClient.generateTextResponse(ragPrompt);
      const questionTime = Date.now() - questionStart;
      
      // RAG cost = question embedding + text generation (very cheap)
      const questionEmbeddingCost = this.calculateQuestionEmbeddingCost(question);
      const textResponseCost = this.calculateTextResponseCost(chatResponse.tokenUsage || 0);
      const totalQuestionCost = questionEmbeddingCost + textResponseCost;
      
      results.questionCosts.push(totalQuestionCost);
      results.responses.push({
        question,
        response: chatResponse.text.substring(0, 200) + '...',
        cost: totalQuestionCost,
        responseTime: questionTime
      });

      console.log(`💰 Question cost (RAG): ${totalQuestionCost.toFixed(4)} USD`);
    }

    results.totalCost = results.initialProcessingCost + results.embeddingCost + results.questionCosts.reduce((a, b) => a + b, 0);
    console.log(`📊 RAG Approach Total: ${results.totalCost.toFixed(4)} USD\n`);

    return results;
  }

  /**
   * Helper Methods
   */
  
  calculateProcessingCost(tokenCount, processingTimeMs) {
    const estimatedInputTokens = tokenCount * 0.3; // Rough estimate
    const estimatedOutputTokens = tokenCount * 0.7;
    
    const inputCost = (estimatedInputTokens / 1000) * TEST_CONFIG.geminiCosts.inputCost;
    const outputCost = (estimatedOutputTokens / 1000) * TEST_CONFIG.geminiCosts.outputCost;
    
    return inputCost + outputCost;
  }

  calculateTextResponseCost(tokenCount) {
    const estimatedInputTokens = tokenCount * 0.2;
    const estimatedOutputTokens = tokenCount * 0.8;
    
    const inputCost = (estimatedInputTokens / 1000) * TEST_CONFIG.geminiCosts.inputCost;
    const outputCost = (estimatedOutputTokens / 1000) * TEST_CONFIG.geminiCosts.outputCost;
    
    return inputCost + outputCost;
  }

  calculateFullVideoProcessingCost(videoUrl, tokenCount) {
    // Full video processing is much more expensive
    const durationMinutes = this.estimateVideoDuration(videoUrl);
    const baseCost = TEST_CONFIG.geminiCosts.videoProcessingBase;
    const durationCost = durationMinutes * TEST_CONFIG.geminiCosts.videoProcessingPerMinute;
    
    return baseCost + durationCost + this.calculateProcessingCost(tokenCount, 0);
  }

  calculateEmbeddingCost(chunkCount) {
    // OpenAI embedding cost: ~$0.02 per 1M tokens
    const estimatedTokensPerChunk = 100; // Conservative estimate
    const totalTokens = chunkCount * estimatedTokensPerChunk;
    return (totalTokens / 1000000) * 0.02;
  }

  calculateQuestionEmbeddingCost(question) {
    const estimatedTokens = question.split(' ').length * 1.3; // Rough tokenization
    return (estimatedTokens / 1000000) * 0.02;
  }

  estimateVideoDuration(videoUrl) {
    // Simple estimation based on test videos
    if (videoUrl.includes('dQw4w9WgXcQ')) return 3.5;
    if (videoUrl.includes('9bZkp7q19f0')) return 4.2;
    if (videoUrl.includes('kJQP7kiw5Fk')) return 4.7;
    return 5; // Default estimate
  }

  estimateVideoChunks(videoUrl) {
    const duration = this.estimateVideoDuration(videoUrl);
    // Estimate: 2 chunks per minute + concept chunks + visual chunks
    return Math.ceil(duration * 2) + 10 + 5;
  }

  async simulateFullVideoProcessing(videoUrl, prompt) {
    // For testing, we'll use text-only processing to simulate
    // In real implementation, this would use full video processing
    const geminiClient = this.initializeClient();
    const mockPrompt = `${prompt}\n\nNote: This is a simulation of full video processing.`;
    return await geminiClient.generateTextResponse(mockPrompt);
  }

  createMockVideoContext(processingResult) {
    // Create mock video context from processing result
    return {
      title: 'Test Video',
      duration: 300,
      analysis: {
        difficultyLevel: 'medium',
        primarySubject: 'test content',
        contentTags: ['test', 'video'],
        conceptMap: { concepts: [] },
        fullTranscript: { segments: [] },
        visualAnalysis: { hasSlides: false },
        keyTimestamps: [],
        allTemplateOutputs: {}
      }
    };
  }

  buildCurrentApproachPrompt(question, videoContext) {
    return `You are helping a user understand video content based on pre-processed summaries.

VIDEO CONTEXT: ${JSON.stringify(videoContext, null, 2).substring(0, 500)}...

USER QUESTION: "${question}"

Answer based on the available context:`;
  }

  buildRAGPrompt(question, processingResult) {
    return `You have access to comprehensive video analysis data. Answer the user's question using the relevant context.

COMPREHENSIVE VIDEO ANALYSIS: ${JSON.stringify(processingResult, null, 2).substring(0, 1000)}...

USER QUESTION: "${question}"

Provide a detailed answer with specific references:`;
  }

  /**
   * Run complete cost analysis
   */
  async runCostAnalysis() {
    console.log('🚀 Starting Comprehensive Chatbot Cost Analysis\n');
    
    const allResults = [];

    for (const video of TEST_CONFIG.testVideos) {
      console.log(`\n📺 Testing Video: ${video.name} (${video.expectedDuration}s)`);
      console.log(`🔗 URL: ${video.url}\n`);

      try {
        // Test all three approaches
        const currentResult = await this.testCurrentApproach(video.url, TEST_CONFIG.testQuestions);
        const reprocessingResult = await this.testFullReprocessing(video.url, TEST_CONFIG.testQuestions);
        const ragResult = await this.testRAGApproach(video.url, TEST_CONFIG.testQuestions);

        allResults.push({
          video: video.name,
          current: currentResult,
          reprocessing: reprocessingResult,
          rag: ragResult
        });

        // Print comparison for this video
        this.printVideoComparison(video.name, currentResult, reprocessingResult, ragResult);

      } catch (error) {
        console.error(`❌ Error testing ${video.name}:`, error);
      }
    }

    // Print overall summary
    this.printOverallSummary(allResults);
    
    return allResults;
  }

  printVideoComparison(videoName, current, reprocessing, rag) {
    console.log(`\n📊 COST COMPARISON - ${videoName}`);
    console.log('═'.repeat(50));
    console.log(`Current Approach:     $${current.totalCost.toFixed(4)}`);
    console.log(`Full Reprocessing:    $${reprocessing.totalCost.toFixed(4)}`);
    console.log(`RAG Approach:         $${rag.totalCost.toFixed(4)}`);
    console.log('─'.repeat(50));
    
    const cheapest = Math.min(current.totalCost, reprocessing.totalCost, rag.totalCost);
    const ragSavings = ((reprocessing.totalCost - rag.totalCost) / reprocessing.totalCost * 100);
    
    console.log(`💰 Cheapest: ${cheapest === current.totalCost ? 'Current' : cheapest === rag.totalCost ? 'RAG' : 'Reprocessing'}`);
    console.log(`📈 RAG Savings vs Reprocessing: ${ragSavings.toFixed(1)}%`);
    console.log('═'.repeat(50));
  }

  printOverallSummary(results) {
    console.log('\n🎯 OVERALL COST ANALYSIS SUMMARY');
    console.log('═'.repeat(60));
    
    const totals = {
      current: 0,
      reprocessing: 0,
      rag: 0
    };

    results.forEach(result => {
      totals.current += result.current.totalCost;
      totals.reprocessing += result.reprocessing.totalCost;
      totals.rag += result.rag.totalCost;
    });

    console.log(`Total Costs (${results.length} videos, ${TEST_CONFIG.testQuestions.length} questions each):`);
    console.log(`Current Approach:     $${totals.current.toFixed(4)}`);
    console.log(`Full Reprocessing:    $${totals.reprocessing.toFixed(4)}`);
    console.log(`RAG Approach:         $${totals.rag.toFixed(4)}`);
    
    const ragSavings = ((totals.reprocessing - totals.rag) / totals.reprocessing * 100);
    console.log(`\n💡 Key Insights:`);
    console.log(`• RAG saves ${ragSavings.toFixed(1)}% vs full reprocessing`);
    console.log(`• Break-even point for RAG: ~${Math.ceil(totals.rag / (totals.reprocessing / TEST_CONFIG.testQuestions.length))} questions per video`);
    console.log(`• Per question cost - Current: $${(totals.current / (results.length * TEST_CONFIG.testQuestions.length)).toFixed(4)}`);
    console.log(`• Per question cost - RAG: $${(totals.rag / (results.length * TEST_CONFIG.testQuestions.length)).toFixed(4)}`);
    
    console.log('═'.repeat(60));
  }
}

// Export for module usage or run directly
export { ChatbotCostTester, TEST_CONFIG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ChatbotCostTester();
  tester.runCostAnalysis().then(() => {
    console.log('\n✅ Cost analysis complete!');
  }).catch(error => {
    console.error('❌ Cost analysis failed:', error);
  });
}