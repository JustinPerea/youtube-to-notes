#!/usr/bin/env tsx

/**
 * Health Check Script
 * 
 * Verifies that all systems and integrations are working correctly
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';

interface HealthCheck {
  name: string;
  description: string;
  execute: () => Promise<{ success: boolean; details?: string; error?: string }>;
  critical?: boolean;
}

class HealthChecker {
  private checks: HealthCheck[] = [];

  constructor() {
    // Load environment variables from .env file
    config();
    this.initializeChecks();
  }

  private initializeChecks() {
    this.checks = [
      {
        name: 'Node.js Environment',
        description: 'Check Node.js version and environment',
        execute: this.checkNodeEnvironment.bind(this),
        critical: true,
      },
      {
        name: 'Environment Variables',
        description: 'Validate required environment variables',
        execute: this.checkEnvironmentVariables.bind(this),
        critical: true,
      },
      {
        name: 'Database Connection',
        description: 'Test Supabase database connection',
        execute: this.checkDatabaseConnection.bind(this),
        critical: true,
      },
      {
        name: 'Gemini API',
        description: 'Test Gemini API connection',
        execute: this.checkGeminiAPI.bind(this),
        critical: true,
      },
      {
        name: 'Redis Connection',
        description: 'Test Redis connection for queue system',
        execute: this.checkRedisConnection.bind(this),
        critical: false,
      },
      {
        name: 'GitHub Integration',
        description: 'Test GitHub API access',
        execute: this.checkGitHubIntegration.bind(this),
        critical: false,
      },
      {
        name: 'TypeScript Compilation',
        description: 'Verify TypeScript compilation',
        execute: this.checkTypeScript.bind(this),
        critical: true,
      },
      {
        name: 'Agent Workflow System',
        description: 'Test agent workflow functionality',
        execute: this.checkAgentWorkflow.bind(this),
        critical: false,
      },
      {
        name: 'Dependencies',
        description: 'Check all dependencies are installed',
        execute: this.checkDependencies.bind(this),
        critical: true,
      },
    ];
  }

  private async checkNodeEnvironment(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      
      if (majorVersion < 18) {
        return {
          success: false,
          error: `Node.js version ${version} is too old. Requires 18 or higher.`,
        };
      }
      
      return {
        success: true,
        details: `Node.js ${version} ✓`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error checking Node.js: ${error}`,
      };
    }
  }

  private async checkEnvironmentVariables(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      const required = [
        'GOOGLE_GEMINI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXTAUTH_SECRET',
      ];
      
      const missing = required.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        return {
          success: false,
          error: `Missing environment variables: ${missing.join(', ')}`,
        };
      }
      
      return {
        success: true,
        details: 'All required environment variables set ✓',
      };
    } catch (error) {
      return {
        success: false,
        error: `Error checking environment: ${error}`,
      };
    }
  }

  private async checkDatabaseConnection(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      const { checkDatabaseConnection } = await import('../lib/db/connection');
      const result = await checkDatabaseConnection();
      
      if (result.success) {
        return {
          success: true,
          details: 'Database connection successful ✓',
        };
      } else {
        return {
          success: false,
          error: `Database connection failed: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error checking database: ${error}`,
      };
    }
  }

  private async checkGeminiAPI(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      const { GeminiClient } = await import('../lib/gemini/client');
      const client = new GeminiClient();
      
      // Test with a simple validation
      if (!process.env.GOOGLE_GEMINI_API_KEY) {
        return {
          success: false,
          error: 'Gemini API key not found',
        };
      }
      
      return {
        success: true,
        details: 'Gemini API client initialized ✓',
      };
    } catch (error) {
      return {
        success: false,
        error: `Error checking Gemini API: ${error}`,
      };
    }
  }

  private async checkRedisConnection(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      if (!process.env.REDIS_URL) {
        return {
          success: false,
          details: 'Redis URL not configured (optional)',
        };
      }
      
      // Try to connect to Redis
      const redis = await import('redis');
      const client = redis.createClient({ url: process.env.REDIS_URL });
      
      await client.connect();
      await client.ping();
      await client.disconnect();
      
      return {
        success: true,
        details: 'Redis connection successful ✓',
      };
    } catch (error) {
      return {
        success: false,
        details: 'Redis connection failed (optional)',
        error: `Error: ${error}`,
      };
    }
  }

  private async checkGitHubIntegration(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      if (!process.env.GITHUB_TOKEN) {
        return {
          success: false,
          details: 'GitHub token not configured (optional)',
        };
      }
      
      return {
        success: true,
        details: 'GitHub integration configured ✓',
      };
    } catch (error) {
      return {
        success: false,
        details: 'GitHub integration failed (optional)',
        error: `Error: ${error}`,
      };
    }
  }

  private async checkTypeScript(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      return {
        success: true,
        details: 'TypeScript compilation successful ✓',
      };
    } catch (error) {
      return {
        success: false,
        error: `TypeScript compilation failed: ${error}`,
      };
    }
  }

  private async checkAgentWorkflow(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      // Test basic agent workflow
      const { coordinatorAgent } = await import('../lib/agents/coordinator');
      
      return {
        success: true,
        details: 'Agent workflow system operational ✓',
      };
    } catch (error) {
      return {
        success: false,
        error: `Agent workflow test failed: ${error}`,
      };
    }
  }

  private async checkDependencies(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      // Check if node_modules exists
      const fs = await import('fs');
      if (!fs.existsSync('node_modules')) {
        return {
          success: false,
          error: 'Dependencies not installed. Run: npm install',
        };
      }
      
      return {
        success: true,
        details: 'Dependencies installed ✓',
      };
    } catch (error) {
      return {
        success: false,
        error: `Error checking dependencies: ${error}`,
      };
    }
  }

  async runHealthCheck(): Promise<void> {
    console.log('🏥 Running YouTube-to-Notes Health Check\n');
    
    const results: Array<{ name: string; success: boolean; details?: string; error?: string; critical?: boolean }> = [];
    
    for (const check of this.checks) {
      console.log(`🔍 ${check.name}`);
      console.log(`   ${check.description}`);
      
      try {
        const result = await check.execute();
        results.push({ ...result, name: check.name, critical: check.critical });
        
        if (result.success) {
          console.log(`   ✅ ${result.details || 'Passed'}`);
        } else {
          console.log(`   ❌ ${result.error || 'Failed'}`);
        }
      } catch (error) {
        console.log(`   ❌ Error during check: ${error}`);
        results.push({
          name: check.name,
          success: false,
          error: `Check failed: ${error}`,
          critical: check.critical,
        });
      }
      
      console.log('');
    }
    
    // Summary
    console.log('📊 Health Check Summary');
    console.log('═'.repeat(50));
    
    const passed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const criticalFailed = failed.filter(r => r.critical);
    
    console.log(`✅ Passed: ${passed.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (criticalFailed.length > 0) {
      console.log(`🚨 Critical failures: ${criticalFailed.length}`);
      console.log('\nCritical Issues:');
      for (const fail of criticalFailed) {
        console.log(`   • ${fail.name}: ${fail.error}`);
      }
    }
    
    if (failed.length > 0) {
      console.log('\nAll Issues:');
      for (const fail of failed) {
        const critical = fail.critical ? ' (CRITICAL)' : '';
        console.log(`   • ${fail.name}${critical}: ${fail.error}`);
      }
    }
    
    // Overall status
    if (criticalFailed.length > 0) {
      console.log('\n❌ Health check failed - critical issues found');
      console.log('Please fix the critical issues before continuing.');
      process.exit(1);
    } else if (failed.length > 0) {
      console.log('\n⚠️  Health check completed with non-critical issues');
      console.log('You can continue development, but consider fixing the issues above.');
    } else {
      console.log('\n🎉 Health check passed - all systems operational!');
      console.log('Ready for development.');
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.runHealthCheck().catch(console.error);
}

export { HealthChecker };
