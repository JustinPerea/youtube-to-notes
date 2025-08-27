/**
 * GitHub Controller for Repository Management
 * 
 * Provides MCP-like interface for GitHub operations including:
 * - Repository management
 * - Issue tracking
 * - Pull request management
 * - CI/CD integration
 * - Code reviews
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseUrl?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  labels: string[];
  assignees: string[];
  reviewers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GitHubCheck {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out';
  startedAt: string;
  completedAt?: string;
  output?: {
    title: string;
    summary: string;
    text?: string;
  };
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  committer: {
    name: string;
    email: string;
  };
  createdAt: string;
  url: string;
}

export class GitHubController {
  private config: GitHubConfig;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * Create a new issue
   */
  async createIssue(title: string, body: string, labels: string[] = []): Promise<GitHubIssue> {
    try {
      console.log(`📝 Creating issue: ${title}`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title,
          body,
          labels
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.status} ${response.statusText}`);
      }

      const issue = await response.json();
      console.log(`✅ Issue created: #${issue.number}`);
      
      return {
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        assignees: issue.assignees.map((a: any) => a.login),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at
      };
      
    } catch (error) {
      console.error(`❌ Failed to create issue: ${error}`);
      throw error;
    }
  }

  /**
   * Get all issues
   */
  async getIssues(state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    try {
      console.log(`📋 Getting ${state} issues`);
      
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues?state=${state}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get issues: ${response.status} ${response.statusText}`);
      }

      const issues = await response.json();
      console.log(`✅ Retrieved ${issues.length} issues`);
      
      return issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        assignees: issue.assignees.map((a: any) => a.login),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at
      }));
      
    } catch (error) {
      console.error(`❌ Failed to get issues: ${error}`);
      throw error;
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(title: string, body: string, head: string, base: string = 'main'): Promise<GitHubPR> {
    try {
      console.log(`🔀 Creating pull request: ${title}`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create pull request: ${response.status} ${response.statusText}`);
      }

      const pr = await response.json();
      console.log(`✅ Pull request created: #${pr.number}`);
      
      return {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha
        },
        labels: pr.labels.map((l: any) => l.name),
        assignees: pr.assignees.map((a: any) => a.login),
        reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
        createdAt: pr.created_at,
        updatedAt: pr.updated_at
      };
      
    } catch (error) {
      console.error(`❌ Failed to create pull request: ${error}`);
      throw error;
    }
  }

  /**
   * Get all pull requests
   */
  async getPullRequests(state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPR[]> {
    try {
      console.log(`🔀 Getting ${state} pull requests`);
      
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls?state=${state}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get pull requests: ${response.status} ${response.statusText}`);
      }

      const prs = await response.json();
      console.log(`✅ Retrieved ${prs.length} pull requests`);
      
      return prs.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha
        },
        labels: pr.labels.map((l: any) => l.name),
        assignees: pr.assignees.map((a: any) => a.login),
        reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
        createdAt: pr.created_at,
        updatedAt: pr.updated_at
      }));
      
    } catch (error) {
      console.error(`❌ Failed to get pull requests: ${error}`);
      throw error;
    }
  }

  /**
   * Create a check run
   */
  async createCheckRun(
    name: string,
    headSha: string,
    status: GitHubCheck['status'],
    conclusion?: GitHubCheck['conclusion'],
    output?: GitHubCheck['output']
  ): Promise<GitHubCheck> {
    try {
      console.log(`✅ Creating check run: ${name}`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/check-runs`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name,
          head_sha: headSha,
          status,
          conclusion,
          output,
          started_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create check run: ${response.status} ${response.statusText}`);
      }

      const check = await response.json();
      console.log(`✅ Check run created: ${check.id}`);
      
      return {
        id: check.id,
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
        startedAt: check.started_at,
        completedAt: check.completed_at,
        output: check.output
      };
      
    } catch (error) {
      console.error(`❌ Failed to create check run: ${error}`);
      throw error;
    }
  }

  /**
   * Update a check run
   */
  async updateCheckRun(
    checkRunId: string,
    status: GitHubCheck['status'],
    conclusion?: GitHubCheck['conclusion'],
    output?: GitHubCheck['output']
  ): Promise<GitHubCheck> {
    try {
      console.log(`🔄 Updating check run: ${checkRunId}`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/check-runs/${checkRunId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          status,
          conclusion,
          output,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update check run: ${response.status} ${response.statusText}`);
      }

      const check = await response.json();
      console.log(`✅ Check run updated: ${check.id}`);
      
      return {
        id: check.id,
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
        startedAt: check.started_at,
        completedAt: check.completed_at,
        output: check.output
      };
      
    } catch (error) {
      console.error(`❌ Failed to update check run: ${error}`);
      throw error;
    }
  }

  /**
   * Get commits for a branch or PR
   */
  async getCommits(ref: string): Promise<GitHubCommit[]> {
    try {
      console.log(`📝 Getting commits for ${ref}`);
      
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/commits?sha=${ref}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get commits: ${response.status} ${response.statusText}`);
      }

      const commits = await response.json();
      console.log(`✅ Retrieved ${commits.length} commits`);
      
      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email
        },
        createdAt: commit.commit.author.date,
        url: commit.html_url
      }));
      
    } catch (error) {
      console.error(`❌ Failed to get commits: ${error}`);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<any> {
    try {
      console.log(`📂 Getting repository information`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}`, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get repository: ${response.status} ${response.statusText}`);
      }

      const repo = await response.json();
      console.log(`✅ Repository info retrieved: ${repo.name}`);
      
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at
      };
      
    } catch (error) {
      console.error(`❌ Failed to get repository: ${error}`);
      throw error;
    }
  }

  /**
   * Create a release
   */
  async createRelease(
    tagName: string,
    name: string,
    body: string,
    draft: boolean = false,
    prerelease: boolean = false
  ): Promise<any> {
    try {
      console.log(`🚀 Creating release: ${tagName}`);
      
      const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          tag_name: tagName,
          name,
          body,
          draft,
          prerelease
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create release: ${response.status} ${response.statusText}`);
      }

      const release = await response.json();
      console.log(`✅ Release created: ${release.tag_name}`);
      
      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        url: release.html_url
      };
      
    } catch (error) {
      console.error(`❌ Failed to create release: ${error}`);
      throw error;
    }
  }
}

// Export a factory function to create instances
export function createGitHubController(config: GitHubConfig): GitHubController {
  return new GitHubController(config);
}
