/**
 * Security validation utilities for YouTube-to-Notes application
 * Implements strict input validation and XSS prevention
 */

/**
 * Strict YouTube URL validation with security checks
 * @param url - The YouTube URL to validate
 * @returns true if URL is valid and safe, false otherwise
 */
export const validateYouTubeUrl = (url: string): boolean => {
  // Input type check
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  // Length limit to prevent buffer overflow attacks
  if (url.length > 100) {
    return false;
  }

  // Prevent protocol injection attacks
  if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
    return false;
  }

  // Strict YouTube URL regex pattern
  // Only allows youtube.com/watch?v= or youtu.be/ with specific video ID format
  const strictYouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;

  if (!strictYouTubeRegex.test(url)) {
    return false;
  }

  // Extract video ID and validate it
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!videoIdMatch) {
    return false;
  }

  const videoId = videoIdMatch[1];
  
  // YouTube video IDs are exactly 11 characters
  if (videoId.length !== 11) {
    return false;
  }

  // Check for potentially malicious characters in the video ID
  const suspiciousPatterns = [
    /[<>"]/, // HTML tags
    /\x00/, // Null bytes
    /%00/, // URL encoded null bytes
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(videoId)) {
      return false;
    }
  }

  return true;
};

/**
 * Input sanitization to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized input string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML tags and scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    
    // Remove potentially dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '')
    
    // Remove HTML entities that could be dangerous
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Validate and sanitize template selection
 * @param template - The template string to validate
 * @returns true if template is valid, false otherwise
 */
export const validateTemplate = (template: string): boolean => {
  const validTemplates = ['summary', 'studyNotes', 'presentation', 'tutorial', 'quickReference', 'research'];
  return validTemplates.includes(template);
};

/**
 * Validate API request structure
 * @param request - The request object to validate
 * @returns Validation result with error message if invalid
 */
export const validateApiRequest = (request: any): { valid: boolean; error?: string } => {
  // Check if request is an object
  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Invalid request format' };
  }

  // Check required fields
  if (!request.videoUrl || typeof request.videoUrl !== 'string') {
    return { valid: false, error: 'Video URL is required and must be a string' };
  }

  if (!request.template || typeof request.template !== 'string') {
    return { valid: false, error: 'Template is required and must be a string' };
  }

  // Validate video URL
  if (!validateYouTubeUrl(request.videoUrl)) {
    return { valid: false, error: 'Invalid YouTube URL format' };
  }

  // Validate template
  if (!validateTemplate(request.template)) {
    return { valid: false, error: 'Invalid template type' };
  }

  return { valid: true };
};

/**
 * Rate limiting validation helper
 * @param ip - IP address
 * @param userAgent - User agent string
 * @returns true if request should be blocked
 */
export const shouldBlockRequest = (ip: string, userAgent: string): boolean => {
  // Block requests with suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
  ];

  // Block common attack user agents
  const maliciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /dirbuster/i,
    /gobuster/i,
    /wfuzz/i,
    /burpsuite/i,
  ];

  const userAgentLower = userAgent.toLowerCase();

  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgentLower)) {
      return true;
    }
  }

  // Check for malicious user agents
  for (const pattern of maliciousUserAgents) {
    if (pattern.test(userAgentLower)) {
      return true;
    }
  }

  // Block empty or very short user agents
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  return false;
};

/**
 * Log security events for monitoring
 * @param event - Security event details
 */
export const logSecurityEvent = (event: {
  type: 'INVALID_URL' | 'SUSPICIOUS_REQUEST' | 'RATE_LIMIT_EXCEEDED' | 'XSS_ATTEMPT';
  ip: string;
  userAgent: string;
  details?: any;
}) => {
  // In production, this would send to a security monitoring service
  console.warn('Security Event:', {
    timestamp: new Date().toISOString(),
    ...event,
  });
};

/**
 * Generate secure random string for tokens
 * @param length - Length of the random string
 * @returns Secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.randomBytes for better randomness
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
};
