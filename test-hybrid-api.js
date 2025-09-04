/**
 * Comprehensive Test Suite for Hybrid Video Processing API
 * 
 * Tests the new /api/videos/process-hybrid endpoint with different processing modes
 * to validate the enhanced hybrid processing strategy implementation.
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3003';

// Test configuration
const TEST_CASES = [
  {
    name: 'Hybrid Processing (Auto)',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Astley - has captions, rich metadata
    template: 'basic-summary',
    processingMode: 'auto', // Should auto-select hybrid
    expectedMethod: 'hybrid',
    expectedDataSources: ['YouTube Official Captions', 'Gemini Video Analysis', 'YouTube Rich Metadata']
  },
  {
    name: 'Forced Hybrid Processing',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    template: 'study-notes',
    processingMode: 'hybrid', // Explicitly request hybrid
    expectedMethod: 'hybrid',
    expectedDataSources: ['YouTube Official Captions', 'Gemini Video Analysis']
  },
  {
    name: 'Transcript-Only Processing',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    template: 'presentation-slides',
    processingMode: 'transcript-only',
    expectedMethod: 'transcript-only',
    expectedDataSources: ['YouTube Official Captions']
  },
  {
    name: 'Video-Only Processing',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    template: 'tutorial-guide',
    processingMode: 'video-only',
    expectedMethod: 'video-only',
    expectedDataSources: ['Gemini Video Analysis']
  }
];

async function testHybridProcessing() {
  console.log('🧪 HYBRID VIDEO PROCESSING TEST SUITE');
  console.log('=' .repeat(80));
  console.log('Testing enhanced hybrid processing with multiple data sources');
  console.log('API Endpoint: /api/videos/process-hybrid');
  console.log('');

  const results = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`📋 TEST: ${testCase.name}`);
    console.log('-'.repeat(60));
    console.log(`📺 Video: ${testCase.videoUrl}`);
    console.log(`📋 Template: ${testCase.template}`);
    console.log(`🔧 Processing Mode: ${testCase.processingMode}`);
    console.log(`🎯 Expected Method: ${testCase.expectedMethod}`);
    console.log('');
    
    try {
      const startTime = Date.now();
      
      // Make API request
      const response = await fetch(`${API_BASE}/api/videos/process-hybrid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: testCase.videoUrl,
          selectedTemplate: testCase.template,
          processingMode: testCase.processingMode
        })
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.error}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      const validation = {
        hasContent: !!data.content,
        hasProcessingMethod: !!data.processingMethod,
        hasDataSources: Array.isArray(data.dataSourcesUsed),
        hasQuality: !!data.quality,
        hasInsights: !!data.insights,
        methodMatches: data.processingMethod === testCase.expectedMethod,
        hasExpectedSources: testCase.expectedDataSources.some(source => 
          data.dataSourcesUsed?.includes(source)
        )
      };
      
      // Test results
      const testResult = {
        name: testCase.name,
        success: true,
        totalTime,
        apiTime: data.processingTimeMs || 0,
        processingMethod: data.processingMethod,
        dataSourcesUsed: data.dataSourcesUsed || [],
        qualityScore: data.insights?.qualityScore || 0,
        tokenUsage: data.tokenUsage || 0,
        cost: data.estimatedCost || 0,
        contentLength: data.content?.length || 0,
        validation
      };
      
      console.log('✅ TEST RESULTS:');
      console.log(`   Status: SUCCESS`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   API Processing Time: ${testResult.apiTime}ms`);
      console.log(`   Method Used: ${testResult.processingMethod}`);
      console.log(`   Data Sources: ${testResult.dataSourcesUsed.join(', ')}`);
      console.log(`   Quality Score: ${testResult.qualityScore}/100`);
      console.log(`   Content Generated: ${testResult.contentLength} characters`);
      console.log(`   Token Usage: ${testResult.tokenUsage}`);
      console.log(`   Estimated Cost: $${testResult.cost.toFixed(4)}`);
      
      // Validation results
      console.log('');
      console.log('🔍 VALIDATION:');
      console.log(`   ✅ Has Content: ${validation.hasContent}`);
      console.log(`   ✅ Has Processing Method: ${validation.hasProcessingMethod}`);
      console.log(`   ✅ Has Data Sources: ${validation.hasDataSources}`);
      console.log(`   ✅ Method Matches Expected: ${validation.methodMatches}`);
      console.log(`   ✅ Has Expected Data Sources: ${validation.hasExpectedSources}`);
      
      results.push(testResult);
      
    } catch (error) {
      console.log('❌ TEST FAILED:');
      console.log(`   Error: ${error.message}`);
      
      results.push({
        name: testCase.name,
        success: false,
        error: error.message,
        totalTime: 0
      });
    }
    
    console.log('');
    console.log('=' .repeat(80));
    console.log('');
    
    // Add delay between tests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('📊 TEST SUITE SUMMARY');
  console.log('=' .repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed Tests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
    const avgTokens = successful.reduce((sum, r) => sum + (r.tokenUsage || 0), 0) / successful.length;
    const totalCost = successful.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    console.log('');
    console.log('📈 PERFORMANCE METRICS:');
    console.log(`   Average Response Time: ${Math.round(avgTime)}ms`);
    console.log(`   Average Token Usage: ${Math.round(avgTokens)}`);
    console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
    
    console.log('');
    console.log('🎯 PROCESSING METHODS USED:');
    successful.forEach(result => {
      console.log(`   ${result.name}: ${result.processingMethod}`);
    });
    
    console.log('');
    console.log('📋 DATA SOURCES UTILIZED:');
    const allSources = new Set();
    successful.forEach(result => {
      result.dataSourcesUsed.forEach(source => allSources.add(source));
    });
    allSources.forEach(source => console.log(`   • ${source}`));
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ FAILED TESTS:');
    failed.forEach(result => {
      console.log(`   ${result.name}: ${result.error}`);
    });
  }
  
  console.log('');
  console.log('🏁 Hybrid processing test suite completed!');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  testHybridProcessing().catch(console.error);
}

module.exports = { testHybridProcessing, TEST_CASES };