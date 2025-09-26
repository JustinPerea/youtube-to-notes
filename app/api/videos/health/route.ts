import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Health check endpoint for video processing system
export async function GET(request: NextRequest) {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    services: {
      geminiAPI: { status: 'unknown', message: '', responseTime: 0 },
      environment: { status: 'unknown', message: '', config: {} },
      database: { status: 'unknown', message: '' }
    },
    overall: 'unhealthy' as 'healthy' | 'unhealthy' | 'degraded'
  };

  try {
    // Check environment variables
    const envStart = Date.now();
    const requiredEnvVars = [
      'GOOGLE_GEMINI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      healthStatus.services.environment = {
        status: 'unhealthy',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        config: { missingVars: missingEnvVars }
      };
    } else {
      healthStatus.services.environment = {
        status: 'healthy',
        message: 'All required environment variables are present',
        config: {
          hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
          hasSupabaseConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      };
    }

    // Test Gemini API connectivity
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      const geminiStart = Date.now();
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          }
        });

        const result = await model.generateContent('Health check test - respond with "OK"');
        const response = await result.response.text();
        const responseTime = Date.now() - geminiStart;

        if (response && response.trim().length > 0) {
          healthStatus.services.geminiAPI = {
            status: 'healthy',
            message: 'Gemini API is responding correctly',
            responseTime
          };
        } else {
          healthStatus.services.geminiAPI = {
            status: 'degraded',
            message: 'Gemini API responded but with empty content',
            responseTime
          };
        }
      } catch (geminiError: any) {
        const responseTime = Date.now() - geminiStart;
        healthStatus.services.geminiAPI = {
          status: 'unhealthy',
          message: `Gemini API error: ${geminiError.message}`,
          responseTime
        };
      }
    }

    // Determine overall health
    const serviceStatuses = Object.values(healthStatus.services).map(service => service.status);
    
    if (serviceStatuses.every(status => status === 'healthy')) {
      healthStatus.overall = 'healthy';
    } else if (serviceStatuses.some(status => status === 'healthy')) {
      healthStatus.overall = 'degraded';
    } else {
      healthStatus.overall = 'unhealthy';
    }

    // Return appropriate HTTP status
    const httpStatus = healthStatus.overall === 'healthy' ? 200 : 
                      healthStatus.overall === 'degraded' ? 207 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });

  } catch (error: any) {
    return NextResponse.json({
      ...healthStatus,
      overall: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// Configuration check endpoint
export async function POST(request: NextRequest) {
  try {
    const { testVideoUrl, testTemplate } = await request.json();
    
    if (!testVideoUrl) {
      return NextResponse.json({ 
        error: 'testVideoUrl is required for configuration test' 
      }, { status: 400 });
    }

    // Test video processing configuration
    const configTest = {
      timestamp: new Date().toISOString(),
      testUrl: testVideoUrl,
      template: testTemplate || 'basic-summary',
      results: {
        urlValidation: false,
        geminiConnection: false,
        processingCapability: false
      },
      recommendations: [] as string[],
      estimatedProcessingTime: 0
    };

    // Test URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    configTest.results.urlValidation = youtubeRegex.test(testVideoUrl);
    
    if (!configTest.results.urlValidation) {
      configTest.recommendations.push('Invalid YouTube URL format provided');
    }

    // Test Gemini connection with actual video
    if (process.env.GOOGLE_GEMINI_API_KEY && configTest.results.urlValidation) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const modelCandidates = ['gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'];
        let lastError: any = null;

        for (const modelName of modelCandidates) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500,
              }
            });

            const testStart = Date.now();
            const result = await model.generateContent([
              'Briefly describe what you can see in the first few seconds of this video.',
              {
                fileData: {
                  mimeType: 'video/*',
                  fileUri: testVideoUrl
                }
              }
            ]);

            await result.response.text();
            configTest.estimatedProcessingTime = Date.now() - testStart;
            configTest.results.geminiConnection = true;
            configTest.results.processingCapability = true;

            // Estimate full processing time based on test
            const estimatedFullTime = configTest.estimatedProcessingTime * 10; // Rough estimate
            if (estimatedFullTime > 240000) { // 4 minutes
              configTest.recommendations.push('Video may require async processing due to length');
            }

            lastError = null;
            break;
          } catch (modelError: any) {
            lastError = modelError;
            if (modelName === modelCandidates[modelCandidates.length - 1]) {
              throw modelError;
            }
            // Try next candidate in list
          }
        }

        if (lastError) {
          throw lastError;
        }
      } catch (geminiError: any) {
        configTest.recommendations.push(`Gemini processing test failed: ${geminiError.message}`);
        
        if (geminiError.message.includes('quota')) {
          configTest.recommendations.push('API quota may be exceeded');
        }
        if (geminiError.message.includes('invalid')) {
          configTest.recommendations.push('Video URL may not be accessible or valid');
        }
      }
    }

    return NextResponse.json(configTest);

  } catch (error: any) {
    return NextResponse.json({
      error: 'Configuration test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
