/**
 * 🔒 SECURITY: Comprehensive Audit Logging System
 * 
 * This service provides centralized security event logging for compliance 
 * and monitoring of critical system activities.
 */

export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'subscription_change'
  | 'usage_limit_exceeded'
  | 'admin_override'
  | 'webhook_received'
  | 'security_violation'
  | 'data_access'
  | 'payment_event'
  | 'user_creation'
  | 'rate_limit_exceeded';

export interface AuditEvent {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  sessionId?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditEvent[] = [];
  private maxLogsInMemory = 1000;

  private constructor() {
    // Initialize audit logger
    this.setupPeriodicCleanup();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log a security-related event
   */
  async logEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to in-memory storage (for immediate access)
    this.logs.push(auditEvent);
    
    // Keep memory usage under control
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Log to console with structured format
    this.logToConsole(auditEvent);

    // In production, you would also:
    // - Send to external logging service (e.g., CloudWatch, Datadog)
    // - Store in dedicated audit database table
    // - Send alerts for critical events
    await this.sendToExternalLogging(auditEvent);
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action: 'login_success' | 'login_failure' | 'logout' | 'session_expired',
    userId?: string,
    userEmail?: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'authentication',
      userId,
      userEmail,
      action,
      details,
      ipAddress,
      severity: action.includes('failure') ? 'medium' : 'low',
      source: 'auth_system'
    });
  }

  /**
   * Log authorization events
   */
  async logAuthorization(
    action: 'access_granted' | 'access_denied' | 'permission_escalation',
    userId: string,
    resource: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'authorization',
      userId,
      action,
      details: { resource, ...details },
      ipAddress,
      severity: action === 'access_denied' ? 'medium' : 'low',
      source: 'authorization_system'
    });
  }

  /**
   * Log subscription changes
   */
  async logSubscriptionChange(
    action: 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'admin_override',
    userId: string,
    fromTier: string,
    toTier: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'subscription_change',
      userId,
      action,
      details: { fromTier, toTier, ...details },
      severity: action === 'admin_override' ? 'high' : 'medium',
      source: 'subscription_system'
    });
  }

  /**
   * Log usage limit violations
   */
  async logUsageLimitExceeded(
    userId: string,
    limitType: string,
    currentUsage: number,
    limit: number,
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'usage_limit_exceeded',
      userId,
      action: 'limit_exceeded',
      details: { limitType, currentUsage, limit, attemptedAction: action, ...details },
      severity: 'medium',
      source: 'usage_tracking_system'
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    action: 'rate_limit_exceeded' | 'invalid_signature' | 'suspicious_activity' | 'unauthorized_access',
    details: Record<string, any>,
    ipAddress?: string,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'security_violation',
      userId,
      action,
      details,
      ipAddress,
      severity: 'high',
      source: 'security_system'
    });
  }

  /**
   * Log webhook events
   */
  async logWebhook(
    action: 'received' | 'verified' | 'processed' | 'failed',
    provider: string,
    eventType: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'webhook_received',
      action,
      details: { provider, webhookEventType: eventType, ...details },
      ipAddress,
      severity: action === 'failed' ? 'medium' : 'low',
      source: 'webhook_system'
    });
  }

  /**
   * Get recent audit logs (for admin dashboard)
   */
  getRecentLogs(limit: number = 100, eventType?: AuditEventType): AuditEvent[] {
    let logs = [...this.logs];
    
    if (eventType) {
      logs = logs.filter(log => log.eventType === eventType);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security alerts (high and critical severity events)
   */
  getSecurityAlerts(hours: number = 24): AuditEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.logs.filter(log => 
      log.timestamp >= cutoff && 
      (log.severity === 'high' || log.severity === 'critical')
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Format log for console output
   */
  private logToConsole(event: AuditEvent): void {
    const severityEmoji = {
      low: '🔵',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    };

    const logPrefix = `${severityEmoji[event.severity]} AUDIT [${event.eventType.toUpperCase()}]`;
    
    // Sanitize sensitive data for console output
    const sanitizedDetails = this.sanitizeForLogging(event.details);
    const userInfo = event.userId ? `User: ${event.userId.substring(0, 8)}***` : 'Anonymous';
    
    console.log(`${logPrefix} ${event.action}`, {
      timestamp: event.timestamp.toISOString(),
      source: event.source,
      user: userInfo,
      ip: event.ipAddress?.replace(/\.\d+$/, '.***') || 'unknown',
      details: sanitizedDetails
    });
  }

  /**
   * Send to external logging service (placeholder)
   */
  private async sendToExternalLogging(event: AuditEvent): Promise<void> {
    // In production, implement integration with:
    // - AWS CloudWatch Logs
    // - Google Cloud Logging  
    // - Datadog
    // - Custom logging endpoint
    
    if (process.env.NODE_ENV === 'production' && process.env.AUDIT_WEBHOOK_URL) {
      try {
        await fetch(process.env.AUDIT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      } catch (error) {
        console.error('Failed to send audit log to external service:', error);
      }
    }
  }

  /**
   * Remove sensitive data from logging output
   */
  private sanitizeForLogging(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'signature', 'email'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Periodic cleanup of in-memory logs
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      this.logs = this.logs.filter(log => log.timestamp >= cutoff);
    }, 60 * 60 * 1000); // Clean every hour
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();