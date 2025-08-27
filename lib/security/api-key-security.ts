/**
 * API Key Security Management for YouTube-to-Notes
 * Implements secure API key handling, rotation, and monitoring
 */

import crypto from 'crypto';

// Types for API key management
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  encryptedKey: string;
  permissions: string[];
  createdAt: Date;
  lastUsed: Date;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
  lastRotated: Date;
}

export interface ApiKeyUsage {
  keyId: string;
  timestamp: Date;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorCode?: string;
  responseTime: number;
}

export interface ApiKeyRotation {
  oldKeyId: string;
  newKeyId: string;
  rotatedAt: Date;
  rotatedBy: string;
  reason: string;
}

/**
 * API Key Security Manager
 * Handles secure storage, rotation, and monitoring of API keys
 */
export class ApiKeySecurityManager {
  private encryptionKey: string;
  private keys: Map<string, ApiKey> = new Map();
  private usageLog: ApiKeyUsage[] = [];
  private rotationLog: ApiKeyRotation[] = [];

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Generate a new secure API key
   */
  public generateApiKey(name: string, permissions: string[] = ['read']): ApiKey {
    const id = crypto.randomUUID();
    const key = this.generateSecureKey();
    const encryptedKey = this.encryptKey(key);
    
    const apiKey: ApiKey = {
      id,
      name,
      key,
      encryptedKey,
      permissions,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true,
      usageCount: 0,
      lastRotated: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    this.keys.set(id, apiKey);
    return apiKey;
  }

  /**
   * Encrypt an API key for secure storage
   */
  private encryptKey(key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt an API key for use
   */
  private decryptKey(encryptedKey: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedKey.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a cryptographically secure API key
   */
  private generateSecureKey(): string {
    const bytes = crypto.randomBytes(32);
    return bytes.toString('base64url');
  }

  /**
   * Validate and use an API key
   */
  public validateAndUseApiKey(keyId: string, endpoint: string, ipAddress: string, userAgent: string): {
    isValid: boolean;
    permissions: string[];
    error?: string;
  } {
    const apiKey = this.keys.get(keyId);
    
    if (!apiKey) {
      this.logUsage(keyId, endpoint, ipAddress, userAgent, false, 'INVALID_KEY');
      return { isValid: false, permissions: [], error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      this.logUsage(keyId, endpoint, ipAddress, userAgent, false, 'INACTIVE_KEY');
      return { isValid: false, permissions: [], error: 'API key is inactive' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      this.logUsage(keyId, endpoint, ipAddress, userAgent, false, 'EXPIRED_KEY');
      return { isValid: false, permissions: [], error: 'API key has expired' };
    }

    // Check rate limits
    if (this.isRateLimited(keyId)) {
      this.logUsage(keyId, endpoint, ipAddress, userAgent, false, 'RATE_LIMITED');
      return { isValid: false, permissions: [], error: 'Rate limit exceeded' };
    }

    // Update usage
    apiKey.lastUsed = new Date();
    apiKey.usageCount++;
    this.keys.set(keyId, apiKey);

    this.logUsage(keyId, endpoint, ipAddress, userAgent, true);
    
    return { isValid: true, permissions: apiKey.permissions };
  }

  /**
   * Check if an API key is rate limited
   */
  private isRateLimited(keyId: string): boolean {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const recentUsage = this.usageLog.filter(usage => 
      usage.keyId === keyId && 
      usage.timestamp > oneMinuteAgo
    );

    // Allow 60 requests per minute per key
    return recentUsage.length >= 60;
  }

  /**
   * Log API key usage for monitoring and rate limiting
   */
  private logUsage(
    keyId: string, 
    endpoint: string, 
    ipAddress: string, 
    userAgent: string, 
    success: boolean, 
    errorCode?: string
  ) {
    const usage: ApiKeyUsage = {
      keyId,
      timestamp: new Date(),
      endpoint,
      ipAddress,
      userAgent,
      success,
      errorCode,
      responseTime: 0 // Would be calculated in actual implementation
    };

    this.usageLog.push(usage);
    
    // Keep only last 1000 usage records
    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-1000);
    }
  }

  /**
   * Rotate an API key (generate new key and invalidate old one)
   */
  public rotateApiKey(keyId: string, rotatedBy: string, reason: string = 'Scheduled rotation'): ApiKeyRotation {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error('API key not found');
    }

    // Generate new key
    const newKey = this.generateApiKey(`${oldKey.name} (rotated)`, oldKey.permissions);
    
    // Deactivate old key
    oldKey.isActive = false;
    oldKey.lastRotated = new Date();
    this.keys.set(keyId, oldKey);

    // Log rotation
    const rotation: ApiKeyRotation = {
      oldKeyId: keyId,
      newKeyId: newKey.id,
      rotatedAt: new Date(),
      rotatedBy,
      reason
    };

    this.rotationLog.push(rotation);
    
    return rotation;
  }

  /**
   * Get API key usage statistics
   */
  public getUsageStats(keyId: string, timeframe: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeframe) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const usage = this.usageLog.filter(u => 
      u.keyId === keyId && u.timestamp > cutoffTime
    );

    return {
      totalRequests: usage.length,
      successfulRequests: usage.filter(u => u.success).length,
      failedRequests: usage.filter(u => !u.success).length,
      uniqueIPs: new Set(usage.map(u => u.ipAddress)).size,
      averageResponseTime: usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length || 0,
      errorBreakdown: usage
        .filter(u => !u.success)
        .reduce((acc, u) => {
          acc[u.errorCode || 'UNKNOWN'] = (acc[u.errorCode || 'UNKNOWN'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };
  }

  /**
   * Detect suspicious API key usage patterns
   */
  public detectAnomalies(keyId: string): string[] {
    const anomalies: string[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentUsage = this.usageLog.filter(u => 
      u.keyId === keyId && u.timestamp > oneHourAgo
    );

    // Check for unusual request volume
    if (recentUsage.length > 100) {
      anomalies.push('High request volume detected');
    }

    // Check for multiple IP addresses (potential key sharing)
    const uniqueIPs = new Set(recentUsage.map(u => u.ipAddress));
    if (uniqueIPs.size > 5) {
      anomalies.push('Multiple IP addresses detected - potential key sharing');
    }

    // Check for unusual error rate
    const errorRate = recentUsage.filter(u => !u.success).length / recentUsage.length;
    if (errorRate > 0.5) {
      anomalies.push('High error rate detected');
    }

    // Check for unusual user agents (potential automation)
    const suspiciousUserAgents = recentUsage.filter(u => 
      u.userAgent.toLowerCase().includes('bot') ||
      u.userAgent.toLowerCase().includes('crawler') ||
      u.userAgent.toLowerCase().includes('python') ||
      u.userAgent.toLowerCase().includes('curl')
    );

    if (suspiciousUserAgents.length > 0) {
      anomalies.push('Suspicious user agents detected');
    }

    return anomalies;
  }

  /**
   * Get all active API keys
   */
  public getActiveKeys(): ApiKey[] {
    return Array.from(this.keys.values()).filter(key => key.isActive);
  }

  /**
   * Revoke an API key
   */
  public revokeApiKey(keyId: string, reason: string = 'Manual revocation'): boolean {
    const key = this.keys.get(keyId);
    if (!key) {
      return false;
    }

    key.isActive = false;
    key.lastRotated = new Date();
    this.keys.set(keyId, key);

    // Log revocation
    this.rotationLog.push({
      oldKeyId: keyId,
      newKeyId: '',
      rotatedAt: new Date(),
      rotatedBy: 'system',
      reason
    });

    return true;
  }

  /**
   * Export encrypted API keys for backup (encrypted format)
   */
  public exportKeys(): string {
    const keyData = Array.from(this.keys.values()).map(key => ({
      id: key.id,
      name: key.name,
      encryptedKey: key.encryptedKey,
      permissions: key.permissions,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      usageCount: key.usageCount,
      lastRotated: key.lastRotated
    }));

    return JSON.stringify(keyData);
  }

  /**
   * Import encrypted API keys from backup
   */
  public importKeys(encryptedData: string): void {
    const keyData = JSON.parse(encryptedData);
    
    for (const data of keyData) {
      const key: ApiKey = {
        id: data.id,
        name: data.name,
        key: '', // Original key is not stored, only encrypted version
        encryptedKey: data.encryptedKey,
        permissions: data.permissions,
        createdAt: new Date(data.createdAt),
        lastUsed: new Date(data.lastUsed),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isActive: data.isActive,
        usageCount: data.usageCount,
        lastRotated: new Date(data.lastRotated)
      };

      this.keys.set(key.id, key);
    }
  }
}

/**
 * Environment-based API Key Manager
 * Secure wrapper for environment-based API key access
 */
export class EnvironmentApiKeyManager {
  private securityManager: ApiKeySecurityManager;

  constructor() {
    // In production, this would be stored in a secure key management service
    const encryptionKey = process.env.API_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.securityManager = new ApiKeySecurityManager(encryptionKey);
  }

  /**
   * Get API key with security validation
   */
  public getApiKey(service: string): string | null {
    const envKey = `${service.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envKey];
    
    if (!apiKey) {
      console.warn(`API key not found for service: ${service}`);
      return null;
    }

    // Log API key usage for security monitoring
    this.securityManager.validateAndUseApiKey(
      'env-key',
      'environment-access',
      '127.0.0.1', // Would be actual IP in production
      'system'
    );

    return apiKey;
  }

  /**
   * Validate API key format and security
   */
  public validateApiKey(service: string, key: string): boolean {
    if (!key || key.length < 20) {
      return false;
    }

    // Check for common patterns that indicate invalid keys
    const invalidPatterns = [
      /^sk-/, // Stripe keys should not be used here
      /^pk_/, // Stripe public keys
      /^AIza/, // Google keys should be longer
      /^ghp_/, // GitHub personal access tokens
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(key)) {
        console.warn(`Potentially invalid API key format for service: ${service}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Rotate environment API key (generate new one and update environment)
   */
  public async rotateEnvironmentKey(service: string): Promise<string> {
    const newKey = this.securityManager.generateApiKey(`${service}-env-key`);
    
    // In production, this would update the environment securely
    console.log(`New API key generated for ${service}. Please update your environment variables.`);
    console.log(`Key ID: ${newKey.id}`);
    
    return newKey.key;
  }

  /**
   * Get security recommendations for API keys
   */
  public getSecurityRecommendations(): string[] {
    const recommendations = [
      'Store API keys in environment variables, not in code',
      'Use a secure key management service in production',
      'Rotate API keys regularly (every 90 days)',
      'Monitor API key usage for anomalies',
      'Use different API keys for different environments',
      'Implement rate limiting for API key usage',
      'Log all API key access for security monitoring'
    ];

    return recommendations;
  }
}

/**
 * Utility function to mask API keys in logs
 */
export function maskApiKey(key: string, visibleChars: number = 4): string {
  if (!key || key.length < 8) {
    return '***';
  }
  
  return `${key.substring(0, visibleChars)}${'*'.repeat(key.length - visibleChars)}`;
}

/**
 * Validate API key security in the current environment
 */
export function validateEnvironmentSecurity(): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 10;

  // Check if API keys are in environment variables (handle both new and old variable names)
  const requiredKeys = ['GOOGLE_GEMINI_API_KEY'];
  const optionalKeys = ['API_ENCRYPTION_KEY'];
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      issues.push(`Required API key ${key} not found in environment`);
      score -= 3;
    } else {
      // Check if key is properly formatted
      const apiKey = process.env[key]!;
      if (apiKey.length < 20) {
        issues.push(`API key ${key} appears to be too short`);
        score -= 1;
      }
    }
  }

  // Check for hardcoded keys in environment
  const hardcodedPatterns = ['test', 'demo', 'example', 'placeholder'];
  for (const pattern of hardcodedPatterns) {
    for (const key of requiredKeys) {
      const value = process.env[key];
      if (value && value.toLowerCase().includes(pattern)) {
        issues.push(`API key ${key} contains suspicious pattern: ${pattern}`);
        score -= 2;
      }
    }
  }

  // Check for encryption key (optional but recommended)
  if (!process.env.API_ENCRYPTION_KEY) {
    issues.push('API_ENCRYPTION_KEY not found - API keys may not be encrypted (optional but recommended)');
    score -= 1;
    recommendations.push('Set API_ENCRYPTION_KEY environment variable for enhanced API key encryption');
  } else {
    console.log('✅ API_ENCRYPTION_KEY found - Enhanced encryption enabled');
  }

  // Generate recommendations based on score
  if (score < 8) {
    recommendations.push('Implement API key rotation schedule');
    recommendations.push('Add API key usage monitoring');
    recommendations.push('Use secure key management service');
  }

  if (score < 6) {
    recommendations.push('Immediate: Move API keys to secure environment management');
    recommendations.push('Immediate: Implement API key encryption');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}
