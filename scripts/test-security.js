#!/usr/bin/env node

/**
 * Security Testing Script for YouTube-to-Notes
 * 
 * This script tests all implemented security measures
 * to ensure they're working correctly.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';
const TEST_EMAIL = 'test@example.com';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(` ${title}`, 'cyan');
  log(`${'='.repeat(50)}`, 'cyan');
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASSED' : '❌ FAILED';
  const color = passed ? 'green' : 'red';
  log(`  ${status} ${name}`, color);
  if (details) {
    log(`    ${details}`, 'yellow');
  }
}

// Security tests
const securityTests = {
  // Test security headers
  testSecurityHeaders: async () => {
    logSection('Testing Security Headers');
    
    try {
      const response = await fetch(`${BASE_URL}/api/videos/process`, {
        method: 'GET'
      });
      
      const headers = response.headers;
      
      // Check for required security headers
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'content-security-policy',
        'x-xss-protection'
      ];
      
      let allHeadersPresent = true;
      
      requiredHeaders.forEach(header => {
        const hasHeader = headers.has(header);
        logTest(`Security header: ${header}`, hasHeader);
        if (!hasHeader) {
          allHeadersPresent = false;
        }
      });
      
      // Check specific header values
      const frameOptions = headers.get('x-frame-options');
      logTest('X-Frame-Options is DENY', frameOptions === 'DENY');
      
      const contentTypeOptions = headers.get('x-content-type-options');
      logTest('X-Content-Type-Options is nosniff', contentTypeOptions === 'nosniff');
      
      return allHeadersPresent && frameOptions === 'DENY' && contentTypeOptions === 'nosniff';
    } catch (error) {
      logTest('Security headers test', false, error.message);
      return false;
    }
  },

  // Test rate limiting
  testRateLimiting: async () => {
    logSection('Testing Rate Limiting');
    
    try {
      // Send multiple requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/videos/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              selectedTemplate: 'basic-summary'
            })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Check for rate limit responses (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      const hasRateLimiting = rateLimitedResponses.length > 0;
      
      logTest('Rate limiting triggered', hasRateLimiting, 
        `${rateLimitedResponses.length} requests were rate limited`);
      
      // Check for rate limit headers
      if (rateLimitedResponses.length > 0) {
        const firstRateLimited = rateLimitedResponses[0];
        const hasRetryAfter = firstRateLimited.headers.has('retry-after');
        const hasRateLimitHeaders = firstRateLimited.headers.has('x-ratelimit-limit');
        
        logTest('Rate limit headers present', hasRetryAfter && hasRateLimitHeaders);
        
        return hasRateLimiting && hasRetryAfter && hasRateLimitHeaders;
      }
      
      return hasRateLimiting;
    } catch (error) {
      logTest('Rate limiting test', false, error.message);
      return false;
    }
  },

  // Test input validation
  testInputValidation: async () => {
    logSection('Testing Input Validation');
    
    try {
      // Test invalid video URL
      const invalidUrlResponse = await fetch(`${BASE_URL}/api/videos/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: 'https://evil.com/script.js',
          selectedTemplate: 'basic-summary'
        })
      });
      
      const invalidUrlPassed = invalidUrlResponse.status === 400;
      logTest('Invalid video URL rejected', invalidUrlPassed);
      
      // Test XSS payload
      const xssResponse = await fetch(`${BASE_URL}/api/notes/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '<script>alert("xss")</script>',
          content: 'Content with <script>alert("xss")</script>',
          videoId: 'test123'
        })
      });
      
      const xssPassed = xssResponse.status === 400 || xssResponse.status === 401;
      logTest('XSS payload rejected', xssPassed);
      
      return invalidUrlPassed && xssPassed;
    } catch (error) {
      logTest('Input validation test', false, error.message);
      return false;
    }
  },

  // Test CORS protection
  testCORSProtection: async () => {
    logSection('Testing CORS Protection');
    
    try {
      const response = await fetch(`${BASE_URL}/api/videos/process`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://evil.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = response.headers;
      const hasCORSHeaders = corsHeaders.has('access-control-allow-origin');
      
      logTest('CORS headers present', hasCORSHeaders);
      
      // Check if origin is properly restricted
      const allowOrigin = corsHeaders.get('access-control-allow-origin');
      const originRestricted = !allowOrigin || allowOrigin === 'null';
      logTest('CORS origin restricted', originRestricted, `Allow-Origin: ${allowOrigin}`);
      
      return hasCORSHeaders && originRestricted;
    } catch (error) {
      logTest('CORS protection test', false, error.message);
      return false;
    }
  },

  // Test authentication protection
  testAuthenticationProtection: async () => {
    logSection('Testing Authentication Protection');
    
    try {
      // Test protected endpoint without authentication
      const response = await fetch(`${BASE_URL}/api/notes/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Test content'
        })
      });
      
      const protected = response.status === 401;
      logTest('Protected endpoint requires auth', protected);
      
      return protected;
    } catch (error) {
      logTest('Authentication protection test', false, error.message);
      return false;
    }
  },

  // Test bot protection
  testBotProtection: async () => {
    logSection('Testing Bot Protection');
    
    try {
      const botResponse = await fetch(`${BASE_URL}/api/videos/process`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Bot/1.0 (crawler)',
          'X-Forwarded-For': '192.168.1.1'
        }
      });
      
      const botBlocked = botResponse.status === 403;
      logTest('Suspicious bot blocked', botBlocked);
      
      return botBlocked;
    } catch (error) {
      logTest('Bot protection test', false, error.message);
      return false;
    }
  }
};

// Run all security tests
async function runSecurityTests() {
  log('🔒 Starting Security Tests for YouTube-to-Notes', 'magenta');
  log(`Testing URL: ${BASE_URL}`, 'blue');
  log(new Date().toISOString(), 'blue');
  
  const results = [];
  
  for (const [testName, testFunction] of Object.entries(securityTests)) {
    try {
      const result = await testFunction();
      results.push({ name: testName, passed: result });
    } catch (error) {
      log(`Error in ${testName}: ${error.message}`, 'red');
      results.push({ name: testName, passed: false });
    }
  }
  
  // Summary
  logSection('Security Test Summary');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const percentage = Math.round((passedTests / totalTests) * 100);
  
  log(`Passed: ${passedTests}/${totalTests} (${percentage}%)`, percentage >= 80 ? 'green' : 'yellow');
  
  if (percentage >= 90) {
    log('🎉 Excellent! All security measures are working correctly.', 'green');
  } else if (percentage >= 80) {
    log('⚠️  Good, but some security measures need attention.', 'yellow');
  } else {
    log('🚨 Critical security issues found. Please address them.', 'red');
  }
  
  // Failed tests
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    log('\nFailed tests:', 'red');
    failedTests.forEach(test => {
      log(`  - ${test.name}`, 'red');
    });
  }
  
  return percentage >= 80;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runSecurityTests()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      log(`Tests failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runSecurityTests, securityTests };
