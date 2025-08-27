/**
 * Project Context Memory System
 * 
 * This system maintains persistent memory of our agent workflow,
 * project decisions, and development state across sessions.
 */

import { AgentDecision } from '../agents/base-agent';
import { TaskRequest, TaskResult } from '../agents/coordinator';

export interface ProjectMemory {
  id: string;
  name: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Agent Workflow State
  agentWorkflow: {
    enabled: boolean;
    coordinatorAgent: boolean;
    interactiveDecisions: boolean;
    qaWorkflow: boolean;
    memoryContext: boolean;
  };
  
  // Project Configuration
  config: {
    designSystem: string;
    architecture: string;
    techStack: string[];
    priorities: string[];
    constraints: string[];
  };
  
  // Decision History
  decisions: {
    [agentType: string]: {
      [taskId: string]: AgentDecision[];
    };
  };
  
  // Task History
  tasks: {
    [taskId: string]: {
      request: TaskRequest;
      result: TaskResult;
      timestamp: Date;
      agent: string;
    };
  };
  
  // Learning & Patterns
  learning: {
    userPreferences: {
      [userId: string]: {
        designStyle: string;
        complexity: 'low' | 'medium' | 'high';
        features: string[];
        timestamp: Date;
      };
    };
    commonDecisions: {
      [questionId: string]: {
        answer: string;
        frequency: number;
        successRate: number;
      };
    };
    agentPerformance: {
      [agentName: string]: {
        successRate: number;
        averageDuration: number;
        commonIssues: string[];
      };
    };
  };
  
  // Project State
  state: {
    currentPhase: string;
    activeTasks: string[];
    pendingDecisions: string[];
    nextSteps: string[];
    blockers: string[];
  };
}

export interface MemoryContext {
  // Core memory
  getProject(): ProjectMemory;
  
  // Session-specific context
  getSession(): any;
  
  // Quick access methods
  getProjectState(): any;
  saveDecision(agentType: string, taskId: string, decisions: AgentDecision[]): void;
  getDecisionHistory(agentType: string, taskId?: string): AgentDecision[];
  getUserPreferences(userId: string): any;
  updateUserPreferences(userId: string, preferences: any): void;
  addTaskResult(taskId: string, request: TaskRequest, result: TaskResult, agent: string): void;
  getCommonDecisions(questionId: string): any;
  updateProjectState(updates: Partial<ProjectMemory['state']>): void;
}

class ProjectMemoryManager implements MemoryContext {
  private project!: ProjectMemory;
  private session: any;
  private memoryFile = '.memory/project-context.json';
  
  getProject(): ProjectMemory {
    return this.project;
  }
  
  getSession(): any {
    return this.session;
  }
  
  constructor() {
    this.initializeMemory();
    this.loadFromStorage();
  }
  
  private initializeMemory(): void {
    this.project = {
      id: 'youtube-to-notes',
      name: 'YouTube-to-Notes: AI-Powered Video Content Transformation',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      agentWorkflow: {
        enabled: true,
        coordinatorAgent: true,
        interactiveDecisions: true,
        qaWorkflow: true,
        memoryContext: true,
      },
      
      config: {
        designSystem: 'Glass Morphism',
        architecture: 'Next.js App Router with API Routes',
        techStack: [
          'Next.js 14',
          'TypeScript',
          'Tailwind CSS',
          'Supabase',
          'Gemini 2.5 Flash API',
          'NextAuth.js',
          'Zustand'
        ],
        priorities: [
          'User Experience',
          'Performance',
          'Scalability',
          'Maintainability'
        ],
        constraints: [
          'Budget: Cost-effective Gemini API usage',
          'Time: 8-week MVP development',
          'Team: Solo developer initially'
        ]
      },
      
      decisions: {},
      tasks: {},
      
      learning: {
        userPreferences: {},
        commonDecisions: {},
        agentPerformance: {}
      },
      
      state: {
        currentPhase: 'Phase 1: MVP Foundation',
        activeTasks: [],
        pendingDecisions: [],
        nextSteps: [
          'Set up development environment',
          'Implement database schema',
          'Create authentication system',
          'Build landing page'
        ],
        blockers: []
      }
    };
    
    this.session = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      currentUser: 'developer',
      activeTasks: [],
      decisionsMade: []
    };
  }
  
  private async loadFromStorage(): Promise<void> {
    try {
      // In a real implementation, this would load from a file or database
      // For now, we'll keep it in memory
      console.log('🧠 Loading project memory...');
    } catch (error) {
      console.log('🧠 Creating new project memory...');
    }
  }
  
  private async saveToStorage(): Promise<void> {
    try {
      this.project.updatedAt = new Date();
      // In a real implementation, this would save to a file or database
      console.log('💾 Project memory saved.');
    } catch (error) {
      console.error('❌ Failed to save project memory:', error);
    }
  }
  
  getProjectState(): any {
    return {
      ...this.project.state,
      config: this.project.config,
      agentWorkflow: this.project.agentWorkflow
    };
  }
  
  saveDecision(agentType: string, taskId: string, decisions: AgentDecision[]): void {
    if (!this.project.decisions[agentType]) {
      this.project.decisions[agentType] = {};
    }
    
    this.project.decisions[agentType][taskId] = decisions;
    
    // Update learning data
    decisions.forEach(decision => {
      if (!this.project.learning.commonDecisions[decision.questionId]) {
        this.project.learning.commonDecisions[decision.questionId] = {
          answer: decision.answer,
          frequency: 0,
          successRate: 0
        };
      }
      
      this.project.learning.commonDecisions[decision.questionId].frequency++;
    });
    
    // Update session
    this.session.decisionsMade.push(...decisions);
    
    this.saveToStorage();
  }
  
  getDecisionHistory(agentType: string, taskId?: string): AgentDecision[] {
    if (!taskId) {
      // Return all decisions for this agent type
      const allDecisions: AgentDecision[] = [];
      Object.values(this.project.decisions[agentType] || {}).forEach(decisions => {
        allDecisions.push(...decisions);
      });
      return allDecisions;
    }
    
    return this.project.decisions[agentType]?.[taskId] || [];
  }
  
  getUserPreferences(userId: string): any {
    return this.project.learning.userPreferences[userId] || null;
  }
  
  updateUserPreferences(userId: string, preferences: any): void {
    this.project.learning.userPreferences[userId] = {
      ...preferences,
      timestamp: new Date()
    };
    this.saveToStorage();
  }
  
  addTaskResult(taskId: string, request: TaskRequest, result: TaskResult, agent: string): void {
    this.project.tasks[taskId] = {
      request,
      result,
      timestamp: new Date(),
      agent
    };
    
    // Update agent performance
    if (!this.project.learning.agentPerformance[agent]) {
      this.project.learning.agentPerformance[agent] = {
        successRate: 0,
        averageDuration: 0,
        commonIssues: []
      };
    }
    
    this.saveToStorage();
  }
  
  getCommonDecisions(questionId: string): any {
    return this.project.learning.commonDecisions[questionId] || null;
  }
  
  updateProjectState(updates: Partial<ProjectMemory['state']>): void {
    this.project.state = {
      ...this.project.state,
      ...updates
    };
    this.saveToStorage();
  }
  
  // Memory persistence methods
  async persist(): Promise<void> {
    await this.saveToStorage();
  }
  
  async restore(): Promise<void> {
    await this.loadFromStorage();
  }
  
  // Context generation for AI
  generateContext(): string {
    return `
# YouTube-to-Notes Project Context

## Agent Workflow System
Our project uses an 8-agent workflow system with interactive decision-making:
- Coordinator Agent: Orchestrates all tasks and manages workflow
- Coding Agent: General code generation and implementation
- Frontend Agent: UI/UX with design-focused questions
- Backend Agent: API development and server-side logic
- QA Agent: Quality assessment and testing
- Research Agent: Technology exploration and solution research
- Debugging Agent: Error analysis and fixing
- Memory Context Agent: Project state tracking and knowledge preservation

## Key Design Decisions
- Design System: ${this.project.config.designSystem}
- Architecture: ${this.project.config.architecture}
- Tech Stack: ${this.project.config.techStack.join(', ')}
- Priorities: ${this.project.config.priorities.join(', ')}

## Current State
- Phase: ${this.project.state.currentPhase}
- Active Tasks: ${this.project.state.activeTasks.length}
- Pending Decisions: ${this.project.state.pendingDecisions.length}
- Next Steps: ${this.project.state.nextSteps.slice(0, 3).join(', ')}

## Interactive Decision System
Agents ask questions before implementing to avoid assumptions:
- Design style (Glass Morphism, Modern Minimalist, etc.)
- Layout preferences (single-page, multi-page, etc.)
- Accessibility requirements
- Performance priorities
- Technical decisions

## Common Patterns
${Object.entries(this.project.learning.commonDecisions)
  .slice(0, 5)
  .map(([questionId, data]) => `${questionId}: ${data.answer} (${data.frequency} times)`)
  .join('\n')}

## User Preferences
${Object.entries(this.project.learning.userPreferences)
  .slice(0, 3)
  .map(([userId, prefs]) => `${userId}: ${prefs.designStyle} design, ${prefs.complexity} complexity`)
  .join('\n')}
`;
  }
  
  // Export for debugging
  exportMemory(): ProjectMemory {
    return JSON.parse(JSON.stringify(this.project));
  }
}

// Singleton instance
export const projectMemory = new ProjectMemoryManager();
