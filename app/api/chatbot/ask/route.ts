/**
 * Chatbot API Route
 * Handles intelligent conversations with full video context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/auth-utils';
import { geminiClient } from '@/lib/gemini/client';
import { ChatbotVideoContext } from '@/lib/types/enhanced-video-analysis';

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  videoContext?: ChatbotVideoContext;
  currentNote?: string;
  currentFormat?: string;
  conversationHistory?: Array<{
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getApiSession(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request
    const body: ChatRequest = await request.json();
    const { message, videoContext, currentNote, currentFormat, conversationHistory } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build comprehensive context prompt
    const contextPrompt = buildContextPrompt({
      message,
      videoContext,
      currentNote,
      currentFormat,
      conversationHistory
    });

    console.log(`🤖 Processing chatbot question: "${message.slice(0, 50)}..."`);

    // Get response from Gemini using the text-only method
    const result = await geminiClient.generateTextResponse(contextPrompt);
    const aiResponse = result.text;

    // Parse response to extract citations and related concepts
    const parsedResponse = parseAIResponse(aiResponse, videoContext);

    return NextResponse.json({
      success: true,
      response: parsedResponse.cleanedResponse,
      relatedConcepts: parsedResponse.relatedConcepts,
      citations: parsedResponse.citations,
      tokenUsage: result.tokenUsage || 0
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

function buildContextPrompt({
  message,
  videoContext,
  currentNote,
  currentFormat,
  conversationHistory
}: ChatRequest): string {
  // CRITICAL: Handle null/undefined videoContext to prevent hallucination
  if (!videoContext) {
    return buildNoVideoContextPrompt({
      message,
      currentNote,
      currentFormat,
      conversationHistory
    });
  }

  // Build comprehensive prompt when we have actual video data
  let prompt = `You are an intelligent AI assistant helping users understand video content. You have comprehensive access to video analysis data for this specific video.

CURRENT CONTEXT:
VIDEO: "${videoContext.title}"
DURATION: ${Math.floor(videoContext.duration / 60)} minutes
DIFFICULTY: ${videoContext.analysis.difficultyLevel}
PRIMARY SUBJECT: ${videoContext.analysis.primarySubject}
CONTENT TAGS: ${videoContext.analysis.contentTags.join(', ')}

CONCEPTS AVAILABLE (${videoContext.analysis.conceptMap.concepts.length}):
${videoContext.analysis.conceptMap.concepts.slice(0, 10).map(c => 
  `- ${c.name}: ${c.definition} (mentioned at: ${c.timestamps.join(', ')}s)`
).join('\n')}

TRANSCRIPT SEGMENTS AVAILABLE: ${videoContext.analysis.fullTranscript.segments.length} segments
VISUAL CONTENT: ${videoContext.analysis.visualAnalysis.hasSlides ? 'Has slides/diagrams' : 'Primarily spoken content'}

KEY TIMESTAMPS:
${videoContext.analysis.keyTimestamps.slice(0, 5).map(kt => 
  `- ${Math.floor(kt.time / 60)}:${(kt.time % 60).toString().padStart(2, '0')} - ${kt.title}: ${kt.description}`
).join('\n')}

AVAILABLE TEMPLATE OUTPUTS:
${Object.keys(videoContext.analysis.allTemplateOutputs).join(', ')}`;

  if (currentFormat) {
    prompt += `\n\nCURRENT FORMAT: User is viewing "${currentFormat}" format`;
  }

  if (currentNote) {
    prompt += `\n\nCURRENT NOTE CONTENT (first 200 chars):
${currentNote.slice(0, 200)}...`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\n\nRECENT CONVERSATION:
${conversationHistory.map(msg => 
  `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`
).join('\n')}`;
  }

  prompt += `\n\nUSER QUESTION: "${message}"

INSTRUCTIONS:
1. Use the comprehensive video context to provide accurate, specific answers
2. Reference specific timestamps when relevant (format: MM:SS)
3. Mention related concepts when helpful
4. If the question relates to content not in the video, say so clearly
5. Be conversational but informative
6. If you can find specific transcript segments that relate to the question, reference them

RESPONSE FORMAT:
- Answer the question directly and thoroughly
- Include relevant citations in format: [Citation: concept/timestamp/transcript]
- End with [RELATED_CONCEPTS: concept1, concept2, concept3] if applicable

Now provide a helpful response to the user's question.`;

  return prompt;
}

function buildNoVideoContextPrompt({
  message,
  currentNote,
  currentFormat,
  conversationHistory
}: Omit<ChatRequest, 'videoContext'>): string {
  let prompt = `You are an intelligent AI assistant. IMPORTANT: You do NOT have access to any video analysis data, transcript content, or video-specific information for this conversation.

CURRENT CONTEXT:`;

  if (currentFormat) {
    prompt += `
CURRENT FORMAT: User is viewing "${currentFormat}" format`;
  }

  if (currentNote) {
    prompt += `
CURRENT NOTE CONTENT (${Math.round(currentNote.length / 5)} words):
${currentNote}`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `
RECENT CONVERSATION:
${conversationHistory.map(msg => 
  `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`
).join('\n')}`;
  }

  prompt += `

USER QUESTION: "${message}"

CRITICAL INSTRUCTIONS:
1. You do NOT have access to the original video content, transcripts, or timestamps
2. NEVER fabricate or invent timestamps, specific video quotes, or details not in the notes
3. NEVER reference specific moments in videos (like "at 5:30") unless mentioned in the provided notes
4. You CAN and SHOULD help with questions about the note content provided above
5. Focus on analyzing, explaining, and discussing the concepts and information in the notes
6. Be completely honest about your limitations regarding video-specific data

RESPONSE GUIDELINES:
- Actively help with questions about the note content provided
- Analyze and explain concepts, main points, and details from the notes
- Provide summaries, clarifications, and insights based on the notes
- If asked about specific video timestamps or content not in notes, explain you only have the processed notes
- Be helpful and informative while staying within the bounds of the provided note content
- Suggest comprehensive video processing for deeper video analysis if the user needs timestamp-specific information

Now provide an honest, helpful response to the user's question.`;

  return prompt;
}

function parseAIResponse(response: string, videoContext?: ChatbotVideoContext) {
  // Extract related concepts
  const relatedConceptsMatch = response.match(/\[RELATED_CONCEPTS: ([^\]]+)\]/);
  const relatedConcepts = relatedConceptsMatch 
    ? relatedConceptsMatch[1].split(', ').map(c => c.trim()).filter(Boolean)
    : [];

  // Extract citations
  const citationMatches = response.match(/\[Citation: ([^\]]+)\]/g) || [];
  const citations = citationMatches.map(citation => {
    const content = citation.replace(/\[Citation: /, '').replace(/\]/, '');
    
    // Determine citation type
    if (content.includes(':') && /\d+:\d+/.test(content)) {
      return {
        type: 'timestamp' as const,
        value: content,
        description: content
      };
    } else if (videoContext?.analysis.conceptMap.concepts.some(c => 
      content.toLowerCase().includes(c.name.toLowerCase())
    )) {
      return {
        type: 'concept' as const,
        value: content,
        description: content
      };
    } else {
      return {
        type: 'transcript' as const,
        value: content,
        description: content
      };
    }
  });

  // Clean response by removing citation markers and related concepts marker
  let cleanedResponse = response
    .replace(/\[Citation: [^\]]+\]/g, '')
    .replace(/\[RELATED_CONCEPTS: [^\]]+\]/, '')
    .trim();

  return {
    cleanedResponse,
    relatedConcepts,
    citations
  };
}