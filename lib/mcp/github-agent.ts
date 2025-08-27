/**
 * GitHub Agent for Repository Management and CI/CD
 * 
 * Integrates GitHub operations into our agent workflow for:
 * - Issue management and tracking
 * - Pull request automation
 * - CI/CD workflow management
 * - Release automation
 * - Code quality checks
 */

import { BaseAgent } from '../agents/base-agent';
import { TaskRequest, TaskResult } from '../agents/coordinator';
import { createGitHubController, GitHubController, GitHubConfig } from './github-controller';

export interface GitHubTaskRequest {
  action: 'create_issue' | 'create_pr' | 'create_check' | 'update_check' | 'get_repo_info' | 'create_release';
  params: any;
}

export class GitHubAgent extends BaseAgent {
  public name = 'GitHubAgent';
  private githubController: GitHubController | null = null;

  constructor() {
    super('GitHubAgent', ['GitHub repository management and CI/CD automation']);
  }

  private async initializeGitHubController(): Promise<GitHubController> {
    if (this.githubController) {
      return this.githubController;
    }

    // In a real implementation, this would come from environment variables
    const config: GitHubConfig = {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || 'your-username',
      repo: process.env.GITHUB_REPO || 'youtube-to-notes',
      baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
    };

    if (!config.token) {
      throw new Error('GitHub token not configured. Set GITHUB_TOKEN environment variable.');
    }

    this.githubController = createGitHubController(config);
    return this.githubController;
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🐙 GitHubAgent: Starting GitHub operation`);
      
      const githubTask = task.input as GitHubTaskRequest;
      const controller = await this.initializeGitHubController();
      
      let result: any;
      
      switch (githubTask.action) {
        case 'create_issue':
          result = await this.createIssue(controller, githubTask.params);
          break;
        case 'create_pr':
          result = await this.createPullRequest(controller, githubTask.params);
          break;
        case 'create_check':
          result = await this.createCheckRun(controller, githubTask.params);
          break;
        case 'update_check':
          result = await this.updateCheckRun(controller, githubTask.params);
          break;
        case 'get_repo_info':
          result = await this.getRepositoryInfo(controller, githubTask.params);
          break;
        case 'create_release':
          result = await this.createRelease(controller, githubTask.params);
          break;
        default:
          throw new Error(`Unknown GitHub action: ${githubTask.action}`);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        id: task.id,
        success: true,
        output: result,
        duration,
        agent: this.name,
        notes: [`GitHub operation completed: ${githubTask.action}`],
        recommendations: ['Review the GitHub operation results']
      };
      
    } catch (error) {
      console.error(`❌ GitHubAgent error: ${error}`);
      return this.createErrorResult(task, new Error(`GitHub operation failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  private async createIssue(controller: GitHubController, params: any): Promise<any> {
    const { title, body, labels = [] } = params;
    
    if (!title || !body) {
      throw new Error('Issue title and body are required');
    }

    const issue = await controller.createIssue(title, body, labels);
    
    return {
      type: 'issue_created',
      issue,
      url: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues/${issue.number}`
    };
  }

  private async createPullRequest(controller: GitHubController, params: any): Promise<any> {
    const { title, body, head, base = 'main' } = params;
    
    if (!title || !body || !head) {
      throw new Error('PR title, body, and head branch are required');
    }

    const pr = await controller.createPullRequest(title, body, head, base);
    
    return {
      type: 'pr_created',
      pullRequest: pr,
      url: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/pull/${pr.number}`
    };
  }

  private async createCheckRun(controller: GitHubController, params: any): Promise<any> {
    const { name, headSha, status = 'queued', conclusion, output } = params;
    
    if (!name || !headSha) {
      throw new Error('Check name and head SHA are required');
    }

    const check = await controller.createCheckRun(name, headSha, status, conclusion, output);
    
    return {
      type: 'check_created',
      check,
      checkRunId: check.id
    };
  }

  private async updateCheckRun(controller: GitHubController, params: any): Promise<any> {
    const { checkRunId, status, conclusion, output } = params;
    
    if (!checkRunId) {
      throw new Error('Check run ID is required');
    }

    const check = await controller.updateCheckRun(checkRunId, status, conclusion, output);
    
    return {
      type: 'check_updated',
      check,
      status: check.status,
      conclusion: check.conclusion
    };
  }

  private async getRepositoryInfo(controller: GitHubController, params: any): Promise<any> {
    const repo = await controller.getRepository();
    
    return {
      type: 'repo_info',
      repository: repo,
      stats: {
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        language: repo.language
      }
    };
  }

  private async createRelease(controller: GitHubController, params: any): Promise<any> {
    const { tagName, name, body, draft = false, prerelease = false } = params;
    
    if (!tagName || !name || !body) {
      throw new Error('Release tag name, name, and body are required');
    }

    const release = await controller.createRelease(tagName, name, body, draft, prerelease);
    
    return {
      type: 'release_created',
      release,
      url: release.url
    };
  }

  // Convenience methods for common workflows
  async createFeatureIssue(featureTitle: string, description: string): Promise<TaskResult> {
    return this.executeTask({
      id: `feature-issue-${Date.now()}`,
      type: 'github',
      description: `Create feature issue: ${featureTitle}`,
      requirements: ['Create GitHub issue with feature details'],
      priority: 'medium',
      input: {
        action: 'create_issue',
        params: {
          title: `Feature: ${featureTitle}`,
          body: description,
          labels: ['enhancement', 'feature']
        }
      }
    });
  }

  async createBugIssue(bugTitle: string, description: string, steps: string[]): Promise<TaskResult> {
    return this.executeTask({
      id: `bug-issue-${Date.now()}`,
      type: 'github',
      description: `Create bug issue: ${bugTitle}`,
      requirements: ['Create GitHub issue with bug details'],
      priority: 'high',
      input: {
        action: 'create_issue',
        params: {
          title: `Bug: ${bugTitle}`,
          body: `${description}\n\n## Steps to Reproduce\n${steps.map(s => `1. ${s}`).join('\n')}\n\n## Expected Behavior\n\n## Actual Behavior`,
          labels: ['bug', 'needs-investigation']
        }
      }
    });
  }

  async createQualityCheckRun(name: string, sha: string): Promise<TaskResult> {
    return this.executeTask({
      id: `quality-check-${Date.now()}`,
      type: 'github',
      description: `Create quality check: ${name}`,
      requirements: ['Create GitHub check run for quality validation'],
      priority: 'high',
      input: {
        action: 'create_check',
        params: {
          name,
          headSha: sha,
          status: 'in_progress',
          output: {
            title: 'Running quality checks',
            summary: 'Validating code quality, tests, and build status'
          }
        }
      }
    });
  }

  async updateQualityCheckResult(checkRunId: string, success: boolean, summary: string): Promise<TaskResult> {
    return this.executeTask({
      id: `update-quality-check-${Date.now()}`,
      type: 'github',
      description: 'Update quality check result',
      requirements: ['Update GitHub check run with results'],
      priority: 'high',
      input: {
        action: 'update_check',
        params: {
          checkRunId,
          status: 'completed',
          conclusion: success ? 'success' : 'failure',
          output: {
            title: success ? 'Quality checks passed' : 'Quality checks failed',
            summary
          }
        }
      }
    });
  }

  async createReleaseTask(version: string, changelog: string): Promise<TaskResult> {
    return this.executeTask({
      id: `release-${Date.now()}`,
      type: 'github',
      description: `Create release: ${version}`,
      requirements: ['Create GitHub release'],
      priority: 'medium',
      input: {
        action: 'create_release',
        params: {
          tagName: `v${version}`,
          name: `Release ${version}`,
          body: changelog,
          draft: false,
          prerelease: version.includes('alpha') || version.includes('beta')
        }
      }
    });
  }
}

// Singleton instance
export const githubAgent = new GitHubAgent();
