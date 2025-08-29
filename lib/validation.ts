import { z } from 'zod';

// Video URL validation schema
export const videoUrlSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .url('Invalid URL format')
    .refine(
      (url) => {
        const youtubePatterns = [
          /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
          /^https?:\/\/(www\.)?youtube\.com\/embed\//,
          /^https?:\/\/(www\.)?youtu\.be\//,
          /^https?:\/\/youtube\.com\/shorts\//
        ];
        return youtubePatterns.some(pattern => pattern.test(url));
      },
      { message: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' }
    )
});

// Note content validation schema
export const noteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(str => str.trim()),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10,000 characters')
    .transform(str => str.trim()),
  videoId: z.string().optional(),
  templateId: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional().default([])
});

// Verbosity adjustment schema
export const verbositySchema = z.object({
  verbosity: z.enum(['brief', 'standard', 'detailed']),
  content: z.string().min(1, 'Content is required')
});

// Template selection schema
export const templateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required')
});

// Search query validation
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .transform(str => str.trim())
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => {
    const num = parseInt(val || '1', 10);
    return Math.max(1, Math.min(num, 100)); // Limit to 1-100
  }).default('1'),
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || '20', 10);
    return Math.max(1, Math.min(num, 100)); // Limit to 1-100
  }).default('20')
});

// Input sanitization function
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove iframe tags and their content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    
    // Remove data: URLs that might contain scripts
    .replace(/data:text\/html/gi, '')
    
    // Remove SQL injection patterns
    .replace(/union\s+select/gi, '')
    .replace(/drop\s+table/gi, '')
    .replace(/delete\s+from/gi, '')
    .replace(/insert\s+into/gi, '')
    
    // Trim whitespace
    .trim();
}

// Validate and sanitize note content
export function validateNoteContent(content: string): { isValid: boolean; sanitizedContent?: string; error?: string } {
  try {
    const sanitized = sanitizeInput(content);
    
    if (sanitized.length === 0) {
      return { isValid: false, error: 'Content cannot be empty after sanitization' };
    }
    
    if (sanitized.length > 10000) {
      return { isValid: false, error: 'Content is too long (max 10,000 characters)' };
    }
    
    return { isValid: true, sanitizedContent: sanitized };
  } catch (error) {
    return { isValid: false, error: 'Failed to validate content' };
  }
}

// Validate video URL
export function validateVideoUrl(url: string): { isValid: boolean; error?: string } {
  try {
    videoUrlSchema.parse({ url: url.trim() });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid video URL' };
  }
}

// Validate note data
export function validateNoteData(data: any): { isValid: boolean; sanitizedData?: any; error?: string } {
  try {
    const sanitizedData = {
      ...data,
      title: sanitizeInput(data.title || ''),
      content: sanitizeInput(data.content || ''),
      tags: (data.tags || []).map((tag: string) => sanitizeInput(tag))
    };
    
    noteSchema.parse(sanitizedData);
    return { isValid: true, sanitizedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid note data' };
  }
}

// Validate search query
export function validateSearchQuery(query: string): { isValid: boolean; sanitizedQuery?: string; error?: string } {
  try {
    const sanitized = sanitizeInput(query);
    
    if (sanitized.length === 0) {
      return { isValid: false, error: 'Search query cannot be empty' };
    }
    
    if (sanitized.length > 100) {
      return { isValid: false, error: 'Search query is too long' };
    }
    
    return { isValid: true, sanitizedQuery: sanitized };
  } catch (error) {
    return { isValid: false, error: 'Invalid search query' };
  }
}

// Utility function to validate any schema
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: any): { isValid: boolean; data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}
