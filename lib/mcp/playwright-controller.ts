/**
 * Playwright Controller for Browser Automation
 * 
 * Provides MCP-like interface for browser control and testing
 * within the agent workflow system.
 */

import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';

export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'evaluate' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  options?: any;
}

export interface BrowserResult {
  success: boolean;
  data?: any;
  screenshot?: string;
  error?: string;
  duration: number;
}

export interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
  actions: BrowserAction[];
  results: BrowserResult[];
}

export class PlaywrightController {
  private sessions: Map<string, BrowserSession> = new Map();
  private defaultBrowser = 'chromium';

  /**
   * Create a new browser session
   */
  async createSession(
    sessionId: string,
    browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium',
    options: any = {}
  ): Promise<BrowserSession> {
    try {
      console.log(`🌐 Creating browser session: ${sessionId} with ${browserType}`);
      
      let browser: Browser;
      
      switch (browserType) {
        case 'firefox':
          browser = await firefox.launch({ headless: true, ...options });
          break;
        case 'webkit':
          browser = await webkit.launch({ headless: true, ...options });
          break;
        default:
          browser = await chromium.launch({ headless: true, ...options });
      }

      const context = await browser.newContext();
      const page = await context.newPage();
      
      const session: BrowserSession = {
        id: sessionId,
        browser,
        context,
        page,
        createdAt: new Date(),
        actions: [],
        results: []
      };

      this.sessions.set(sessionId, session);
      
      console.log(`✅ Browser session created: ${sessionId}`);
      return session;
      
    } catch (error) {
      console.error(`❌ Failed to create browser session: ${error}`);
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(sessionId: string, url: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`🌐 Navigating to: ${url}`);
      
      await session.page.goto(url, { waitUntil: 'networkidle' });
      
      const result: BrowserResult = {
        success: true,
        data: { url: session.page.url(), title: await session.page.title() },
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'navigate', target: url });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Click an element
   */
  async click(sessionId: string, selector: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`🖱️ Clicking element: ${selector}`);
      
      await session.page.click(selector);
      
      const result: BrowserResult = {
        success: true,
        data: { selector, action: 'click' },
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'click', target: selector });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Type text into an element
   */
  async type(sessionId: string, selector: string, text: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`⌨️ Typing in element: ${selector}`);
      
      await session.page.fill(selector, text);
      
      const result: BrowserResult = {
        success: true,
        data: { selector, text, action: 'type' },
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'type', target: selector, value: text });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(sessionId: string, path?: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`📸 Taking screenshot`);
      
      const screenshotPath = path || `screenshots/session-${sessionId}-${Date.now()}.png`;
      const screenshot = await session.page.screenshot({ path: screenshotPath });
      
      const result: BrowserResult = {
        success: true,
        data: { screenshotPath },
        screenshot: screenshotPath,
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'screenshot' });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Evaluate JavaScript in the page
   */
  async evaluate(sessionId: string, script: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`🔧 Evaluating script: ${script.substring(0, 50)}...`);
      
      const result = await session.page.evaluate(script);
      
      const browserResult: BrowserResult = {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'evaluate', value: script });
      session.results.push(browserResult);
      
      return browserResult;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Wait for an element or timeout
   */
  async wait(sessionId: string, selector?: string, timeout?: number): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      if (selector) {
        console.log(`⏳ Waiting for element: ${selector}`);
        await session.page.waitForSelector(selector, { timeout: timeout || 5000 });
      } else {
        console.log(`⏳ Waiting for timeout: ${timeout || 1000}ms`);
        await session.page.waitForTimeout(timeout || 1000);
      }
      
      const result: BrowserResult = {
        success: true,
        data: { action: 'wait', selector, timeout },
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'wait', target: selector, options: { timeout } });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Scroll the page
   */
  async scroll(sessionId: string, direction: 'up' | 'down' | 'left' | 'right' | 'to-bottom' | 'to-top', amount?: number): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      console.log(`📜 Scrolling ${direction}`);
      
      switch (direction) {
        case 'down':
          await session.page.evaluate(() => window.scrollBy(0, amount || 500));
          break;
        case 'up':
          await session.page.evaluate(() => window.scrollBy(0, -(amount || 500)));
          break;
        case 'left':
          await session.page.evaluate(() => window.scrollBy(-(amount || 500), 0));
          break;
        case 'right':
          await session.page.evaluate(() => window.scrollBy(amount || 500, 0));
          break;
        case 'to-bottom':
          await session.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          break;
        case 'to-top':
          await session.page.evaluate(() => window.scrollTo(0, 0));
          break;
      }
      
      const result: BrowserResult = {
        success: true,
        data: { action: 'scroll', direction, amount },
        duration: Date.now() - startTime
      };

      session.actions.push({ type: 'scroll', value: direction, options: { amount } });
      session.results.push(result);
      
      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      session.results.push(result);
      return result;
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(sessionId: string): Promise<BrowserResult> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const startTime = Date.now();
    
    try {
      const info = await session.page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        elements: {
          links: document.querySelectorAll('a').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          forms: document.querySelectorAll('form').length
        }
      }));
      
      const result: BrowserResult = {
        success: true,
        data: info,
        duration: Date.now() - startTime
      };

      return result;
      
    } catch (error) {
      const result: BrowserResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
      
      return result;
    }
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    try {
      console.log(`🔒 Closing browser session: ${sessionId}`);
      
      await session.context.close();
      await session.browser.close();
      this.sessions.delete(sessionId);
      
      console.log(`✅ Browser session closed: ${sessionId}`);
      
    } catch (error) {
      console.error(`❌ Error closing session: ${error}`);
      throw error;
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      createdAt: session.createdAt,
      actions: session.actions.length,
      results: session.results.length,
      lastAction: session.actions[session.actions.length - 1],
      successRate: session.results.filter(r => r.success).length / session.results.length
    };
  }
}

// Singleton instance
export const playwrightController = new PlaywrightController();
