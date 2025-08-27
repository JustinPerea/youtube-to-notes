/**
 * Base Agent Class - Provides common functionality for all agents
 */

import { TaskRequest, TaskResult } from './coordinator';

export interface AgentQuestion {
  id: string;
  type: 'choice' | 'text' | 'image' | 'design' | 'technical' | 'preference';
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  context?: string;
  examples?: string[];
  followUpQuestions?: AgentQuestion[];
}

export interface AgentDecision {
  questionId: string;
  answer: string | string[] | any;
  reasoning?: string;
  impact?: string[];
}

export class BaseAgent {
  protected agentName: string;
  protected capabilities: string[];
  protected performanceMetrics: Map<string, any> = new Map();
  protected decisionHistory: Map<string, AgentDecision[]> = new Map();

  constructor(agentName: string, capabilities: string[]) {
    this.agentName = agentName;
    this.capabilities = capabilities;
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    throw new Error('executeTask method must be implemented by subclass');
  }

  /**
   * Generate questions that need user input before proceeding
   * Override this method in specific agents to provide relevant questions
   */
  protected async generateQuestions(task: TaskRequest): Promise<AgentQuestion[]> {
    // Base implementation returns no questions
    // Specific agents should override this
    return [];
  }

  /**
   * Process user answers and validate them
   */
  protected async processDecisions(taskId: string, decisions: AgentDecision[]): Promise<boolean> {
    // Store decisions for this task
    this.decisionHistory.set(taskId, decisions);
    
    // Validate that all required questions were answered
    const questions = await this.generateQuestions({ id: taskId } as TaskRequest);
    const requiredQuestions = questions.filter(q => q.required);
    
    for (const question of requiredQuestions) {
      const decision = decisions.find(d => d.questionId === question.id);
      if (!decision || !decision.answer) {
        return false; // Missing required answer
      }
    }
    
    return true;
  }

  /**
   * Execute task with interactive decision-making
   */
  async executeTaskWithDecisions(task: TaskRequest, decisions?: AgentDecision[]): Promise<TaskResult | { needsDecisions: true; questions: AgentQuestion[] }> {
    this.log(`Starting interactive task: ${task.description}`);
    
    // Generate questions for this task
    const questions = await this.generateQuestions(task);
    
    // If no decisions provided and questions exist, return questions
    if (!decisions && questions.length > 0) {
      this.log(`🤔 Need user decisions before proceeding`);
      return {
        needsDecisions: true,
        questions: questions
      };
    }
    
    // If decisions provided, process them
    if (decisions) {
      const valid = await this.processDecisions(task.id, decisions);
      if (!valid) {
        return {
          needsDecisions: true,
          questions: questions
        };
      }
    }
    
    // Proceed with task execution
    return this.executeTask(task);
  }

  /**
   * Create a design-related question
   */
  protected createDesignQuestion(
    id: string,
    question: string,
    description?: string,
    examples?: string[]
  ): AgentQuestion {
    return {
      id,
      type: 'design',
      question,
      description,
      examples,
      required: false,
      options: [
        'Modern Minimalist',
        'Glass Morphism',
        'Neumorphism',
        'Material Design',
        'Bauhaus',
        'Custom Style'
      ]
    };
  }

  /**
   * Create a technical question
   */
  protected createTechnicalQuestion(
    id: string,
    question: string,
    description?: string,
    options?: string[]
  ): AgentQuestion {
    return {
      id,
      type: 'technical',
      question,
      description,
      options,
      required: true
    };
  }

  /**
   * Create a preference question
   */
  protected createPreferenceQuestion(
    id: string,
    question: string,
    description?: string,
    options?: string[]
  ): AgentQuestion {
    return {
      id,
      type: 'preference',
      question,
      description,
      options,
      required: false
    };
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${this.agentName}:`;
    
    switch (level) {
      case 'info':
        console.log(`🔵 ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`🟡 ${prefix} ${message}`);
        break;
      case 'error':
        console.error(`🔴 ${prefix} ${message}`);
        break;
    }
  }

  protected validateTask(task: TaskRequest): boolean {
    if (!task.id || !task.description) {
      this.log('Invalid task: missing required fields', 'error');
      return false;
    }
    
    return true;
  }

  protected recordPerformance(taskId: string, metrics: any): void {
    this.performanceMetrics.set(taskId, {
      ...metrics,
      timestamp: new Date().toISOString(),
      agent: this.agentName
    });
  }

  protected createSuccessResult(task: TaskRequest, output: any, notes: string[] = []): TaskResult {
    return {
      id: task.id,
      success: true,
      output,
      duration: 0, // Will be set by coordinator
      agent: this.agentName,
      notes: [...notes, `Task completed by ${this.agentName}`]
    };
  }

  protected createErrorResult(task: TaskRequest, error: Error, additionalNotes: string[] = []): TaskResult {
    return {
      id: task.id,
      success: false,
      output: null,
      duration: 0, // Will be set by coordinator
      agent: this.agentName,
      notes: [...additionalNotes, `Task failed: ${error instanceof Error ? error.message : String(error)}`],
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }

  protected createPendingDecisionResult(task: TaskRequest, questions: AgentQuestion[]): TaskResult {
    return {
      id: task.id,
      success: false,
      output: { needsDecisions: true, questions },
      duration: 0,
      agent: this.agentName,
      notes: [`Awaiting user decisions for ${this.agentName}`],
      errors: ['Pending user decisions']
    };
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }

  getPerformanceMetrics(): Map<string, any> {
    return this.performanceMetrics;
  }

  getAgentName(): string {
    return this.agentName;
  }

  getDecisionHistory(taskId?: string): AgentDecision[] | Map<string, AgentDecision[]> {
    if (taskId) {
      return this.decisionHistory.get(taskId) || [];
    }
    return this.decisionHistory;
  }

  protected async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000,
    taskId: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  protected formatDetailedNotes(action: string, details: any[]): string[] {
    return [
      `${this.agentName} executed: ${action}`,
      `Details: ${details.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`
    ];
  }
}
