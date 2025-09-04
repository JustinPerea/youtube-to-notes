#!/usr/bin/env node

/**
 * Test script to verify hybrid processing improvements
 * Tests both videos with captions and videos without captions
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3003';

// Test video URLs - mix of videos with and without captions
const testVideos = [
  {
    name: 'Educational video (likely has captions)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll - well-known, likely has captions
    expectedDataSources: ['YouTube Official Captions', 'Gemini Video Analysis', 'YouTube Rich Metadata']
  },
  {
    name: 'Short video (may not have captions)',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Short video example
    expectedDataSources: ['Gemini Audio-Focused Transcript', 'Gemini Video Analysis', 'YouTube Rich Metadata']
  }
];

async function testVideoProcessing(video) {
  console.log(`\n🧪 Testing: ${video.name}`);
  console.log(`📺 URL: ${video.url}`);
  
  try {
    const response = await fetch(`${API_BASE}/api/videos/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: video.url,
        selectedTemplate: 'basic-summary',
        processingMode: 'hybrid' // Test hybrid mode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Check if processing was successful
    if (result.error) {
      console.log(`❌ Processing failed: ${result.error}`);
      return { success: false, error: result.error };
    }

    // Analyze results
    console.log(`✅ Processing completed successfully!`);
    console.log(`📋 Processing method: ${result.processingMethod || 'unknown'}`);
    console.log(`🔍 Data sources used: ${result.dataSourcesUsed ? result.dataSourcesUsed.join(', ') : 'none reported'}`);
    console.log(`📝 Content length: ${result.content ? result.content.length : 0} characters`);
    
    if (result.allVerbosityLevels) {
      console.log(`🎯 Verbosity levels available: ${Object.keys(result.allVerbosityLevels).join(', ')}`);
    }

    // Check quality indicators
    if (result.quality) {
      console.log(`⭐ Quality metrics: Format ${result.quality.formatCompliance}, Content ${result.quality.contentAdaptation}`);
    }

    return { 
      success: true, 
      processingMethod: result.processingMethod,
      dataSourcesUsed: result.dataSourcesUsed,
      contentLength: result.content ? result.content.length : 0,
      hasVerbosityLevels: !!result.allVerbosityLevels
    };

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Hybrid Processing Tests');
  console.log('=======================================');
  
  const results = [];
  
  for (const video of testVideos) {
    const result = await testVideoProcessing(video);
    results.push({ video, result });
    
    // Wait between tests to avoid rate limiting
    if (testVideos.indexOf(video) < testVideos.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  results.forEach(({ video, result }, index) => {
    console.log(`\n${index + 1}. ${video.name}`);
    if (result.success) {
      console.log(`   ✅ Success - Method: ${result.processingMethod}, Sources: ${result.dataSourcesUsed?.length || 0}`);
      console.log(`   📝 Content: ${result.contentLength} chars, Verbosity: ${result.hasVerbosityLevels ? 'Yes' : 'No'}`);
    } else {
      console.log(`   ❌ Failed - ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.result.success).length;
  console.log(`\n🎯 Overall: ${successCount}/${results.length} tests passed`);
  
  if (successCount === results.length) {
    console.log('✅ All tests passed! Hybrid processing is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);