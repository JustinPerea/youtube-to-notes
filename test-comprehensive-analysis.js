#!/usr/bin/env node

/**
 * Test script for comprehensive video analysis
 * Tests the fixed transcript-based approach
 */

const testVideoId = '3V6fppDLVXs'; // YouTube video ID from the error logs
const testVideoUrl = 'https://www.youtube.com/watch?v=3V6fppDLVXs';

async function testComprehensiveAnalysis() {
  console.log('🧪 Testing Comprehensive Video Analysis');
  console.log('==========================================');
  console.log(`📺 Video URL: ${testVideoUrl}`);
  console.log(`🆔 Video ID: ${testVideoId}`);
  console.log('');

  try {
    console.log('1️⃣ Testing POST /api/videos/comprehensive-analysis...');
    
    const response = await fetch('http://localhost:3003/api/videos/comprehensive-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you would need proper authentication headers
      },
      body: JSON.stringify({
        youtubeUrl: testVideoUrl,
        videoId: testVideoId,
        requestedTemplates: ['basic-summary', 'study-notes']
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Comprehensive analysis completed:');
      console.log('   - Video ID:', data.videoId);
      console.log('   - Success:', data.success);
      console.log('   - Concept Count:', data.analysis?.conceptCount || 'N/A');
      console.log('   - Transcript Segments:', data.analysis?.transcriptSegments || 'N/A');
      console.log('   - Processing Time:', data.analysis?.processingTime + 'ms' || 'N/A');
      console.log('   - Cost:', data.analysis?.cost + ' cents' || 'N/A');
      
      console.log('');
      console.log('2️⃣ Testing GET /api/videos/comprehensive-analysis...');
      
      const getResponse = await fetch(`http://localhost:3003/api/videos/comprehensive-analysis?videoId=${testVideoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`📊 GET Response Status: ${getResponse.status} ${getResponse.statusText}`);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ GET SUCCESS! Analysis retrieved:');
        console.log('   - Has Analysis:', !!getData.analysis);
        console.log('   - Full Transcript Segments:', getData.analysis?.fullTranscript?.segments?.length || 'N/A');
        console.log('   - Concept Map Concepts:', getData.analysis?.conceptMap?.concepts?.length || 'N/A');
      } else {
        const error = await getResponse.json();
        console.log('❌ GET FAILED:', error.error);
      }
      
    } else {
      const error = await response.json();
      console.log('❌ FAILED! Error:', error.error);
      console.log('   Details:', error.details || 'No additional details');
      
      // Check if it's the old video processing error
      if (error.error && error.error.includes('Base64 decoding failed')) {
        console.log('');
        console.log('🔍 DIAGNOSIS: This is the old video processing error!');
        console.log('   The system is still trying to send video data instead of using transcript.');
        console.log('   The fix may not have taken effect yet, or there\'s cache issues.');
      }
    }

  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
    console.log('');
    console.log('🔍 POSSIBLE CAUSES:');
    console.log('   - Development server is not running on port 3003');
    console.log('   - Authentication issues (no valid session)');
    console.log('   - Network connectivity problems');
  }

  console.log('');
  console.log('🏁 Test completed');
}

// Run the test
testComprehensiveAnalysis().catch(console.error);