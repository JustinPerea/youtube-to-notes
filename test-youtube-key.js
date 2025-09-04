#!/usr/bin/env node

/**
 * Simple test to verify YouTube Data API v3 key is working
 */

// Load environment variables from .env file
require('dotenv').config();

async function testYouTubeApiKey() {
  console.log('🔑 Testing YouTube Data API v3 Key');
  console.log('==================================');
  console.log('');

  // Check if API key is configured
  if (!process.env.YOUTUBE_DATA_API_KEY) {
    console.log('❌ YOUTUBE_DATA_API_KEY not found in environment variables');
    console.log('');
    console.log('📋 To fix this:');
    console.log('   1. Add YOUTUBE_DATA_API_KEY=your_key_here to your .env file');
    console.log('   2. Restart this test');
    return;
  }

  console.log('✅ YOUTUBE_DATA_API_KEY found in environment');
  console.log(`🔑 Key preview: ${process.env.YOUTUBE_DATA_API_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    console.log('🔍 Testing API key with simple video metadata request...');
    console.log('📺 Test video: Rick Astley - Never Gonna Give You Up (dQw4w9WgXcQ)');
    console.log('');

    // Test with a direct YouTube Data API v3 request
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll - guaranteed to exist and have metadata
    
    console.log('📡 Making direct API request to YouTube Data API v3...');
    
    // Make a direct fetch request to test the API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${testVideoId}&key=${process.env.YOUTUBE_DATA_API_KEY}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${data.error?.message || 'Unknown error'}`);
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No video data returned from API');
    }
    
    const video = data.items[0];
    const metadata = {
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      duration: video.contentDetails.duration,
      tags: video.snippet.tags || []
    };
    
    if (metadata) {
      console.log('🎉 SUCCESS! YouTube Data API v3 is working!');
      console.log('');
      console.log('📊 Retrieved metadata:');
      console.log(`   Title: ${metadata.title}`);
      console.log(`   Channel: ${metadata.channelTitle}`);
      console.log(`   Duration: ${metadata.duration}`);
      console.log(`   Views: ${metadata.viewCount.toLocaleString()}`);
      console.log(`   Likes: ${metadata.likeCount.toLocaleString()}`);
      console.log(`   Description length: ${metadata.description.length} characters`);
      console.log(`   Tags: ${metadata.tags.length} tags`);
      console.log('');
      console.log('🚀 Your YouTube Data API v3 key is working perfectly!');
      
    } else {
      console.log('❌ API request failed - no metadata returned');
      console.log('');
      console.log('🔍 Possible issues:');
      console.log('   • API key may be invalid');
      console.log('   • API key may not have YouTube Data API v3 enabled');
      console.log('   • Network connectivity issues');
      console.log('   • API quota exceeded (unlikely for first test)');
    }

  } catch (error) {
    console.log('❌ YouTube API test failed');
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    if (error.message.includes('API key')) {
      console.log('🔍 API Key Issues:');
      console.log('   • Check if your API key is correct');
      console.log('   • Ensure YouTube Data API v3 is enabled in Google Cloud Console');
      console.log('   • Try creating a new API key');
    } else if (error.message.includes('403')) {
      console.log('🔍 Permission Issues:');
      console.log('   • API key may not have permission for YouTube Data API v3');
      console.log('   • Check your Google Cloud Console project settings');
    } else if (error.message.includes('quota')) {
      console.log('🔍 Quota Issues:');
      console.log('   • Daily quota may be exceeded');
      console.log('   • Try again tomorrow or request quota increase');
    } else {
      console.log('🔍 Other Issues:');
      console.log('   • Network connectivity problems');
      console.log('   • Temporary API service issues');
      console.log('   • Try again in a few minutes');
    }
  }

  console.log('');
  console.log('📋 Next Steps:');
  console.log('   • If successful: Your YouTube API integration is ready!');
  console.log('   • If failed: Follow the troubleshooting suggestions above');
  console.log('   • For setup help: See YOUTUBE_API_SETUP.md');
  console.log('');
  console.log('🏁 YouTube API key test completed');
}

// Run the test
testYouTubeApiKey().catch(console.error);