/**
 * Memory Context Agent - Handles project state tracking, knowledge preservation, and documentation
 */

import { BaseAgent } from './base-agent';
import { TaskRequest, TaskResult, AgentEvaluation } from './coordinator';

export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  tasks: TaskContext[];
  decisions: DecisionLog[];
  knowledge: KnowledgeEntry[];
  metrics: ProjectMetrics;
}

export interface TaskContext {
  id: string;
  description: string;
  result: TaskResult;
  evaluation?: AgentEvaluation;
  notes: string[];
  timestamp: Date;
}

export interface DecisionLog {
  id: string;
  decision: string;
  reasoning: string;
  alternatives: string[];
  impact: string;
  timestamp: Date;
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  category: string;
  tags: string[];
  timestamp: Date;
  references: string[];
}

export interface ProjectMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  successRate: number;
  agentPerformance: Map<string, any>;
}

export class MemoryContextAgent extends BaseAgent {
  public name = 'MemoryContextAgent';
  private projectContext: ProjectContext;
  private bugSolutionGuide: Map<string, any> = new Map();
  private agentNotes: Map<string, string[]> = new Map();

  constructor() {
    super('MemoryContextAgent', [
      'Project state tracking',
      'Knowledge preservation',
      'Decision logging',
      'Performance metrics',
      'Bug and solution tracking',
      'Agent coordination'
    ]);

    // Initialize project context
    this.projectContext = {
      id: 'youtube-to-notes',
      name: 'YouTube-to-Notes',
      description: 'AI-powered video content transformation application',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
      decisions: [],
      knowledge: [],
      metrics: {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0,
        successRate: 0,
        agentPerformance: new Map()
      }
    };
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    this.log(`Starting memory context task: ${task.description}`);
    
    if (!this.validateTask(task)) {
      return this.createErrorResult(task, new Error('Invalid task validation'));
    }

    // Check if this is a TODO update task
    if (task.type === 'todo_update') {
      return await this.updateTodoList(task);
    }

    try {
      const startTime = Date.now();
      
      // Handle memory context operations
      const analysis = this.analyzeMemoryRequirements(task);
      this.log(`Memory analysis completed: ${analysis.type} operation`);
      
      let output: any;
      
      switch (analysis.type) {
        case 'context-update':
          output = await this.updateProjectContext(task, analysis);
          break;
        case 'knowledge-capture':
          output = await this.captureKnowledgeInternal(task, analysis);
          break;
        case 'decision-logging':
          output = await this.logDecisionInternal(task, analysis);
          break;
        case 'metrics-update':
          output = await this.updateMetrics(task, analysis);
          break;
        case 'bug-tracking':
          output = await this.updateBugSolutionGuide(task, analysis);
          break;
        default:
          output = await this.generalMemoryOperation(task, analysis);
      }

      const duration = Date.now() - startTime;
      
      this.recordPerformance(task.id, {
        operationType: analysis.type,
        complexity: analysis.complexity,
        duration,
        contextUpdated: output.contextUpdated || false
      });

      return this.createSuccessResult(task, output, [
        `Operation: ${analysis.type}`,
        `Context Updated: ${output.contextUpdated || false}`
      ]);

    } catch (error) {
      this.log(`Memory context task failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return this.createErrorResult(task, error as Error);
    }
  }

  async updateContext(task: TaskRequest, result: TaskResult, evaluation?: AgentEvaluation): Promise<void> {
    this.log(`Updating context for task: ${task.id}`);
    
    // Update task context
    const taskContext: TaskContext = {
      id: task.id,
      description: task.description,
      result,
      evaluation,
      notes: result.notes || [],
      timestamp: new Date()
    };

    this.projectContext.tasks.push(taskContext);

    // Update metrics
    this.updateTaskMetrics(result);

    // Store agent notes
    if (result.agent && result.notes) {
      const existingNotes = this.agentNotes.get(result.agent) || [];
      this.agentNotes.set(result.agent, [...existingNotes, ...result.notes]);
    }

    // Update project status
    this.projectContext.updatedAt = new Date();

    this.log(`Context updated for task ${task.id}`);
  }

  async logDecision(decision: string, reasoning: string, alternatives: string[], impact: string): Promise<void> {
    const decisionLog: DecisionLog = {
      id: `decision-${Date.now()}`,
      decision,
      reasoning,
      alternatives,
      impact,
      timestamp: new Date()
    };

    this.projectContext.decisions.push(decisionLog);
    this.log(`Decision logged: ${decision}`);
  }

  async captureKnowledge(topic: string, content: string, category: string, tags: string[] = []): Promise<void> {
    const knowledgeEntry: KnowledgeEntry = {
      id: `knowledge-${Date.now()}`,
      topic,
      content,
      category,
      tags,
      timestamp: new Date(),
      references: []
    };

    this.projectContext.knowledge.push(knowledgeEntry);
    this.log(`Knowledge captured: ${topic}`);
  }

  async addBugSolution(bug: string, solution: string, context: string): Promise<void> {
    this.bugSolutionGuide.set(bug, {
      solution,
      context,
      timestamp: new Date(),
      occurrences: 1
    });
  }

  async getBugSolution(bug: string): Promise<any> {
    const existing = this.bugSolutionGuide.get(bug);
    if (existing) {
      existing.occurrences += 1;
      this.bugSolutionGuide.set(bug, existing);
    }
    return existing;
  }

  async getProjectReport(): Promise<ProjectContext> {
    return this.projectContext;
  }

  async getAgentNotes(agent: string): Promise<string[]> {
    return this.agentNotes.get(agent) || [];
  }

  private analyzeMemoryRequirements(task: TaskRequest): {
    type: string;
    complexity: 'low' | 'medium' | 'high';
    impact: string[];
  } {
    const description = task.description.toLowerCase();
    
    let type = 'general';
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const impact: string[] = [];
    
    if (description.includes('context') || description.includes('update')) {
      type = 'context-update';
    } else if (description.includes('knowledge') || description.includes('capture')) {
      type = 'knowledge-capture';
    } else if (description.includes('decision') || description.includes('log')) {
      type = 'decision-logging';
    } else if (description.includes('metrics') || description.includes('performance')) {
      type = 'metrics-update';
    } else if (description.includes('bug') || description.includes('solution')) {
      type = 'bug-tracking';
    }

    return { type, complexity, impact };
  }

  private async updateProjectContext(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`Updating project context: ${task.description}`);
    
    // Update context based on task
    this.projectContext.updatedAt = new Date();
    
    return {
      contextUpdated: true,
      timestamp: this.projectContext.updatedAt,
      taskCount: this.projectContext.tasks.length
    };
  }

  private async captureKnowledgeInternal(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`Capturing knowledge: ${task.description}`);
    
    await this.captureKnowledge(
      task.description,
      'Knowledge content from task execution',
      'technical',
      ['implementation', 'best-practices']
    );
    
    return {
      knowledgeCaptured: true,
      topic: task.description,
      category: 'technical'
    };
  }

  private async logDecisionInternal(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`Logging decision: ${task.description}`);
    
    await this.logDecision(
      task.description,
      'Decision made during task execution',
      ['Alternative A', 'Alternative B'],
      'Improves project development'
    );
    
    return {
      decisionLogged: true,
      decision: task.description
    };
  }

  private async updateMetrics(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`Updating metrics: ${task.description}`);
    
    // Metrics will be updated when task result is processed
    return {
      metricsUpdated: true,
      currentMetrics: this.projectContext.metrics
    };
  }

  private async updateBugSolutionGuide(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`Updating bug solution guide: ${task.description}`);
    
    await this.addBugSolution(
      'Example bug',
      'Example solution',
      'Bug context from task'
    );
    
    return {
      bugSolutionUpdated: true,
      guideSize: this.bugSolutionGuide.size
    };
  }

  private async generalMemoryOperation(task: TaskRequest, analysis: any): Promise<any> {
    this.log(`General memory operation: ${task.description}`);
    
    return {
      operation: 'general',
      contextUpdated: false
    };
  }

  private updateTaskMetrics(result: TaskResult): void {
    const metrics = this.projectContext.metrics;
    metrics.totalTasks += 1;
    
    if (result.success) {
      metrics.successfulTasks += 1;
    } else {
      metrics.failedTasks += 1;
    }
    
    // Update average duration
    const totalDuration = metrics.averageTaskDuration * (metrics.totalTasks - 1) + result.duration;
    metrics.averageTaskDuration = totalDuration / metrics.totalTasks;
    
    // Calculate success rate
    metrics.successRate = (metrics.successfulTasks / metrics.totalTasks) * 100;
    
    // Update agent performance
    if (result.agent) {
      const agentPerf = metrics.agentPerformance.get(result.agent) || {
        totalTasks: 0,
        successfulTasks: 0,
        averageDuration: 0
      };
      
      agentPerf.totalTasks += 1;
      if (result.success) agentPerf.successfulTasks += 1;
      
      const agentTotalDuration = agentPerf.averageDuration * (agentPerf.totalTasks - 1) + result.duration;
      agentPerf.averageDuration = agentTotalDuration / agentPerf.totalTasks;
      
      metrics.agentPerformance.set(result.agent, agentPerf);
    }
  }

  // Utility methods
  async generateContextReport(): Promise<string> {
    const metrics = this.projectContext.metrics;
    
    return `
# Project Context Report: ${this.projectContext.name}

## Project Overview
- **Status:** ${this.projectContext.status}
- **Created:** ${this.projectContext.createdAt.toISOString()}
- **Last Updated:** ${this.projectContext.updatedAt.toISOString()}

## Task Metrics
- **Total Tasks:** ${metrics.totalTasks}
- **Successful:** ${metrics.successfulTasks}
- **Failed:** ${metrics.failedTasks}
- **Success Rate:** ${metrics.successRate.toFixed(1)}%
- **Average Duration:** ${metrics.averageTaskDuration.toFixed(0)}ms

## Recent Decisions
${this.projectContext.decisions.slice(-5).map(d => `- ${d.decision} (${d.timestamp.toISOString()})`).join('\n')}

## Knowledge Base
${this.projectContext.knowledge.map(k => `- ${k.topic} (${k.category})`).join('\n')}

## Bug Solution Guide
${Array.from(this.bugSolutionGuide.entries()).map(([bug, info]) => `- ${bug}: ${info.solution}`).join('\n')}
`;
  }

  // TODO List Management Methods
  private async updateTodoList(task: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📋 MemoryContextAgent: Updating TODO list`);
      
      const { action, taskId, status, notes, priority, title, description } = task.input || {};
      
      // Read current TODO list
      const todoPath = 'docs/TODO.md';
      let todoContent = '';
      
      try {
        // In a real implementation, this would read from the filesystem
        todoContent = await this.readFile(todoPath);
      } catch (error) {
        console.log('TODO file not found, creating new one');
        todoContent = this.getDefaultTodoContent();
      }
      
      // Update TODO based on action
      let updatedContent = '';
      
      switch (action) {
        case 'mark_completed':
          updatedContent = this.markTaskCompleted(todoContent, taskId);
          break;
        case 'add_task':
          updatedContent = this.addNewTask(todoContent, { id: taskId, title, description, priority });
          break;
        case 'update_status':
          updatedContent = this.updateTaskStatus(todoContent, taskId, status);
          break;
        case 'add_note':
          updatedContent = this.addTaskNote(todoContent, taskId, notes);
          break;
        case 'set_priority':
          updatedContent = this.setTaskPriority(todoContent, taskId, priority);
          break;
        default:
          throw new Error(`Unknown TODO action: ${action}`);
      }
      
      // Write updated TODO list
      await this.writeFile(todoPath, updatedContent);
      
      return {
        id: task.id,
        success: true,
        output: {
          action,
          taskId,
          status: 'updated',
          timestamp: new Date().toISOString()
        },
        duration: Date.now() - startTime,
        agent: this.name,
        notes: [`TODO list updated: ${action} for task ${taskId}`],
        recommendations: ['Review updated TODO list']
      };
      
    } catch (error) {
      console.error(`❌ TODO update error: ${error}`);
      return {
        id: task.id,
        success: false,
        output: null,
        duration: Date.now() - startTime,
        agent: this.name,
        notes: ['Failed to update TODO list'],
        errors: [error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)]
      };
    }
  }

  private getDefaultTodoContent(): string {
    return `# 📋 Living Todo List - YouTube-to-Notes

## 🎯 Project Status: Phase 1 MVP Development

### ✅ **Completed**
- [x] **Agent Workflow System**: 8 specialized agents with interactive decision-making
- [x] **Template System**: 6 content formats for video processing
- [x] **Gemini API Integration**: Video processing client with queue management
- [x] **Interactive Decision System**: Agents ask questions before proceeding
- [x] **Project Configuration**: Next.js, TypeScript, Tailwind CSS setup
- [x] **Documentation**: Comprehensive project overview and guides
- [x] **Demo Scripts**: Interactive workflow and Playwright demonstrations
- [x] **Browser Automation**: Playwright integration for UI testing

### 🔄 **In Progress**
- [ ] **Frontend UI Implementation**: Landing page and core components
- [ ] **Backend API Development**: Video processing endpoints
- [ ] **Database Schema Design**: User management and video history
- [ ] **Authentication System**: User accounts and subscription tiers

### 📋 **Next Up (Priority Order)**
- [ ] Set up development environment
- [ ] Implement database schema
- [ ] Create authentication system
- [ ] Build landing page
- [ ] Integrate Gemini API for video processing

---
**Last Updated**: ${new Date().toISOString()}
**Next Review**: Daily during development
**Priority**: High - Active development phase`;
  }

  private markTaskCompleted(content: string, taskId: string): string {
    // Find the task and mark it as completed
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes(taskId) && line.includes('- [ ]')) {
        return line.replace('- [ ]', '- [x]');
      }
      return line;
    });
    return updatedLines.join('\n');
  }

  private addNewTask(content: string, taskData: any): string {
    const { id, title, description = '', priority = 'medium' } = taskData;
    
    const newTaskLine = `- [ ] **${title}**: ${description} [${priority.toUpperCase()}]`;
    
    // Find the "Next Up" section and add the task
    const lines = content.split('\n');
    let sectionIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Next Up')) {
        sectionIndex = i;
        break;
      }
    }
    
    if (sectionIndex !== -1) {
      lines.splice(sectionIndex + 1, 0, newTaskLine);
    }
    
    return lines.join('\n');
  }

  private updateTaskStatus(content: string, taskId: string, status: string): string {
    // Implementation for updating task status
    return content.replace(taskId, `${taskId} (${status})`);
  }

  private addTaskNote(content: string, taskId: string, note: string): string {
    // Implementation for adding notes to tasks
    return content.replace(taskId, `${taskId} - Note: ${note}`);
  }

  private setTaskPriority(content: string, taskId: string, priority: string): string {
    // Implementation for setting task priority
    return content.replace(taskId, `${taskId} [${priority.toUpperCase()}]`);
  }

  private async readFile(path: string): Promise<string> {
    // In a real implementation, this would read from the filesystem
    // For now, we'll simulate file reading
    return '';
  }

  private async writeFile(path: string, content: string): Promise<void> {
    // In a real implementation, this would write to the filesystem
    console.log(`📝 Would write to ${path}:`);
    console.log(content);
  }
}
