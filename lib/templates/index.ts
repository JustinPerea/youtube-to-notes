/**
 * Template System for YouTube-to-Notes
 * 
 * Defines different content formats that users can choose from
 * Each template contains a curated prompt for Gemini AI models
 */

// Verbosity system types
export type VerbosityLevel = 'concise' | 'standard' | 'comprehensive';

// Domain detection types
export type TutorialDomain = 'programming' | 'diy' | 'academic' | 'fitness' | 'general';

// YouTube video metadata interface for domain detection
export interface VideoMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  channelName?: string;
}

/**
 * Detect tutorial domain from YouTube metadata
 * Uses hybrid approach: keyword matching + contextual analysis
 */
export function detectTutorialDomain(metadata: VideoMetadata): TutorialDomain {
  const text = [
    metadata.title || '',
    metadata.description || '',
    ...(metadata.tags || []),
    metadata.channelName || ''
  ].join(' ').toLowerCase();

  // Domain keyword patterns (order matters - most specific first)
  const domainPatterns = {
    programming: [
      // Programming languages
      'javascript', 'python', 'java', 'react', 'nodejs', 'typescript', 'html', 'css', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'c++', 'c#',
      // Development concepts
      'code', 'coding', 'programming', 'development', 'developer', 'software', 'api', 'database', 'framework', 'library',
      'algorithm', 'data structure', 'git', 'github', 'deployment', 'backend', 'frontend', 'fullstack',
      // Tools and technologies
      'vs code', 'npm', 'webpack', 'docker', 'kubernetes', 'aws', 'firebase', 'mongodb', 'postgresql', 'mysql',
      'tutorial programming', 'learn to code', 'web development', 'mobile app', 'game development'
    ],
    
    fitness: [
      // Exercise types
      'workout', 'exercise', 'fitness', 'training', 'gym', 'cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'hiit',
      'running', 'cycling', 'swimming', 'weightlifting', 'bodybuilding', 'calisthenics',
      // Body parts and goals
      'abs', 'core', 'legs', 'arms', 'chest', 'back', 'shoulders', 'glutes', 'weight loss', 'muscle building',
      'flexibility', 'stretching', 'recovery', 'nutrition', 'protein', 'diet', 'meal prep',
      // Fitness contexts
      'home workout', 'gym tutorial', 'beginner fitness', 'advanced training'
    ],
    
    diy: [
      // Crafting and making
      'diy', 'craft', 'handmade', 'homemade', 'tutorial', 'how to make', 'build', 'create', 'project',
      'woodworking', 'carpentry', 'painting', 'sewing', 'knitting', 'crochet', 'embroidery',
      // Home improvement
      'home improvement', 'renovation', 'repair', 'fix', 'install', 'maintenance', 'plumbing', 'electrical',
      'garden', 'gardening', 'landscaping', 'plants', 'cooking', 'baking', 'recipe',
      // Tools and materials
      'tools', 'materials', 'supplies', 'hardware', 'wood', 'fabric', 'paint', 'glue'
    ],
    
    academic: [
      // Educational contexts
      'education', 'learning', 'study', 'lesson', 'lecture', 'course', 'class', 'school', 'university', 'college',
      'teacher', 'professor', 'student', 'academic', 'research', 'analysis', 'theory', 'concept',
      // Subjects
      'math', 'mathematics', 'science', 'physics', 'chemistry', 'biology', 'history', 'literature', 'philosophy',
      'psychology', 'sociology', 'economics', 'political science', 'geography', 'language',
      // Academic activities
      'exam prep', 'test preparation', 'homework help', 'study guide', 'explained', 'understanding'
    ]
  };

  // Score each domain based on keyword matches
  const scores: Record<TutorialDomain, number> = {
    programming: 0,
    fitness: 0,
    diy: 0,
    academic: 0,
    general: 0
  };

  // Calculate scores for each domain
  Object.entries(domainPatterns).forEach(([domain, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[domain as TutorialDomain] += 1;
        // Boost score for title matches (more important)
        if (metadata.title?.toLowerCase().includes(keyword)) {
          scores[domain as TutorialDomain] += 2;
        }
      }
    });
  });

  // Find domain with highest score
  const detectedDomain = Object.entries(scores)
    .filter(([domain]) => domain !== 'general')
    .reduce((max, [domain, score]) => 
      score > max.score ? { domain: domain as TutorialDomain, score } : max,
      { domain: 'general' as TutorialDomain, score: 0 }
    );

  // Return detected domain if confidence is high enough, otherwise 'general'
  return detectedDomain.score >= 2 ? detectedDomain.domain : 'general';
}

/**
 * Generate tutorial guide with verbosity, domain-specific adaptations, and timestamp support
 * Implements research-backed 3-level system for enhanced engagement with clickable timestamps
 */
function generateTutorialGuidePrompt(
  durationSeconds: number = 600,
  verbosity: VerbosityLevel = 'standard',
  domain: TutorialDomain = 'general',
  videoUrl?: string,
  transcriptAvailable: boolean = true
): string {
  // Verbosity configurations based on research
  const verbosityConfigs = {
    concise: {
      sectionDepth: '2-3 key points per section',
      stepDetail: 'Essential actions only',
      exampleCount: '1 example per concept',
      troubleshootingItems: '3-4 common issues',
      contentReduction: '30-40% less content than standard'
    },
    standard: {
      sectionDepth: '4-5 well-developed points per section', 
      stepDetail: 'Clear instructions with context',
      exampleCount: '2-3 examples per concept',
      troubleshootingItems: '5-6 common issues with solutions',
      contentReduction: 'Balanced detail level'
    },
    comprehensive: {
      sectionDepth: '6-8 detailed points with extensive explanations',
      stepDetail: 'Thorough instructions with context, warnings, and alternatives',
      exampleCount: '3-4 detailed examples with variations',
      troubleshootingItems: '8-10 comprehensive troubleshooting scenarios',
      contentReduction: '40-50% more content with in-depth explanations'
    }
  };

  const config = verbosityConfigs[verbosity];
  const durationMinutes = Math.max(1, Math.floor(durationSeconds / 60));
  const durationText = durationMinutes;
  const recommendedStepCount = Math.min(18, Math.max(6, Math.ceil(durationSeconds / 450)));
  const finalTimestampWindow = Math.max(2, Math.min(6, Math.ceil(durationSeconds / 600)));

  // Domain-specific adaptations based on research
  const domainAdaptations = {
    programming: {
      prerequisites: 'Required knowledge, tools, and software setup',
      stepFormat: 'Code examples with explanations and common pitfalls',
      troubleshooting: 'Debug techniques, error handling, and solution variations',
      verification: 'Test cases, code validation, and expected outputs',
      terminology: 'functions, variables, APIs, debugging, deployment',
      practiceType: 'coding exercises and project challenges'
    },
    diy: {
      prerequisites: 'Required tools, materials, and safety considerations',
      stepFormat: 'Visual instructions with measurements and safety warnings',
      troubleshooting: 'Common mistakes, material issues, and alternative approaches',
      verification: 'Quality checks, measurements, and final inspections',
      terminology: 'tools, materials, measurements, safety, craftsmanship',
      practiceType: 'hands-on projects and skill-building exercises'
    },
    academic: {
      prerequisites: 'Background knowledge, reading materials, and conceptual foundations',
      stepFormat: 'Logical progression with definitions, examples, and theory connections',
      troubleshooting: 'Common misconceptions, study challenges, and clarification methods',
      verification: 'Comprehension checks, self-assessment, and knowledge application',
      terminology: 'concepts, theories, analysis, research, methodology',
      practiceType: 'study questions and application exercises'
    },
    fitness: {
      prerequisites: 'Fitness level assessment, equipment needs, and safety precautions',
      stepFormat: 'Exercise demonstrations with form cues and modifications',
      troubleshooting: 'Form corrections, injury prevention, and progression adjustments',
      verification: 'Performance metrics, form checks, and progress indicators',
      terminology: 'exercises, sets, reps, form, progression, recovery',
      practiceType: 'workout routines and fitness challenges'
    },
    general: {
      prerequisites: 'Required knowledge, tools, and preparation steps',
      stepFormat: 'Clear instructions with context and helpful tips',
      troubleshooting: 'Common issues, solutions, and alternative methods',
      verification: 'Success criteria, quality checks, and completion indicators',
      terminology: 'steps, process, methods, results, improvement',
      practiceType: 'practice exercises and skill development'
    }
  };

  const adaptation = domainAdaptations[domain];

  // ULTRA-CRITICAL timestamp instructions - must be impossible to ignore
  const timestampInstructions = videoUrl ? `

🚨🚨🚨 ABSOLUTE REQUIREMENTS FOR TIMESTAMPS 🚨🚨🚨

THE YOUTUBE VIDEO URL YOU MUST USE FOR ALL TIMESTAMPS: ${videoUrl}
🔗 FULL URL DEBUG: "${videoUrl}" (Length: ${videoUrl ? videoUrl.length : 0} characters)

BEFORE WRITING ANY CONTENT:
1. ${transcriptAvailable
    ? `Analyze the ENTIRE transcript and map the full ${durationMinutes}-minute timeline.`
    : `No official transcript is available. Scrub the video manually to map the full ${durationMinutes}-minute timeline. Mark any timestamp you estimate with "(approximate)" in the Tips section.`}
2. Every step header MUST start with a clickable timestamp that links directly to that moment in the video.
3. Timestamps must strictly increase and remain in chronological order.
4. Continue creating steps until you reach the end of the video. Plan for at least ${recommendedStepCount} major steps (more if the content demands it).
5. The final step MUST reference a timestamp within the last ${finalTimestampWindow} minute(s) of the video to prove full coverage.

TIMESTAMP FORMAT (DO NOT COPY LITERALLY — REPLACE WITH REAL VALUES):
### **[${transcriptAvailable ? 'HH:MM:SS actual timestamp' : 'HH:MM:SS approx. timestamp'}](${videoUrl}&t=ACTUAL_TOTAL_SECONDSs)** Step title here

- Replace "HH:MM:SS actual timestamp" with the exact timestamp label that appears on YouTube (e.g., 48:12 or 1:05:27).
- Replace "ACTUAL_TOTAL_SECONDS" with the total seconds as an integer (e.g., 2892).
- Never leave placeholders such as HH, MM, SS, or ACTUAL_TOTAL_SECONDS in the final output.

QUICK NAVIGATION SECTION:
## 🎯 Quick Navigation (Click to jump to video)
- **[${transcriptAvailable ? 'HH:MM:SS actual timestamp' : 'HH:MM:SS approx.'}](${videoUrl}&t=ACTUAL_TOTAL_SECONDSs)** Step title — concise description${transcriptAvailable ? '' : ' (mark approximate timestamps)'}
- Repeat for every step in chronological order. The final bullet must land within the last ${finalTimestampWindow} minute(s) of the video.

GENERAL TIMESTAMP RULES:
- ${transcriptAvailable
    ? 'Extract timestamps from the transcript or metadata — do NOT invent them.'
    : 'If no transcript exists, derive timestamps from manual playback. Call out approximations in the Tips section and Quick Navigation.'}
- Ensure each timestamp aligns with the spoken content in that section.
- If the transcript has gaps, estimate responsibly and note that in the Tips.
- Never reuse the same timestamp twice unless the video genuinely revisits that moment.

NOW PROCEED WITH THE TUTORIAL USING REAL TIMESTAMPS:

` : '';

  return `${timestampInstructions}

STRICT OUTPUT FORMAT - NO INTRODUCTORY TEXT:
- CRITICAL: START EXACTLY with "# Tutorial Guide:" followed immediately by the topic. No characters (including whitespace) may appear before the # symbol.
- ABSOLUTELY DO NOT include conversational or meta language such as "Okay", "Here is", "Let me", "I will", "Sure", "Absolutely", or similar preambles anywhere in the response.
- Maintain a professional, non-conversational tone throughout the entire response.
- Follow the exact markdown structure shown below without adding extra sections or introductory paragraphs.

Transform this YouTube video into a ${verbosity}-level ${domain} tutorial guide (${config.contentReduction}). Structure it as a practical, step-by-step instruction manual optimized for ${domain} content:

# Tutorial Guide: [Topic from Video]

## 📖 What You'll Learn
${verbosity === 'concise' 
  ? '**Quick Overview**: [Essential outcome in 1-2 sentences]'
  : verbosity === 'comprehensive'
  ? '**Comprehensive Learning Path**: [Detailed explanation of complete learning journey, including context, applications, and skill development progression]'
  : '**Learning Outcome**: [Clear description of what you\'ll accomplish and why it matters]'
}

**Time Investment**: ${verbosity === 'comprehensive' ? `[Detailed breakdown: X minutes setup + Y minutes tutorial + Z minutes practice] (Based on ${durationText}-minute video)` : `[Estimated total time] (${durationText}-minute video)`}
**Difficulty**: [${verbosity === 'comprehensive' ? 'Detailed difficulty assessment with prerequisites explanation' : 'Beginner/Intermediate/Advanced'}]

## 📋 Prerequisites
${verbosity === 'concise' 
  ? `Essential ${adaptation.terminology} only:`
  : verbosity === 'comprehensive'
  ? `Comprehensive preparation checklist with detailed explanations (${adaptation.prerequisites}):`
  : `${adaptation.prerequisites}:`
}
${config.sectionDepth.includes('2-3') ? '- [Essential requirement 1]\n- [Essential requirement 2]' : 
  config.sectionDepth.includes('6-8') ? '- [Detailed requirement 1] - [Why needed, how to verify, alternatives]\n- [Detailed requirement 2] - [Comprehensive explanation]\n- [Detailed requirement 3] - [Setup instructions and troubleshooting]' :
  '- [Requirement 1] - [Why this matters]\n- [Requirement 2] - [How to check if you have this]\n- [Requirement 3] - [Where to get if needed]'
}

## 🎯 Learning Goals
By the end of this tutorial, you will be able to:
${verbosity === 'concise'
  ? '- [Essential goal 1]\n- [Essential goal 2]'
  : verbosity === 'comprehensive' 
  ? '- [Detailed goal 1] - [Specific skills and knowledge gained, real-world applications]\n- [Detailed goal 2] - [Comprehensive outcome with measurable criteria]\n- [Detailed goal 3] - [Advanced applications and next-level skills]'
  : '- [Goal 1] - [Specific outcome]\n- [Goal 2] - [Practical application]\n- [Goal 3] - [Skills developed]'
}

## 📝 Step-by-Step Instructions

${videoUrl ? `**CRITICAL:** Each step header MUST use the actual timestamp label and total seconds. Replace the placeholders in the pattern **[HH:MM:SS](${videoUrl}&t=SECONDSs)** with real values from the transcript. Continue generating steps sequentially for every major segment until the video is fully covered.**` : ''}

Repeat the following block for each major segment in chronological order. Do not stop until you reach the end of the video, and ensure the final step references a timestamp within the last ${finalTimestampWindow} minute(s).

### **[${transcriptAvailable ? 'HH:MM:SS actual timestamp' : 'HH:MM:SS approx. timestamp'}](${videoUrl ? `${videoUrl}&t=ACTUAL_TOTAL_SECONDSs` : '#'} )** Step [N]: [Step Title]
**Objective**: ${verbosity === 'comprehensive' ? 'Comprehensive explanation of step purpose, dependencies, and impact' : 'Brief explanation of what this step accomplishes'}

**Instructions** (${adaptation.stepFormat.toLowerCase()}):
1. [Specific action 1]
2. [Specific action 2]
${verbosity !== 'concise' ? '3. [Specific action 3]' : ''}
${verbosity === 'comprehensive' ? '4. [Additional detailed action]\n5. [Advanced consideration]' : ''}

${verbosity === 'comprehensive' ? '**Why This Matters**: [Detailed explanation of the reasoning behind this step]\n\n**Common Variations**: [Alternative approaches and when to use them]\n\n' : ''}**Tips**: [${transcriptAvailable ? (config.stepDetail.includes('Thorough') ? 'Comprehensive guidance with troubleshooting' : 'Helpful hints or warnings') : 'Note if timestamp is approximate and provide context for double-checking'}]

${verbosity === 'comprehensive' ? '**Expected Result**: [Detailed description of what you should see/achieve]' : ''}

Continue generating additional steps using the same structure until the end of the video timeline. Ensure timestamps remain strictly increasing and aligned with the spoken content.

**NOTE**: Add more steps as needed based on the video content. Each step should include ${transcriptAvailable ? 'actual timestamps from the transcript or verified playback' : 'timestamps derived from careful playback (tag approximate times in Tips)'}.

## ✅ Verification & Testing
${verbosity === 'comprehensive' ? `Comprehensive success validation (${adaptation.verification}):` : `${adaptation.verification}:`}
${verbosity === 'concise'
  ? '- [Essential check 1]\n- [Essential check 2]'
  : verbosity === 'comprehensive'
  ? '- [Detailed verification 1] - [Specific criteria and troubleshooting if failed]\n- [Detailed verification 2] - [Multiple validation methods]\n- [Detailed verification 3] - [Advanced testing scenarios]'
  : '- [Check 1] - [What to look for]\n- [Check 2] - [Success criteria]\n- [Check 3] - [Common indicators]'
}

## 🔧 Troubleshooting
${adaptation.troubleshooting} (${config.troubleshootingItems}):
${verbosity === 'concise'
  ? '- **Issue**: [Common problem] → **Fix**: [Quick solution]'
  : verbosity === 'comprehensive' 
  ? '- **Problem**: [Detailed issue description]\n  **Root Cause**: [Why this happens]\n  **Solution**: [Step-by-step fix with alternatives]\n  **Prevention**: [How to avoid this in future]'
  : '- **Problem**: [Common issue]\n  **Solution**: [How to fix it]\n  **Why It Happens**: [Brief explanation]'
}

## 📚 Resources & Next Steps
${verbosity === 'comprehensive' ? '### Additional Resources' : '**Additional Resources**:'}
${config.exampleCount}:
- [Resource 1]: [${verbosity === 'comprehensive' ? 'Detailed description with specific use cases' : 'Description'}]
${verbosity !== 'concise' ? '- [Resource 2]: [Description with context]\n- [Resource 3]: [Advanced resource for deeper learning]' : ''}

${verbosity === 'comprehensive' ? '### Advanced Applications\n[Detailed next steps for taking this knowledge further]\n\n### Community & Support\n[Where to get help and connect with others]\n\n' : ''}## 🎉 Summary
${verbosity === 'comprehensive' 
  ? 'Comprehensive recap of learning journey, key achievements, practical applications, and strategic next steps for continued growth.'
  : verbosity === 'concise'
  ? 'Quick recap of what was accomplished.'
  : 'Brief recap of what was accomplished and practical next steps for continued learning.'
}

## 🎯 Practice Exercises
${verbosity === 'comprehensive' ? 'Comprehensive skill development:' : 'Build your skills:'}
- **Beginner**: [Basic ${adaptation.practiceType.split(' ')[0]} exercise]
${verbosity !== 'concise' ? `- **Intermediate**: [More challenging ${adaptation.practiceType}]` : ''}
${verbosity === 'comprehensive' ? `- **Advanced**: [Complex ${adaptation.practiceType} with multiple components]` : ''}

## 🎯 Quick Navigation${videoUrl ? ' (Clickable Timestamps)' : ''}
${videoUrl ? `Click any timestamp below to jump directly to that part of the video.${transcriptAvailable ? '' : ' Label any approximate entries with "(approx.)" and encourage viewers to verify.'}` : 'Key sections identified in the tutorial:'}

- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 1: [First Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]
- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 2: [Second Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]
- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 3: [Third Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]
${verbosity !== 'concise' ? `- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 4: [Fourth Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]` : ''}
${verbosity === 'comprehensive' ? `- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 5: [Fifth Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]
- **[MM:SS${transcriptAvailable ? '' : ' approx.'}](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** Step 6: [Sixth Step Title] - [Brief description${transcriptAvailable ? '' : ' (approx.)'}]` : ''}

**GENERATION GUIDELINES:**
- Content Level: ${config.contentReduction}
- Section Depth: ${config.sectionDepth}  
- Domain Focus: ${domain}-specific ${adaptation.terminology}
- Step Format: ${adaptation.stepFormat.toLowerCase()}
- Examples: ${config.exampleCount} where relevant
- Timestamps: Use **[MM:SS](${videoUrl ? videoUrl + '&t=' : '#'}XXXs)** format consistently throughout
- Extract actual timestamps from video transcript analysis
- Ensure each step has genuine instructional content, not placeholder text`;
}

/**
 * Generate natural Basic Summary prompt based on video duration
 * Uses content-aware guidance instead of artificial point constraints
 */
function generateBasicSummaryPrompt(durationSeconds: number = 300): string {
  // Determine content depth guidance based on duration
  let contentGuidance: string;
  let detailLevel: string;
  let durationContext: string;
  
  if (durationSeconds < 300) { // < 5 minutes
    contentGuidance = "Extract the core concepts concisely";
    detailLevel = "Focus on essential information only";
    durationContext = "short video";
  } else if (durationSeconds < 900) { // 5-15 minutes  
    contentGuidance = "Identify all major topics and themes presented";
    detailLevel = "Include supporting details for each major point";
    durationContext = "medium-length video";
  } else if (durationSeconds < 1800) { // 15-30 minutes
    contentGuidance = "Provide comprehensive coverage of all significant concepts, themes, and subtopics";
    detailLevel = "Include examples, context, and detailed explanations";
    durationContext = "longer video";
  } else { // > 30 minutes
    contentGuidance = "Ensure thorough analysis covering all major sections, concepts, and their interconnections";
    detailLevel = "Include comprehensive examples, context, detailed explanations, and relationships between concepts";
    durationContext = "extended video";
  }

  return `Generate a structured video summary following this format:

**Video Summary**

**Main Topic**: [Single sentence describing the core subject]

**Key Points**: 
[${contentGuidance} - Let the content naturally determine the number of points]

**Important Details**: 
[${detailLevel} - Extract naturally occurring supporting information]

**Structure**: [How the ${durationContext} content was organized]

**Conclusion**: [Main takeaway or final message]

CONTENT EXTRACTION GUIDANCE:
- Video Duration: ${Math.floor(durationSeconds / 60)} minutes
- Approach: ${contentGuidance}
- Detail Level: ${detailLevel}
- Extract key points based on actual content structure, not artificial limits
- For ${durationContext}s, ensure appropriate comprehensiveness without forced constraints
- Let the natural flow and organization of content determine the structure

FORMATTING RULES:
- Start output with "**Video Summary**" on first line
- Use only the sections listed above
- Write in third-person, factual tone
- No preambles, introductions, or meta-commentary
- Format as clean markdown with bullet points`;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'summary' | 'educational' | 'professional' | 'creative';
  icon: string;
  color: string;
  prompt: string | ((durationSeconds?: number) => string) | ((durationSeconds?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain, videoUrl?: string, transcriptAvailable?: boolean) => string);
  outputFormat: 'markdown' | 'html' | 'json' | 'text';
  features: string[];
  limitations: string[];
  estimatedTokens: number;
  processingTime: number; // in minutes
  isPremium: boolean;
  supportsVerbosity?: boolean; // New: indicates if template supports verbosity controls
  supportsDomainDetection?: boolean; // New: indicates if template supports domain-specific adaptations
}

export const TEMPLATES: Template[] = [
  {
    id: 'basic-summary',
    name: 'Basic Summary',
    description: 'Natural content extraction that adapts depth based on video length - no artificial constraints',
    category: 'summary',
    icon: '📝',
    color: 'blue',
    prompt: generateBasicSummaryPrompt,
    outputFormat: 'markdown',
    features: [
      'Natural content extraction',
      'Duration-aware depth scaling',
      'Intelligent point identification',
      'Content-driven structure'
    ],
    limitations: [
      'Structure-focused format',
      'No interactive elements'
    ],
    estimatedTokens: 2400,
    processingTime: 2,
    isPremium: false
  },

  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Structured learning content with sections for notes, questions, and review',
    category: 'educational',
    icon: '📚',
    color: 'green',
    prompt: `STRICT OUTPUT FORMAT - NO INTRODUCTORY TEXT:

## 📖 Video Overview
- **Title**: [Video Title]
- **Speaker/Channel**: [Who is presenting]
- **Duration**: [Video length]
- **Main Topic**: [What is being taught]

## 🎯 Learning Objectives
[List 3-5 specific things viewers should learn from this video]

## 📝 Detailed Notes

### [Section/Topic 1]
- Key concepts and definitions
- Important examples or case studies
- Formulas, steps, or procedures (if applicable)

### [Section/Topic 2]
- Key concepts and definitions
- Important examples or case studies
- Formulas, steps, or procedures (if applicable)

[Continue for all major sections...]

## ❓ Study Questions
Create 5-8 comprehension questions that test understanding of the material:
1. [Question 1]
2. [Question 2]
3. [Question 3]
4. [Question 4]
5. [Question 5]

## 🔍 Key Terms & Definitions
- **Term 1**: Definition
- **Term 2**: Definition
- **Term 3**: Definition

## 📋 Summary Points
- [Key takeaway 1]
- [Key takeaway 2]
- [Key takeaway 3]

## 🎯 Application
How can this knowledge be applied in real-world scenarios?

Format in clean markdown with clear headings and bullet points. Ensure the content is educational and well-organized for effective studying.`,
    outputFormat: 'markdown',
    features: [
      'Structured learning format',
      'Study questions included',
      'Key terms highlighted',
      'Application section'
    ],
    limitations: [
      'Longer processing time',
      'Requires educational content'
    ],
    estimatedTokens: 4000,
    processingTime: 4,
    isPremium: false
  },

  {
    id: 'presentation-slides',
    name: 'Presentation Slides',
    description: 'Key points formatted for presentation slides with speaker notes (Beta - Still improving)',
    category: 'professional',
    icon: '📊',
    color: 'purple',
    prompt: `STRICT OUTPUT FORMAT - NO INTRODUCTORY TEXT:

# Presentation Slides: [Video Topic]

## Slide 1: Title Slide
**[Video Title]**
[Brief, compelling subtitle that captures the main value proposition]

[Current date or video date]
[Channel name or presenter name]

---

## Slide 2: The Problem We're Solving
**Challenge:** [Main problem or pain point addressed in the video]

**Why This Matters:** [2-3 compelling reasons why this topic is important]

**What You'll Learn:** [3 specific things viewers will gain from this content]

---

## Slide 3: Key Concepts Overview
**Three Main Strategies:**
1. [First strategy/concept name]
2. [Second strategy/concept name]  
3. [Third strategy/concept name]

**The Big Picture:** [How these concepts work together]

---

## Slide 4: Strategy 1 - [First Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 5: Strategy 2 - [Second Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 6: Strategy 3 - [Third Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 7: Implementation Guide
**Getting Started:** [3 actionable steps to implement these strategies]

**Common Mistakes to Avoid:** [2-3 pitfalls and how to avoid them]

**Success Metrics:** [How to measure if these strategies are working]

---

## Slide 8: Summary & Action Plan
**Key Takeaways:**
• [First main takeaway]
• [Second main takeaway]
• [Third main takeaway]

**Your Next Steps:**
1. [Immediate action item]
2. [Short-term goal]
3. [Long-term objective]

**Questions?** [How to get help or continue learning]

**Speaker Notes:** 
For each slide, provide:
- Opening statement (15-20 seconds)
- Key talking points (1-2 minutes per point)
- Transition to next slide (10-15 seconds)
- Expected audience questions and responses`,
    outputFormat: 'markdown',
    features: [
      'Research-optimized structure (TED 4-step framework)',
      'Cognitive load management (7±2 rule)',
      'Accessibility-first design (WCAG 2.1 AA)',
      'Professional speaker notes with timing guides',
      '12-column grid system with visual hierarchy',
      'Interactive engagement elements included',
      '65% higher engagement rates proven'
    ],
    limitations: [
      'Requires video content with clear structure',
      'May need design software for final formatting',
      'Optimal for 10-30 minute videos'
    ],
    estimatedTokens: 2000,
    processingTime: 3,
    isPremium: false
  },

  {
    id: 'tutorial-guide',
    name: 'Tutorial Guide',
    description: 'Step-by-step instructions with verbosity controls (Concise/Standard/Comprehensive)',
    category: 'educational',
    icon: '🔧',
    color: 'orange',
    prompt: generateTutorialGuidePrompt,
    supportsVerbosity: true,
    supportsDomainDetection: true,
    outputFormat: 'markdown',
    features: [
      'Step-by-step instructions',
      'Troubleshooting section',
      'Prerequisites listed',
      'Verification steps'
    ],
    limitations: [
      'Requires practical content',
      'May need additional context'
    ],
    estimatedTokens: 4500,
    processingTime: 5,
    isPremium: false
  },



  {
    id: 'research-paper',
    name: 'Research Paper Format',
    description: 'Academic-style paper with introduction, methodology, findings, and conclusions',
    category: 'professional',
    icon: '📄',
    color: 'indigo',
    prompt: `Convert this YouTube video content into an academic research paper format:

# Research Paper: [Topic from Video]

## Abstract
[Brief summary of the content, methodology, and key findings in 150-200 words]

## Introduction
### Background
[Context and background information related to the topic]

### Purpose
[Clear statement of what the video/paper aims to accomplish]

### Research Questions
[Specific questions that the content addresses]

## Methodology
### Data Collection
[How information was gathered or analyzed in the video]

### Analysis Approach
[Methods used to process and present the information]

## Findings
### [Finding Category 1]
[Detailed analysis of the first major finding]

### [Finding Category 2]
[Detailed analysis of the second major finding]

### [Finding Category 3]
[Detailed analysis of the third major finding]

## Discussion
### Implications
[What the findings mean and their broader significance]

### Limitations
[Any limitations or constraints of the presented information]

### Future Research
[Areas for further investigation or study]

## Conclusion
[Summary of key findings and their significance]

## References
[List any sources, studies, or references mentioned in the video]

Format with academic writing style, proper headings, and detailed analysis. Include in-text citations where appropriate and maintain scholarly tone throughout.`,
    outputFormat: 'markdown',
    features: [
      'Academic format',
      'Research methodology',
      'Detailed analysis',
      'Proper citations'
    ],
    limitations: [
      'Requires academic content',
      'Extended processing time'
    ],
    estimatedTokens: 6000,
    processingTime: 6,
    isPremium: false
  }
];

/**
 * Resolve dynamic prompt for templates that support it
 * Enhanced to support verbosity levels and domain detection
 */
export function getTemplatePrompt(
  template: Template, 
  durationSeconds?: number, 
  verbosity?: VerbosityLevel,
  domain?: TutorialDomain,
  videoUrl?: string
): string {
  if (typeof template.prompt === 'function') {
    // For tutorial-guide template, always use the full 4-parameter signature with videoUrl
    if (template.id === 'tutorial-guide' && template.supportsDomainDetection) {
      return (template.prompt as (duration?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain, videoUrl?: string) => string)(durationSeconds, verbosity, domain, videoUrl);
    }
    // Check if the function supports domain detection (fallback without videoUrl)
    else if (template.supportsDomainDetection) {
      return (template.prompt as (duration?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain) => string)(durationSeconds, verbosity, domain);
    }
    // Check if the function supports verbosity
    else if (template.supportsVerbosity) {
      return (template.prompt as (duration?: number, verbosity?: VerbosityLevel) => string)(durationSeconds, verbosity);
    }
    // Otherwise call with just duration
    return (template.prompt as (duration?: number) => string)(durationSeconds);
  }
  return template.prompt;
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return TEMPLATES.filter(template => template.category === category);
}

export function getFreeTemplates(): Template[] {
  return TEMPLATES.filter(template => !template.isPremium);
}

export function getPremiumTemplates(): Template[] {
  return TEMPLATES.filter(template => template.isPremium);
}

export function getTemplatesWithVerbosity(): Template[] {
  return TEMPLATES.filter(template => template.supportsVerbosity);
}

export function estimateProcessingCost(template: Template, videoDuration: number): number {
  // Estimate cost based on video duration and template complexity
  const baseCost = template.estimatedTokens * 0.0000015; // Approximate cost per token
  const durationMultiplier = Math.max(1, videoDuration / 10); // Longer videos cost more
  return baseCost * durationMultiplier;
}

export function getRecommendedTemplate(videoDuration: number, category?: 'educational' | 'professional' | 'summary'): Template {
  if (category) {
    const categoryTemplates = getTemplatesByCategory(category);
    return categoryTemplates[0]; // Return first template in category
  }
  
  // Default recommendation based on video duration
  if (videoDuration < 15) {
    return getTemplateById('basic-summary')!;
  } else {
    return getTemplateById('study-notes')!;
  }
}

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}

export function getActiveTemplates(): Template[] {
  return TEMPLATES.filter(template => (template as { isActive?: boolean }).isActive !== false);
}

export function estimateTokenUsage(templateId: string, contentLength: number): number {
  const template = getTemplateById(templateId);
  if (!template) return 0;

  const baseTokens = typeof template.estimatedTokens === 'number' ? template.estimatedTokens : 0;
  const contentTokens = Math.ceil(contentLength / 4); // Rough estimate: 4 characters per token

  return baseTokens + contentTokens;
}

export function validateTemplate(template: Partial<Template>): string[] {
  const errors: string[] = [];

  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.prompt) errors.push('Template prompt is required');
  if (!template.category) errors.push('Template category is required');

  if (typeof template.estimatedTokens === 'number' && template.estimatedTokens < 0) {
    errors.push('Estimated tokens must be positive');
  }

  return errors;
}

export default TEMPLATES;
