/**
 * Coordinator Agent - Main orchestrator for the agent workflow system
 * 
 * Responsibilities:
 * - Task analysis and delegation
 * - Agent communication coordination
 * - Quality evaluation and approval
 * - Memory context updates
 * - Workflow state management
 * - Interactive decision handling
 */

import { CodingAgent } from './coding-agent';
import { FrontendAgent } from './frontend-agent';
import { BackendAgent } from './backend-agent';
import { ResearchAgent } from './research-agent';
import { QAAgent } from './qa-agent';
import { DebuggingAgent } from './debugging-agent';
import { MemoryContextAgent } from './memory-context-agent';
import { AgentQuestion, AgentDecision } from './base-agent';
import { playwrightAgent } from '../mcp/playwright-agent';
import { githubAgent } from '../mcp/github-agent';

export interface TaskRequest {
  id: string;
  type: 'simple' | 'coding' | 'frontend' | 'backend' | 'research' | 'playwright' | 'github' | 'todo_update' | 'debugging';
  description: string;
  requirements: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  input?: any;
}

export interface TaskResult {
  id: string;
  success: boolean;
  output: any;
  duration: number;
  agent: string;
  notes: string[];
  errors?: string[];
  recommendations?: string[];
  needsDecisions?: boolean;
  questions?: AgentQuestion[];
}

export interface AgentEvaluation {
  taskId: string;
  passed: boolean;
  quality: number; // 1-10
  issues: string[];
  suggestions: string[];
  approved: boolean;
}

export interface PendingDecision {
  taskId: string;
  agent: string;
  questions: AgentQuestion[];
  createdAt: Date;
  priority: string;
}

export class CoordinatorAgent {
  private agents = {
    coding: new CodingAgent(),
    frontend: new FrontendAgent(),
    backend: new BackendAgent(),
    research: new ResearchAgent(),
    qa: new QAAgent(),
    debugging: new DebuggingAgent(),
    memory: new MemoryContextAgent(),
    playwright: playwrightAgent,
    github: githubAgent
  };

  private taskHistory: TaskRequest[] = [];
  private taskResults: Map<string, TaskResult> = new Map();
  private evaluations: Map<string, AgentEvaluation> = new Map();
  private pendingDecisions: Map<string, PendingDecision> = new Map();

  async processTask(task: TaskRequest): Promise<TaskResult> {
    console.log(`🤖 Coordinator: Processing task ${task.id} - ${task.type}`);
    
    // Store task in history
    this.taskHistory.push(task);
    
    // Simple task check
    if (task.type === 'simple') {
      return this.handleSimpleTask(task);
    }
    
    // Check if task needs decisions first
    const decisionResult = await this.checkForDecisions(task);
    if (decisionResult.needsDecisions) {
      return decisionResult;
    }
    
    // Delegate to appropriate agent
    const result = await this.delegateTask(task);
    
    // QA evaluation (parallel with result processing)
    const qaEvaluation = await this.agents.qa.evaluateTask(result);
    this.evaluations.set(task.id, qaEvaluation);
    
    // Handle QA results
    if (!qaEvaluation.passed) {
      console.log(`⚠️ QA failed for task ${task.id}, triggering debugging workflow`);
      return await this.handleQAFailure(task, qaEvaluation);
    }
    
    // Update memory context
    await this.agents.memory.updateContext(task, result, qaEvaluation);
    
    console.log(`✅ Task ${task.id} completed successfully`);
    return result;
  }

  /**
   * Check if a task needs user decisions before proceeding
   */
  async checkForDecisions(task: TaskRequest): Promise<TaskResult> {
    const agent = this.getAgentForTaskType(task.type);
    
    if (!agent || !agent.generateQuestions) {
      return { id: task.id, success: false, output: null, duration: 0, agent: 'coordinator', notes: ['No questions generated'] };
    }

    try {
      const questions = await agent.generateQuestions(task);
      
      if (questions.length > 0) {
        console.log(`🤔 Task ${task.id} needs ${questions.length} decisions before proceeding`);
        
        // Store pending decision
        const pendingDecision: PendingDecision = {
          taskId: task.id,
          agent: task.type,
          questions,
          createdAt: new Date(),
          priority: task.priority
        };
        
        this.pendingDecisions.set(task.id, pendingDecision);
        
        return {
          id: task.id,
          success: false,
          output: { needsDecisions: true, questions },
          duration: 0,
          agent: task.type,
          notes: [`Awaiting ${questions.length} decisions for ${task.type} agent`],
          needsDecisions: true,
          questions
        };
      }
    } catch (error) {
      console.error(`Error checking for decisions: ${error}`);
    }
    
    return { id: task.id, success: false, output: null, duration: 0, agent: 'coordinator', notes: ['Decision check failed'] };
  }

  /**
   * Process user decisions and continue with task execution
   */
  async processDecisions(taskId: string, decisions: AgentDecision[]): Promise<TaskResult> {
    console.log(`🤖 Coordinator: Processing ${decisions.length} decisions for task ${taskId}`);
    
    const pendingDecision = this.pendingDecisions.get(taskId);
    if (!pendingDecision) {
      return this.createErrorResult(taskId, 'No pending decision found for this task');
    }

    // Validate decisions
    const validationResult = this.validateDecisions(pendingDecision.questions, decisions);
    if (!validationResult.valid) {
      return {
        id: taskId,
        success: false,
        output: { 
          needsDecisions: true, 
          questions: pendingDecision.questions,
          validationErrors: validationResult.errors 
        },
        duration: 0,
        agent: pendingDecision.agent,
        notes: ['Decision validation failed'],
        errors: validationResult.errors,
        needsDecisions: true,
        questions: pendingDecision.questions
      };
    }

    // Get the original task
    const originalTask = this.taskHistory.find(t => t.id === taskId);
    if (!originalTask) {
      return this.createErrorResult(taskId, 'Original task not found');
    }

    // Process decisions with the agent
    const agent = this.getAgentForTaskType(pendingDecision.agent);
    if (!agent) {
      return this.createErrorResult(taskId, 'Agent not found');
    }

    try {
      // Process decisions with the agent
      await agent.processDecisions(taskId, decisions);
      
      // Remove from pending decisions
      this.pendingDecisions.delete(taskId);
      
      // Continue with task execution
      return await this.delegateTask(originalTask);
      
    } catch (error) {
      console.error(`Error processing decisions: ${error}`);
      return this.createErrorResult(taskId, `Failed to process decisions: ${error}`);
    }
  }

  /**
   * Validate user decisions against required questions
   */
  private validateDecisions(questions: AgentQuestion[], decisions: AgentDecision[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredQuestions = questions.filter(q => q.required);
    
    // Check for required questions
    for (const question of requiredQuestions) {
      const decision = decisions.find(d => d.questionId === question.id);
      if (!decision || !decision.answer) {
        errors.push(`Missing required answer for: ${question.question}`);
      }
    }
    
    // Check for invalid question IDs
    for (const decision of decisions) {
      const question = questions.find(q => q.id === decision.questionId);
      if (!question) {
        errors.push(`Invalid question ID: ${decision.questionId}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all pending decisions
   */
  getPendingDecisions(): PendingDecision[] {
    return Array.from(this.pendingDecisions.values());
  }

  /**
   * Get pending decision for a specific task
   */
  getPendingDecision(taskId: string): PendingDecision | undefined {
    return this.pendingDecisions.get(taskId);
  }

  private async handleSimpleTask(task: TaskRequest): Promise<TaskResult> {
    console.log(`⚡ Handling simple task: ${task.description}`);
    
    const startTime = Date.now();
    
    // Execute simple task logic
    const output = await this.executeSimpleTask(task);
    
    const result: TaskResult = {
      id: task.id,
      success: true,
      output,
      duration: Date.now() - startTime,
      agent: 'coordinator',
      notes: ['Simple task executed directly by coordinator']
    };
    
    this.taskResults.set(task.id, result);
    return result;
  }

  private async delegateTask(task: TaskRequest): Promise<TaskResult> {
    const agent = this.getAgentForTaskType(task.type);
    
    if (!agent) {
      throw new Error(`No agent available for task type: ${task.type}`);
    }
    
    console.log(`📤 Delegating task ${task.id} to ${task.type} agent`);
    
    const startTime = Date.now();
    
    try {
      // Use the new interactive execution method
      const result = await agent.executeTaskWithDecisions(task);
      
      // If the agent needs decisions, return that result
      if ('needsDecisions' in result && result.needsDecisions) {
        return {
          id: task.id,
          success: false,
          output: { needsDecisions: true, questions: result.questions },
          duration: Date.now() - startTime,
          agent: task.type,
          notes: [`Awaiting decisions for ${task.type} agent`],
          needsDecisions: true,
          questions: result.questions
        };
      }
      
      // Otherwise, process the normal result
      result.duration = Date.now() - startTime;
      this.taskResults.set(task.id, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Error in ${task.type} agent:`, error);
      
      const result: TaskResult = {
        id: task.id,
        success: false,
        output: null,
        duration: Date.now() - startTime,
        agent: task.type,
        notes: [`Task failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`],
        errors: [error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)]
      };
      
      this.taskResults.set(task.id, result);
      return result;
    }
  }

  private async handleQAFailure(task: TaskRequest, qaEvaluation: AgentEvaluation): Promise<TaskResult> {
    console.log(`🔧 QA failure detected, starting debugging workflow`);
    
    const debuggingTask: TaskRequest = {
      id: `${task.id}-debug`,
      type: 'debugging',
      description: `Fix issues identified by QA: ${qaEvaluation.issues.join(', ')}`,
      requirements: qaEvaluation.issues,
      priority: 'high',
      context: {
        originalTask: task,
        qaEvaluation,
        originalResult: this.taskResults.get(task.id)
      }
    };
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Debugging attempt ${attempts}/${maxAttempts}`);
      
      // Delegate to debugging agent
      const debugResult = await this.delegateTask(debuggingTask);
      
      if (debugResult.success) {
        // Re-run QA on fixed code
        const newQAEvaluation = await this.agents.qa.evaluateTask(debugResult);
        
        if (newQAEvaluation.passed) {
          console.log(`✅ Issue fixed on attempt ${attempts}`);
          await this.agents.memory.updateContext(task, debugResult, newQAEvaluation);
          return debugResult;
        } else {
          console.log(`⚠️ Issue still present after fix attempt ${attempts}`);
          qaEvaluation = newQAEvaluation;
        }
      } else {
        // Debugging failed, need research
        console.log(`🔍 Debugging failed, triggering research agent`);
        await this.triggerResearchForDebugging(task, debugResult, attempts);
      }
    }
    
    // All attempts failed, generate comprehensive report
    console.log(`💥 All debugging attempts failed, generating comprehensive report`);
    return this.generateComprehensiveErrorReport(task, attempts);
  }

  private async triggerResearchForDebugging(task: TaskRequest, debugResult: TaskResult, attempt: number): Promise<void> {
    const researchTask: TaskRequest = {
      id: `${task.id}-research-${attempt}`,
      type: 'research',
      description: `Research solutions for debugging failure: ${debugResult.errors?.join(', ')}`,
      requirements: [
        'Find solutions for debugging issues',
        'Document alternative approaches',
        'Identify root causes'
      ],
      priority: 'high',
      context: {
        originalTask: task,
        debugResult,
        attempt
      }
    };
    
    await this.delegateTask(researchTask);
  }

  private generateComprehensiveErrorReport(task: TaskRequest, attempts: number): TaskResult {
    const report = {
      taskId: task.id,
      attempts,
      originalTask: task,
      allDebuggingResults: this.taskResults.get(`${task.id}-debug`),
      recommendations: [
        'Manual intervention required',
        'Consider alternative approaches',
        'Re-evaluate task requirements'
      ]
    };
    
    return {
      id: `${task.id}-error-report`,
      success: false,
      output: report,
      duration: 0,
      agent: 'coordinator',
      notes: [`Comprehensive error report generated after ${attempts} failed debugging attempts`],
      errors: ['Maximum debugging attempts exceeded'],
      recommendations: report.recommendations
    };
  }

  private getAgentForTaskType(type: string): any {
    const agentMap = {
      coding: this.agents.coding,
      frontend: this.agents.frontend,
      backend: this.agents.backend,
      research: this.agents.research,
      playwright: this.agents.playwright,
      github: this.agents.github,
      debugging: this.agents.debugging
    };
    
    return agentMap[type as keyof typeof agentMap];
  }

  private async executeSimpleTask(task: TaskRequest): Promise<any> {
    // Implement simple task logic
    return { message: 'Simple task completed', task: task.description };
  }

  private createErrorResult(taskId: string, message: string): TaskResult {
    return {
      id: taskId,
      success: false,
      output: null,
      duration: 0,
      agent: 'coordinator',
      notes: [message],
      errors: [message]
    };
  }

  // Utility methods
  getTaskHistory(): TaskRequest[] {
    return this.taskHistory;
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId);
  }

  getEvaluation(taskId: string): AgentEvaluation | undefined {
    return this.evaluations.get(taskId);
  }

  async generateProjectReport(): Promise<any> {
    const successfulTasks = Array.from(this.taskResults.values()).filter(r => r.success);
    const failedTasks = Array.from(this.taskResults.values()).filter(r => !r.success);
    const pendingTasks = this.getPendingDecisions();
    
    return {
      totalTasks: this.taskHistory.length,
      successful: successfulTasks.length,
      failed: failedTasks.length,
      pending: pendingTasks.length,
      successRate: (successfulTasks.length / this.taskHistory.length) * 100,
      averageDuration: successfulTasks.reduce((sum, r) => sum + r.duration, 0) / successfulTasks.length,
      recentTasks: this.taskHistory.slice(-10),
      evaluations: Array.from(this.evaluations.values()),
      pendingDecisions: pendingTasks
    };
  }
}

// Singleton instance
export const coordinatorAgent = new CoordinatorAgent();
