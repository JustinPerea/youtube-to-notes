#!/usr/bin/env tsx

/**
 * Project Setup Script
 * 
 * Comprehensive setup for YouTube-to-Notes project including:
 * - Environment validation
 * - Dependencies installation
 * - Database setup
 * - Initial configuration
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SetupStep {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  required?: boolean;
}

class ProjectSetup {
  private steps: SetupStep[] = [];
  private results: Map<string, boolean> = new Map();

  constructor() {
    // Load environment variables from .env file
    config();
    this.initializeSteps();
  }

  private initializeSteps() {
    this.steps = [
      {
        name: 'Node.js Check',
        description: 'Verify Node.js version (>=18.0.0)',
        execute: this.checkNodeVersion.bind(this),
        required: true,
      },
      {
        name: 'Environment Variables',
        description: 'Setup and validate environment configuration',
        execute: this.setupEnvironment.bind(this),
        required: true,
      },
      {
        name: 'Dependencies Installation',
        description: 'Install npm dependencies',
        execute: this.installDependencies.bind(this),
        required: true,
      },
      {
        name: 'Database Connection',
        description: 'Test database connection',
        execute: this.testDatabaseConnection.bind(this),
        required: true,
      },
      {
        name: 'Database Migration',
        description: 'Run database migrations',
        execute: this.runMigrations.bind(this),
        required: true,
      },
      {
        name: 'TypeScript Compilation',
        description: 'Verify TypeScript configuration',
        execute: this.checkTypeScript.bind(this),
        required: true,
      },
      {
        name: 'Linting Setup',
        description: 'Run initial linting check',
        execute: this.runLinting.bind(this),
        required: false,
      },
      {
        name: 'Test Setup',
        description: 'Verify test configuration',
        execute: this.checkTests.bind(this),
        required: false,
      },
      {
        name: 'Agent Workflow',
        description: 'Test agent workflow system',
        execute: this.testAgentWorkflow.bind(this),
        required: false,
      },
    ];
  }

  private async checkNodeVersion(): Promise<boolean> {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      
      if (majorVersion < 18) {
        console.log(`❌ Node.js version ${version} is too old. Please upgrade to Node.js 18 or higher.`);
        return false;
      }
      
      console.log(`✅ Node.js ${version} detected`);
      return true;
    } catch (error) {
      console.log(`❌ Error checking Node.js version: ${error}`);
      return false;
    }
  }

  private async setupEnvironment(): Promise<boolean> {
    try {
      // Check if .env file exists
      const envPath = join(process.cwd(), '.env');
      
      if (!existsSync(envPath)) {
        console.log('📝 Creating .env file from env.example...');
        
        if (existsSync('env.example')) {
          const exampleContent = readFileSync('env.example', 'utf-8');
          writeFileSync(envPath, exampleContent);
          console.log('⚠️  Please update .env file with your actual credentials');
          return false;
        } else {
          console.log('❌ env.example not found. Please create a .env file manually.');
          return false;
        }
      }

      // Validate required environment variables
      const requiredVars = [
        'GOOGLE_GEMINI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXTAUTH_SECRET',
      ];

      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.log('Please update your .env file with these values.');
        return false;
      }

      console.log('✅ Environment variables configured');
      return true;
    } catch (error) {
      console.log(`❌ Error setting up environment: ${error}`);
      return false;
    }
  }

  private async installDependencies(): Promise<boolean> {
    try {
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
      return true;
    } catch (error) {
      console.log(`❌ Error installing dependencies: ${error}`);
      return false;
    }
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Import and test database connection
      const { checkDatabaseConnection } = await import('../lib/db/connection');
      const result = await checkDatabaseConnection();
      
      if (result.success) {
        console.log('✅ Database connection successful');
        return true;
      } else {
        console.log(`❌ Database connection failed: ${result.error}`);
        console.log('Please check your Supabase configuration.');
        return false;
      }
    } catch (error) {
      console.log(`❌ Error testing database connection: ${error}`);
      return false;
    }
  }

  private async runMigrations(): Promise<boolean> {
    try {
      console.log('🔄 Running database migrations...');
      execSync('npm run db:generate', { stdio: 'inherit' });
      execSync('npm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
      return true;
    } catch (error) {
      console.log(`❌ Error running migrations: ${error}`);
      return false;
    }
  }

  private async checkTypeScript(): Promise<boolean> {
    try {
      console.log('🔍 Checking TypeScript configuration...');
      execSync('npm run type-check', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
      return true;
    } catch (error) {
      console.log(`❌ TypeScript compilation failed: ${error}`);
      return false;
    }
  }

  private async runLinting(): Promise<boolean> {
    try {
      console.log('🔍 Running linting check...');
      execSync('npm run lint', { stdio: 'pipe' });
      console.log('✅ Linting passed');
      return true;
    } catch (error) {
      console.log(`⚠️  Linting issues found: ${error}`);
      console.log('You can fix these later with: npm run lint -- --fix');
      return false;
    }
  }

  private async checkTests(): Promise<boolean> {
    try {
      console.log('🧪 Checking test configuration...');
      
      // Check if test files exist
      const testFiles = [
        'jest.config.js',
        'playwright.config.ts',
        'tests/',
      ];
      
      const missingFiles = testFiles.filter(file => !existsSync(file));
      
      if (missingFiles.length > 0) {
        console.log(`⚠️  Missing test files: ${missingFiles.join(', ')}`);
        console.log('Tests can be configured later.');
        return false;
      }
      
      console.log('✅ Test configuration found');
      return true;
    } catch (error) {
      console.log(`❌ Error checking tests: ${error}`);
      return false;
    }
  }

  private async testAgentWorkflow(): Promise<boolean> {
    try {
      console.log('🤖 Testing agent workflow system...');
      
      // Test context restoration
      execSync('npm run context:restore', { stdio: 'pipe' });
      
      console.log('✅ Agent workflow system operational');
      return true;
    } catch (error) {
      console.log(`❌ Error testing agent workflow: ${error}`);
      return false;
    }
  }

  async runSetup(): Promise<void> {
    console.log('🚀 Starting YouTube-to-Notes Project Setup\n');
    
    let hasFailures = false;
    
    for (const step of this.steps) {
      console.log(`\n📋 ${step.name}`);
      console.log(`   ${step.description}`);
      
      try {
        const success = await step.execute();
        this.results.set(step.name, success);
        
        if (!success && step.required) {
          hasFailures = true;
          console.log(`   ❌ Required step failed`);
        }
      } catch (error) {
        this.results.set(step.name, false);
        hasFailures = true;
        console.log(`   ❌ Step failed with error: ${error}`);
      }
    }
    
    // Summary
    console.log('\n📊 Setup Summary');
    console.log('═'.repeat(50));
    
    for (const step of this.steps) {
      const success = this.results.get(step.name);
      const status = success ? '✅' : '❌';
      const required = step.required ? '(Required)' : '(Optional)';
      console.log(`${status} ${step.name} ${required}`);
    }
    
    if (hasFailures) {
      console.log('\n❌ Setup completed with errors. Please fix the issues above.');
      console.log('\n💡 Next steps:');
      console.log('1. Update your .env file with correct credentials');
      console.log('2. Run: npm run setup');
      console.log('3. Start development: npm run dev');
      process.exit(1);
    } else {
      console.log('\n🎉 Setup completed successfully!');
      console.log('\n🚀 You can now start development:');
      console.log('   npm run dev');
      console.log('\n📚 Useful commands:');
      console.log('   npm run context:restore  # Restore project context');
      console.log('   npm run demo:interactive # Test agent workflow');
      console.log('   npm run demo:playwright # Test browser automation');
      console.log('   npm run demo:github     # Test GitHub integration');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ProjectSetup();
  setup.runSetup().catch(console.error);
}

export { ProjectSetup };
