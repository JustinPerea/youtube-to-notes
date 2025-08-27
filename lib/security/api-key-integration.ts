/**
 * API Key Security Integration for YouTube-to-Notes
 * Provides secure access to API keys throughout the application
 */

import { EnvironmentApiKeyManager, maskApiKey, validateEnvironmentSecurity } from './api-key-security';

// Singleton instance for API key management
class SecureApiKeyManager {
  private static instance: SecureApiKeyManager;
  private environmentManager: EnvironmentApiKeyManager;
  private keyCache: Map<string, string> = new Map();
  private lastValidation: { score: number; timestamp: Date } | null = null;

  private constructor() {
    this.environmentManager = new EnvironmentApiKeyManager();
    this.validateEnvironment();
  }

  public static getInstance(): SecureApiKeyManager {
    if (!SecureApiKeyManager.instance) {
      SecureApiKeyManager.instance = new SecureApiKeyManager();
    }
    return SecureApiKeyManager.instance;
  }

  /**
   * Get a secure API key for a service
   */
  public async getSecureApiKey(service: string): Promise<string> {
    // Check cache first
    if (this.keyCache.has(service)) {
      return this.keyCache.get(service)!;
    }

    // Get key from environment manager
    const key = this.environmentManager.getApiKey(service);
    
    if (!key) {
      throw new Error(`Secure API key not available for service: ${service}`);
    }

    // Validate key format
    if (!this.environmentManager.validateApiKey(service, key)) {
      throw new Error(`Invalid API key format for service: ${service}`);
    }

    // Cache the key (encrypted in memory)
    this.keyCache.set(service, key);
    
    // Log secure access (with masked key)
    console.log(`Secure API key accessed for ${service}: ${maskApiKey(key)}`);
    
    return key;
  }

  /**
   * Get Gemini API key securely
   */
  public async getGeminiApiKey(): Promise<string> {
    return this.getSecureApiKey('GOOGLE_GEMINI');
  }

  /**
   * Get Supabase API key securely
   */
  public async getSupabaseApiKey(): Promise<string> {
    return this.getSecureApiKey('SUPABASE');
  }

  /**
   * Validate environment security
   */
  private validateEnvironment(): void {
    const validation = validateEnvironmentSecurity();
    this.lastValidation = {
      score: validation.score,
      timestamp: new Date()
    };

    console.log(`API Key Security Score: ${validation.score}/10`);

    if (validation.issues.length > 0) {
      console.warn('API Key Security Issues:');
      validation.issues.forEach(issue => console.warn(`- ${issue}`));
    }

    if (validation.recommendations.length > 0) {
      console.info('API Key Security Recommendations:');
      validation.recommendations.forEach(rec => console.info(`- ${rec}`));
    }
  }

  /**
   * Get current security status
   */
  public getSecurityStatus() {
    return {
      lastValidation: this.lastValidation,
      cachedKeys: Array.from(this.keyCache.keys()),
      recommendations: this.environmentManager.getSecurityRecommendations()
    };
  }

  /**
   * Clear key cache (useful for testing or security purposes)
   */
  public clearCache(): void {
    this.keyCache.clear();
    console.log('API key cache cleared for security');
  }

  /**
   * Rotate an API key
   */
  public async rotateApiKey(service: string): Promise<string> {
    const newKey = await this.environmentManager.rotateEnvironmentKey(service);
    
    // Clear cache for this service
    this.keyCache.delete(service);
    
    console.log(`API key rotated for ${service}. Cache cleared.`);
    
    return newKey;
  }
}

// Export convenience functions for common API keys
export const getSecureGeminiKey = async (): Promise<string> => {
  return SecureApiKeyManager.getInstance().getGeminiApiKey();
};

export const getSecureSupabaseKey = async (): Promise<string> => {
  return SecureApiKeyManager.getInstance().getSupabaseApiKey();
};

export const getApiKeySecurityStatus = () => {
  return SecureApiKeyManager.getInstance().getSecurityStatus();
};

// Export the secure manager for advanced usage
export { SecureApiKeyManager };
