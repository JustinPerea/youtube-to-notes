#!/usr/bin/env tsx

/**
 * Interactive Agent Workflow Demo
 * 
 * This script demonstrates how agents ask questions before proceeding
 * and how the coordinator manages the interactive decision-making process.
 */

import { coordinatorAgent } from '../lib/agents/coordinator';
import { TaskRequest } from '../lib/agents/coordinator';
import { AgentDecision } from '../lib/agents/base-agent';

async function demoInteractiveWorkflow() {
  console.log('🚀 Starting Interactive Agent Workflow Demo\n');

  // Example 1: Frontend component that needs design decisions
  console.log('📋 Example 1: Creating a Landing Page Component');
  console.log('═'.repeat(60));
  
  const landingPageTask: TaskRequest = {
    id: 'landing-page-task-001',
    type: 'frontend',
    description: 'Create a modern landing page component for YouTube-to-Notes',
    requirements: [
      'Responsive design',
      'Glass morphism styling',
      'Call-to-action buttons',
      'Video upload interface'
    ],
    priority: 'high'
  };

  // Step 1: Submit task to coordinator
  console.log('🤖 Submitting task to coordinator...');
  const initialResult = await coordinatorAgent.processTask(landingPageTask);
  
  if (initialResult.needsDecisions && initialResult.questions) {
    console.log(`\n🤔 The Frontend Agent needs ${initialResult.questions.length} decisions before proceeding:`);
    
    // Display questions to user (in real app, this would be in the UI)
    initialResult.questions.forEach((question, index) => {
      console.log(`\n${index + 1}. ${question.question}`);
      console.log(`   Description: ${question.description}`);
      
      if (question.options && question.options.length > 0) {
        console.log(`   Options:`);
        question.options.forEach(option => {
          console.log(`   - ${option}`);
        });
      }
      
      console.log(`   Required: ${question.required ? 'Yes' : 'No'}`);
    });

    // Step 2: Simulate user providing decisions
    console.log('\n📝 User providing decisions...');
    const userDecisions: AgentDecision[] = [
      {
        questionId: 'design-style',
        answer: 'Glass Morphism',
        reasoning: 'Want a modern, elegant look with transparency effects',
        impact: ['Adds glass morphism CSS', 'Requires backdrop-filter support']
      },
      {
        questionId: 'layout-preference',
        answer: 'Single-page application with sections',
        reasoning: 'Better user experience with smooth scrolling between sections',
        impact: ['Implements smooth scrolling', 'Section-based navigation']
      },
      {
        questionId: 'page-content',
        answer: 'Hero section, Features section, Template showcase, Upload interface, Pricing section, Footer',
        reasoning: 'Comprehensive landing page covering all key aspects',
        impact: ['Multiple sections to implement', 'Complex layout structure']
      },
      {
        questionId: 'accessibility-level',
        answer: 'Enhanced accessibility (WCAG AAA)',
        reasoning: 'Important for inclusive design and broader user base',
        impact: ['Advanced ARIA labels', 'Screen reader optimization']
      },
      {
        questionId: 'responsive-breakpoints',
        answer: 'Mobile-first (mobile, tablet, desktop)',
        reasoning: 'Majority of users access on mobile devices',
        impact: ['Mobile-first CSS', 'Progressive enhancement']
      },
      {
        questionId: 'performance-priority',
        answer: 'Balanced performance and development speed',
        reasoning: 'Good balance for MVP with room for optimization',
        impact: ['Standard optimization', 'Reasonable bundle size']
      }
    ];

    // Step 3: Process decisions and continue execution
    console.log('\n🔄 Processing decisions and continuing execution...');
    const finalResult = await coordinatorAgent.processDecisions(landingPageTask.id, userDecisions);
    
    if (finalResult.success) {
      console.log('\n✅ Task completed successfully!');
      console.log(`📊 Result:`, finalResult.output);
      console.log(`⏱️ Duration: ${finalResult.duration}ms`);
      console.log(`📝 Notes:`, finalResult.notes);
    } else {
      console.log('\n❌ Task failed:', finalResult.errors);
    }
  }

  // Example 2: Backend API that needs technical decisions
  console.log('\n\n📋 Example 2: Creating Video Processing API');
  console.log('═'.repeat(60));
  
  const apiTask: TaskRequest = {
    id: 'api-task-002',
    type: 'backend',
    description: 'Create REST API endpoint for video processing with Gemini integration',
    requirements: [
      'Handle video uploads',
      'Integrate with Gemini API',
      'Queue processing for long videos',
      'Return processing status'
    ],
    priority: 'high'
  };

  const apiResult = await coordinatorAgent.processTask(apiTask);
  
  if (apiResult.needsDecisions && apiResult.questions) {
    console.log(`\n🤔 The Backend Agent needs ${apiResult.questions.length} decisions:`);
    
    apiResult.questions.forEach((question, index) => {
      console.log(`\n${index + 1}. ${question.question}`);
      if (question.description) {
        console.log(`   Description: ${question.description}`);
      }
      if (question.options) {
        console.log(`   Options: ${question.options.join(', ')}`);
      }
    });

    // Simulate backend decisions (in real app, these would come from technical requirements)
    const backendDecisions: AgentDecision[] = [
      {
        questionId: 'api-structure',
        answer: 'RESTful API with JSON responses',
        reasoning: 'Standard REST API for easy integration and documentation',
        impact: ['Standard HTTP methods', 'JSON request/response format']
      }
    ];

    const finalApiResult = await coordinatorAgent.processDecisions(apiTask.id, backendDecisions);
    console.log('\n✅ API task completed:', finalApiResult.success ? 'Success' : 'Failed');
  }

  // Example 3: Check pending decisions
  console.log('\n\n📋 Example 3: Checking Pending Decisions');
  console.log('═'.repeat(60));
  
  const pendingDecisions = coordinatorAgent.getPendingDecisions();
  console.log(`📊 Total pending decisions: ${pendingDecisions.length}`);
  
  pendingDecisions.forEach((decision, index) => {
    console.log(`\n${index + 1}. Task: ${decision.taskId}`);
    console.log(`   Agent: ${decision.agent}`);
    console.log(`   Questions needed: ${decision.questions.length}`);
    console.log(`   Priority: ${decision.priority}`);
    console.log(`   Created: ${decision.createdAt.toISOString()}`);
  });

  // Generate project report
  console.log('\n\n📋 Project Status Report');
  console.log('═'.repeat(60));
  
  const report = await coordinatorAgent.generateProjectReport();
  console.log(`📊 Total Tasks: ${report.totalTasks}`);
  console.log(`✅ Successful: ${report.successful}`);
  console.log(`❌ Failed: ${report.failed}`);
  console.log(`🤔 Pending: ${report.pending}`);
  console.log(`📈 Success Rate: ${report.successRate.toFixed(1)}%`);
  console.log(`⏱️ Average Duration: ${report.averageDuration.toFixed(0)}ms`);

  console.log('\n🎉 Interactive Agent Workflow Demo Completed!');
}

// Handle errors gracefully
async function runDemo() {
  try {
    await demoInteractiveWorkflow();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo();
}
