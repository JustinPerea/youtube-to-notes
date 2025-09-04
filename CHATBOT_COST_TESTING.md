# Chatbot Cost Testing Guide

## Overview

This testing framework allows you to measure and compare the real costs of different video chatbot approaches with actual API calls to Gemini 2.0 Flash.

## Testing Approaches

### 1. Current Approach (Pre-processed Summaries)
- Process video once to create summaries
- Chatbot works from pre-processed context
- Limited understanding but fast responses

### 2. Full Reprocessing Approach
- Re-process entire video for each question
- Full video understanding per question
- Most expensive but highest accuracy

### 3. RAG Approach (Simulated)
- Process video once + create embeddings
- Fast vector similarity search per question
- Best balance of cost and understanding

## How to Run Tests

### Quick Test (Recommended for initial testing)
```bash
# Test with 1 video and 3 questions
npm run test:chatbot-costs
```

### Full Test (Comprehensive analysis)
```bash
# Test with 3 videos and 8 questions each
npm run test:chatbot-costs-full
```

### Manual Execution
```bash
# Quick test
node run-cost-test.js

# Full test
node run-cost-test.js full
```

## What the Tests Do

### Phase 1: Video Processing
1. **Current & RAG**: Process video once using existing `processVideo()` method
2. **Full Reprocessing**: Skip initial processing (done per question)
3. **RAG Only**: Simulate embedding creation from processed content

### Phase 2: Question Answering
For each test question:

1. **Current**: Use pre-processed summaries as context
2. **Full Reprocessing**: Process entire video with question-specific prompt
3. **RAG**: Simulate vector search + context retrieval + text generation

### Phase 3: Cost Calculation
- Track token usage for all API calls
- Apply current Gemini 2.0 Flash pricing
- Calculate total costs and compare approaches

## Expected Test Output

```
🧪 Testing Current Approach (Pre-processed Summaries)
📹 Processing video initially...
✅ Initial processing: $0.0234 USD
❓ Question 1: What is the main topic of this video?
💰 Question cost: $0.0012 USD
❓ Question 2: Can you summarize what happens in the video?
💰 Question cost: $0.0015 USD
❓ Question 3: Who is the main person in this video?
💰 Question cost: $0.0009 USD
📊 Current Approach Total: $0.0270 USD

🧪 Testing Full Reprocessing Approach
❓ Question 1: What is the main topic of this video?
💰 Question cost (full reprocessing): $0.1234 USD
❓ Question 2: Can you summarize what happens in the video?
💰 Question cost (full reprocessing): $0.1298 USD
❓ Question 3: Who is the main person in this video?
💰 Question cost (full reprocessing): $0.1156 USD
📊 Full Reprocessing Total: $0.3688 USD

🧪 Testing RAG Approach (Simulated)
📹 Processing video and creating embeddings...
✅ Initial processing: $0.0234 USD
✅ Embedding creation: $0.0045 USD
❓ Question 1: What is the main topic of this video?
💰 Question cost (RAG): $0.0013 USD
❓ Question 2: Can you summarize what happens in the video?
💰 Question cost (RAG): $0.0016 USD
❓ Question 3: Who is the main person in this video?
💰 Question cost (RAG): $0.0011 USD
📊 RAG Approach Total: $0.0319 USD

📊 COST COMPARISON - Rick Astley Test
══════════════════════════════════════════════════
Current Approach:     $0.0270
Full Reprocessing:    $0.3688
RAG Approach:         $0.0319
──────────────────────────────────────────────────
💰 Cheapest: Current
📈 RAG Savings vs Reprocessing: 91.3%
══════════════════════════════════════════════════
```

## Test Configuration

### Videos Tested
1. **Short Video**: 3-4 minute music video (low complexity)
2. **Medium Video**: 4-5 minute content (medium complexity)
3. **Educational Video**: 5+ minute tutorial (high complexity)

### Test Questions
- "What is the main topic of this video?"
- "Can you summarize the key points discussed?"
- "What happens at the 2-minute mark?"
- "Who are the main people featured in the video?"
- "What is the overall tone or mood of the content?"
- "Are there any important visual elements or graphics?"
- "What would you say is the target audience?"
- "Can you explain the most important concept discussed?"

### Cost Factors
- **Gemini 2.0 Flash Input**: $0.00015 per 1K tokens
- **Gemini 2.0 Flash Output**: $0.0006 per 1K tokens
- **Video Processing Base**: $0.10 per video
- **Video Processing Per Minute**: $0.05 per minute
- **OpenAI Embeddings**: $0.02 per 1M tokens

## Interpreting Results

### Key Metrics
- **Initial Processing Cost**: One-time setup cost per video
- **Per Question Cost**: Cost for each chat interaction
- **Total Cost**: Complete cost for all questions
- **Break-even Point**: How many questions before RAG becomes cheaper

### Expected Findings
1. **Current approach** will be cheapest for limited interactions
2. **RAG approach** will be most cost-effective after 2-3 questions
3. **Full reprocessing** will be 10-20x more expensive than RAG
4. **RAG break-even** typically occurs at 2nd or 3rd question per video

## Important Notes

### Limitations
- **RAG is simulated** - actual vector search not implemented yet
- **Costs are estimates** - actual API usage may vary
- **Test videos** are publicly accessible - private videos may behave differently

### Real vs Test Environment
- Tests use actual Gemini API calls where possible
- Full video reprocessing is simulated (would be very expensive)
- RAG embeddings are estimated based on content analysis

### Next Steps After Testing
1. Review cost comparison results
2. Determine break-even point for your use case
3. Decide whether to implement RAG system
4. Use results to estimate production costs

## Troubleshooting

### Common Issues
- **API Key Missing**: Ensure `GOOGLE_GEMINI_API_KEY` is set
- **Network Errors**: Check internet connection and API quotas
- **Test Failures**: Some videos might not be accessible or have restrictions

### Debug Mode
Add `console.log` statements in `test-chatbot-cost-analysis.js` to debug specific issues:

```javascript
// Add this to see detailed token usage
console.log('Token usage:', response.tokenUsage);
console.log('Response length:', response.text.length);
```

## Cost Optimization Tips

### For Current Testing
- Start with quick test (1 video, 3 questions)
- Monitor API usage and costs during testing
- Use rate limiting to avoid quota issues

### For Production Implementation
- Batch process videos during off-peak hours
- Cache processed results to avoid re-processing
- Implement user limits to control costs
- Monitor costs with automated alerting

---

**Ready to test?** Run `npm run test:chatbot-costs` to get started!