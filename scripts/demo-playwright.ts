#!/usr/bin/env tsx

/**
 * Playwright Controller Demo
 * 
 * Demonstrates browser automation capabilities for testing and UI validation
 */

import { playwrightController } from '../lib/mcp/playwright-controller';

async function demoPlaywright() {
  console.log('🌐 Playwright Controller Demo\n');
  
  const sessionId = `demo-session-${Date.now()}`;
  
  try {
    // Create a new browser session
    console.log('📋 Step 1: Creating browser session');
    console.log('═'.repeat(50));
    await playwrightController.createSession(sessionId, 'chromium', {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Navigate to a website
    console.log('\n📋 Step 2: Navigating to website');
    console.log('═'.repeat(50));
    const navigateResult = await playwrightController.navigate(sessionId, 'https://www.google.com');
    
    if (navigateResult.success) {
      console.log(`✅ Navigated successfully to: ${navigateResult.data?.url}`);
      console.log(`📄 Page title: ${navigateResult.data?.title}`);
      console.log(`⏱️ Duration: ${navigateResult.duration}ms`);
    } else {
      console.log(`❌ Navigation failed: ${navigateResult.error}`);
      return;
    }

    // Take a screenshot
    console.log('\n📋 Step 3: Taking screenshot');
    console.log('═'.repeat(50));
    const screenshotResult = await playwrightController.screenshot(sessionId);
    
    if (screenshotResult.success) {
      console.log(`✅ Screenshot saved: ${screenshotResult.screenshot}`);
      console.log(`⏱️ Duration: ${screenshotResult.duration}ms`);
    } else {
      console.log(`❌ Screenshot failed: ${screenshotResult.error}`);
    }

    // Get page information
    console.log('\n📋 Step 4: Getting page information');
    console.log('═'.repeat(50));
    const pageInfoResult = await playwrightController.getPageInfo(sessionId);
    
    if (pageInfoResult.success) {
      const info = pageInfoResult.data;
      console.log(`✅ Page information retrieved:`);
      console.log(`   URL: ${info.url}`);
      console.log(`   Title: ${info.title}`);
      console.log(`   Viewport: ${info.viewport.width}x${info.viewport.height}`);
      console.log(`   Elements: ${info.elements.links} links, ${info.elements.buttons} buttons`);
      console.log(`⏱️ Duration: ${pageInfoResult.duration}ms`);
    } else {
      console.log(`❌ Page info failed: ${pageInfoResult.error}`);
    }

    // Search for something
    console.log('\n📋 Step 5: Performing search');
    console.log('═'.repeat(50));
    const searchInput = 'input[name="q"]';
    const searchText = 'Playwright browser automation';
    
    // Type in search box
    const typeResult = await playwrightController.type(sessionId, searchInput, searchText);
    if (typeResult.success) {
      console.log(`✅ Typed search text: "${searchText}"`);
      console.log(`⏱️ Duration: ${typeResult.duration}ms`);
    } else {
      console.log(`❌ Typing failed: ${typeResult.error}`);
    }

    // Wait a moment
    await playwrightController.wait(sessionId, undefined, 1000);

    // Press Enter to search
    const enterResult = await playwrightController.evaluate(sessionId, `
      document.querySelector('input[name="q"]').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 })
      );
    `);
    
    if (enterResult.success) {
      console.log(`✅ Pressed Enter to search`);
      console.log(`⏱️ Duration: ${enterResult.duration}ms`);
    } else {
      console.log(`❌ Press Enter failed: ${enterResult.error}`);
    }

    // Wait for results to load
    await playwrightController.wait(sessionId, '#search', 5000);

    // Take another screenshot
    console.log('\n📋 Step 6: Taking screenshot of search results');
    console.log('═'.repeat(50));
    const resultsScreenshot = await playwrightController.screenshot(sessionId, `screenshots/search-results-${Date.now()}.png`);
    
    if (resultsScreenshot.success) {
      console.log(`✅ Search results screenshot: ${resultsScreenshot.screenshot}`);
    }

    // Get updated page info
    const updatedPageInfo = await playwrightController.getPageInfo(sessionId);
    if (updatedPageInfo.success) {
      console.log(`✅ Updated page info:`);
      console.log(`   URL: ${updatedPageInfo.data.url}`);
      console.log(`   Title: ${updatedPageInfo.data.title}`);
    }

    // Scroll down to see more results
    console.log('\n📋 Step 7: Scrolling to see more results');
    console.log('═'.repeat(50));
    const scrollResult = await playwrightController.scroll(sessionId, 'down', 800);
    
    if (scrollResult.success) {
      console.log(`✅ Scrolled down 800px`);
      console.log(`⏱️ Duration: ${scrollResult.duration}ms`);
    } else {
      console.log(`❌ Scroll failed: ${scrollResult.error}`);
    }

    // Take final screenshot
    const finalScreenshot = await playwrightController.screenshot(sessionId, `screenshots/final-scroll-${Date.now()}.png`);
    if (finalScreenshot.success) {
      console.log(`✅ Final screenshot: ${finalScreenshot.screenshot}`);
    }

    // Show session summary
    console.log('\n📋 Session Summary');
    console.log('═'.repeat(50));
    const summary = playwrightController.getSessionSummary(sessionId);
    if (summary) {
      console.log(`Session ID: ${summary.id}`);
      console.log(`Created: ${summary.createdAt.toISOString()}`);
      console.log(`Actions performed: ${summary.actions}`);
      console.log(`Results generated: ${summary.results}`);
      console.log(`Success rate: ${(summary.successRate * 100).toFixed(1)}%`);
      console.log(`Last action: ${summary.lastAction?.type}`);
    }

  } catch (error) {
    console.error(`❌ Demo failed: ${error}`);
  } finally {
    // Clean up - close the session
    console.log('\n🔒 Cleaning up...');
    try {
      await playwrightController.closeSession(sessionId);
      console.log('✅ Browser session closed successfully');
    } catch (error) {
      console.error(`❌ Error closing session: ${error}`);
    }
  }
}

// Example: Testing our own application (when we have one)
async function testOurApplication() {
  console.log('\n🧪 Testing Our Application Demo\n');
  
  const testSessionId = `test-app-${Date.now()}`;
  
  try {
    // Create session
    await playwrightController.createSession(testSessionId);
    
    // Navigate to our app (when we have one)
    const result = await playwrightController.navigate(testSessionId, 'http://localhost:3000');
    
    if (result.success) {
      console.log(`✅ Successfully navigated to our app`);
      console.log(`📄 Page title: ${result.data?.title}`);
      
      // Test video upload interface (when we build it)
      console.log('🎬 Testing video upload interface...');
      
      // Test template selection (when we build it)
      console.log('📋 Testing template selection...');
      
      // Test processing flow (when we build it)
      console.log('⚙️ Testing processing flow...');
      
    } else {
      console.log(`❌ Could not navigate to our app: ${result.error}`);
      console.log('💡 Make sure the development server is running: npm run dev');
    }
    
  } catch (error) {
    console.error(`❌ App test failed: ${error}`);
  } finally {
    await playwrightController.closeSession(testSessionId);
  }
}

// Run the demo
async function runDemo() {
  try {
    await demoPlaywright();
    
    // Uncomment when we have our app running
    // await testOurApplication();
    
    console.log('\n🎉 Playwright Controller Demo Completed!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runDemo();
}

export { demoPlaywright, testOurApplication };
