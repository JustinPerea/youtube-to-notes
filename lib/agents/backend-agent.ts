/**
 * Backend Agent - Handles API development, database operations, and server-side logic
 */

import { BaseAgent } from './base-agent';
import { TaskRequest, TaskResult } from './coordinator';

export class BackendAgent extends BaseAgent {
  constructor() {
    super('BackendAgent', [
      'API development',
      'Database operations',
      'Authentication',
      'Performance optimization',
      'Security implementation',
      'Server-side logic'
    ]);
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    this.log(`Starting backend task: ${task.description}`);
    
    if (!this.validateTask(task)) {
      return this.createErrorResult(task, new Error('Invalid task validation'));
    }

    try {
      const startTime = Date.now();
      
      const analysis = this.analyzeBackendRequirements(task);
      this.log(`Backend analysis completed: ${analysis.type} endpoint`);
      
      let output: any;
      
      switch (analysis.type) {
        case 'api':
          output = await this.createAPIEndpoint(task, analysis);
          break;
        case 'database':
          output = await this.handleDatabaseOperation(task, analysis);
          break;
        case 'auth':
          output = await this.handleAuthentication(task, analysis);
          break;
        case 'integration':
          output = await this.handleThirdPartyIntegration(task, analysis);
          break;
        default:
          output = await this.generalBackendImplementation(task, analysis);
      }

      const duration = Date.now() - startTime;
      
      this.recordPerformance(task.id, {
        endpointType: analysis.type,
        complexity: analysis.complexity,
        duration,
        endpointsCreated: output.endpointsCreated || 0
      });

      return this.createSuccessResult(task, output, [
        `Type: ${analysis.type}`,
        `Complexity: ${analysis.complexity}`,
        `Endpoints: ${output.endpointsCreated || 0}`
      ]);

    } catch (error) {
      this.log(`Backend task failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return this.createErrorResult(task, error as Error);
    }
  }

  private analyzeBackendRequirements(task: TaskRequest): {
    type: string;
    complexity: 'low' | 'medium' | 'high';
    features: string[];
  } {
    const description = task.description.toLowerCase();
    let type = 'general';
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const features: string[] = [];
    
    if (description.includes('api') || description.includes('endpoint')) {
      type = 'api';
    } else if (description.includes('database') || description.includes('db')) {
      type = 'database';
    } else if (description.includes('auth') || description.includes('login')) {
      type = 'auth';
    } else if (description.includes('integration') || description.includes('third-party')) {
      type = 'integration';
    }

    return { type, complexity, features };
  }

  private async createAPIEndpoint(task: TaskRequest, analysis: any): Promise<any> {
    return {
      endpoint: task.description,
      endpointsCreated: 1,
      filesModified: ['api-route.ts'],
      features: analysis.features
    };
  }

  private async handleDatabaseOperation(task: TaskRequest, analysis: any): Promise<any> {
    return {
      database: task.description,
      operations: ['query', 'migration'],
      filesModified: ['database.ts', 'schema.sql']
    };
  }

  private async handleAuthentication(task: TaskRequest, analysis: any): Promise<any> {
    return {
      auth: task.description,
      features: ['login', 'register', 'middleware'],
      filesModified: ['auth.ts', 'middleware.ts']
    };
  }

  private async handleThirdPartyIntegration(task: TaskRequest, analysis: any): Promise<any> {
    return {
      integration: task.description,
      endpointsCreated: 1,
      filesModified: ['integration.ts']
    };
  }

  private async generalBackendImplementation(task: TaskRequest, analysis: any): Promise<any> {
    return {
      implementation: task.description,
      endpointsCreated: 1,
      filesModified: ['backend.ts']
    };
  }
}
