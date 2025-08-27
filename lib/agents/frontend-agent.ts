/**
 * Frontend Agent - Handles UI/UX implementation and React component development
 * 
 * Responsibilities:
 * - React component creation and optimization
 * - User interface design implementation
 * - Responsive design and accessibility
 * - State management integration
 * - UI testing and validation
 */

import { BaseAgent, AgentQuestion } from './base-agent';
import { TaskRequest, TaskResult } from './coordinator';
import { AgentDecision } from './base-agent';

export class FrontendAgent extends BaseAgent {
  constructor() {
    super('FrontendAgent', [
      'React component development',
      'UI/UX implementation',
      'Responsive design',
      'Accessibility compliance',
      'State management',
      'Frontend testing'
    ]);
  }

  /**
   * Generate design and UX questions before implementing
   */
  protected async generateQuestions(task: TaskRequest): Promise<AgentQuestion[]> {
    const questions: AgentQuestion[] = [];
    
    // Always ask about design style for any UI task
    questions.push(
      this.createDesignQuestion(
        'design-style',
        'What design style should we use for this interface?',
        'This will determine the visual approach, color schemes, and overall aesthetic of the components.',
        [
          'https://example.com/glass-morphism-example.png',
          'https://example.com/modern-minimalist-example.png'
        ]
      )
    );

    // Component-specific questions
    if (task.description.toLowerCase().includes('page')) {
      questions.push(
        this.createPreferenceQuestion(
          'layout-preference',
          'What type of layout structure do you prefer?',
          'This affects how content is organized and navigated.',
          [
            'Single-page application with sections',
            'Traditional multi-page navigation',
            'Card-based grid layout',
            'Dashboard-style with sidebar',
            'Full-screen immersive'
          ]
        )
      );

      questions.push(
        this.createTechnicalQuestion(
          'page-content',
          'What main content sections should this page include?',
          'List the key sections or components that need to be on this page.',
          [] // User will provide text input
        )
      );
    }

    if (task.description.toLowerCase().includes('component')) {
      questions.push(
        this.createTechnicalQuestion(
          'component-purpose',
          'What is the primary purpose of this component?',
          'This helps determine the appropriate component type and behavior.',
          [
            'Data display (tables, lists, cards)',
            'User input (forms, buttons, inputs)',
            'Navigation (menus, breadcrumbs, pagination)',
            'Feedback (alerts, notifications, modals)',
            'Layout (containers, grids, flexboxes)'
          ]
        )
      );

      questions.push(
        this.createPreferenceQuestion(
          'interactivity-level',
          'How interactive should this component be?',
          'This affects animations, hover states, and user feedback.',
          [
            'Static (no animations)',
            'Subtle animations (hover effects)',
            'Moderate interactivity (transitions)',
            'Highly interactive (complex animations)'
          ]
        )
      );
    }

    if (task.description.toLowerCase().includes('form')) {
      questions.push(
        this.createTechnicalQuestion(
          'form-validation',
          'What type of validation do you need?',
          'Select the validation requirements for form inputs.',
          [
            'Basic HTML5 validation',
            'Real-time validation with feedback',
            'Custom validation rules',
            'Server-side validation only',
            'No validation required'
          ]
        )
      );

      questions.push(
        this.createPreferenceQuestion(
          'form-submission',
          'How should form submission be handled?',
          'This affects the user experience during form submission.',
          [
            'Traditional form submission',
            'Single-page submission with loading state',
            'Multi-step wizard with progress',
            'Real-time auto-save'
          ]
        )
      );
    }

    // Accessibility and responsive design questions
    questions.push(
      this.createPreferenceQuestion(
        'accessibility-level',
        'What level of accessibility support is required?',
        'This affects ARIA labels, keyboard navigation, and screen reader support.',
        [
            'Basic accessibility (WCAG AA)',
            'Enhanced accessibility (WCAG AAA)',
            'Custom accessibility requirements',
            'No specific requirements'
          ]
      )
    );

    questions.push(
      this.createPreferenceQuestion(
        'responsive-breakpoints',
        'Which device sizes should we prioritize?',
        'This affects our responsive design approach.',
        [
          'Mobile-first (mobile, tablet, desktop)',
          'Desktop-first (desktop, tablet, mobile)',
          'Mobile and desktop only',
          'All sizes equally important'
        ]
      )
    );

    // Performance and optimization questions
    questions.push(
      this.createTechnicalQuestion(
        'performance-priority',
        'What is the performance priority for this component?',
        'This affects code splitting, lazy loading, and optimization strategies.',
        [
          'Maximum performance (optimize everything)',
          'Balanced performance and development speed',
          'Fast development (performance can be optimized later)',
          'Not a concern'
        ]
      )
    );

    return questions;
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    this.log(`Starting frontend task: ${task.description}`);
    
    if (!this.validateTask(task)) {
      return this.createErrorResult(task, new Error('Invalid task validation'));
    }

    try {
      const startTime = Date.now();
      
      // Get decisions for this task
      const decisions = this.getDecisionHistory(task.id) as AgentDecision[];
      
      // Analyze frontend requirements based on decisions
      const analysis = this.analyzeFrontendRequirements(task, decisions);
      this.log(`Frontend analysis completed: ${analysis.type} component`);
      
      // Execute based on component type
      let output: any;
      
      switch (analysis.type) {
        case 'page':
          output = await this.createPage(task, analysis, decisions);
          break;
        case 'component':
          output = await this.createComponent(task, analysis, decisions);
          break;
        case 'form':
          output = await this.createForm(task, analysis, decisions);
          break;
        case 'layout':
          output = await this.createLayout(task, analysis, decisions);
          break;
        case 'hook':
          output = await this.createHook(task, analysis, decisions);
          break;
        default:
          output = await this.generalFrontendImplementation(task, analysis, decisions);
      }

      const duration = Date.now() - startTime;
      
      // Record performance metrics
      this.recordPerformance(task.id, {
        componentType: analysis.type,
        complexity: analysis.complexity,
        duration,
        componentsCreated: output.componentsCreated || 0,
        filesModified: output.filesModified || 0,
        designStyle: analysis.designStyle
      });

      const notes = this.formatDetailedNotes('Frontend implementation', [
        `Type: ${analysis.type}`,
        `Complexity: ${analysis.complexity}`,
        `Components: ${output.componentsCreated || 0}`,
        `Files: ${output.filesModified || 0}`,
        `Design Style: ${analysis.designStyle}`
      ]);

      return this.createSuccessResult(task, output, notes);

    } catch (error) {
      this.log(`Frontend task failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return this.createErrorResult(task, error as Error);
    }
  }

  private analyzeFrontendRequirements(task: TaskRequest, decisions: any[]): {
    type: string;
    complexity: 'low' | 'medium' | 'high';
    features: string[];
    estimatedComponents: number;
    designStyle: string;
    accessibility: string;
    performance: string;
  } {
    const description = task.description.toLowerCase();
    const requirements = task.requirements.join(' ').toLowerCase();
    
    let type = 'component';
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const features: string[] = [];
    
    // Extract design decisions
    const designDecision = decisions.find(d => d.questionId === 'design-style');
    const designStyle = designDecision?.answer || 'Modern Minimalist';
    
    const accessibilityDecision = decisions.find(d => d.questionId === 'accessibility-level');
    const accessibility = accessibilityDecision?.answer || 'Basic accessibility';
    
    const performanceDecision = decisions.find(d => d.questionId === 'performance-priority');
    const performance = performanceDecision?.answer || 'Balanced performance';
    
    // Analyze component type
    if (description.includes('page') || description.includes('route')) {
      type = 'page';
    } else if (description.includes('form') || description.includes('input')) {
      type = 'form';
    } else if (description.includes('layout') || description.includes('wrapper')) {
      type = 'layout';
    } else if (description.includes('hook') || description.includes('custom hook')) {
      type = 'hook';
    }

    // Analyze features based on decisions
    if (designStyle === 'Glass Morphism') features.push('glass-morphism');
    if (designStyle === 'Neumorphism') features.push('neumorphism');
    if (accessibility.includes('Enhanced')) features.push('advanced-accessibility');
    if (performance.includes('Maximum')) features.push('performance-optimized');

    // Analyze complexity
    if (requirements.includes('complex') || features.length > 3) {
      complexity = 'high';
    } else if (requirements.includes('simple') || features.length <= 1) {
      complexity = 'low';
    }

    return { 
      type, 
      complexity, 
      features, 
      estimatedComponents: complexity === 'high' ? 3 : 1,
      designStyle,
      accessibility,
      performance
    };
  }

  private async createPage(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`Creating page with ${analysis.designStyle} style: ${task.description}`);
    
    const layoutDecision = decisions.find(d => d.questionId === 'layout-preference');
    const layoutType = layoutDecision?.answer || 'Single-page application';
    
    return {
      page: task.description,
      componentsCreated: ['page-component'],
      filesModified: ['page.tsx', 'page.module.css'],
      features: analysis.features,
      routing: 'configured',
      seo: 'optimized',
      designStyle: analysis.designStyle,
      layoutType: layoutType
    };
  }

  private async createComponent(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`Creating component with ${analysis.designStyle} style: ${task.description}`);
    
    const purposeDecision = decisions.find(d => d.questionId === 'component-purpose');
    const purpose = purposeDecision?.answer || 'Data display';
    
    const interactivityDecision = decisions.find(d => d.questionId === 'interactivity-level');
    const interactivity = interactivityDecision?.answer || 'Subtle animations';
    
    return {
      component: task.description,
      componentsCreated: ['react-component'],
      filesModified: ['component.tsx', 'component.module.css', 'component.test.tsx'],
      features: analysis.features,
      props: 'defined',
      tests: 'created',
      purpose: purpose,
      interactivity: interactivity,
      designStyle: analysis.designStyle
    };
  }

  private async createForm(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`Creating form with ${analysis.designStyle} style: ${task.description}`);
    
    const validationDecision = decisions.find(d => d.questionId === 'form-validation');
    const validation = validationDecision?.answer || 'Basic HTML5 validation';
    
    const submissionDecision = decisions.find(d => d.questionId === 'form-submission');
    const submission = submissionDecision?.answer || 'Traditional form submission';
    
    return {
      form: task.description,
      componentsCreated: ['form-component', 'input-components'],
      filesModified: ['form.tsx', 'form.module.css', 'form.validation.ts'],
      features: [...analysis.features, 'validation', 'error-handling'],
      accessibility: 'implemented',
      validation: validation,
      submission: submission,
      designStyle: analysis.designStyle
    };
  }

  private async createLayout(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`Creating layout with ${analysis.designStyle} style: ${task.description}`);
    
    return {
      layout: task.description,
      componentsCreated: ['layout-component'],
      filesModified: ['layout.tsx', 'layout.module.css'],
      features: analysis.features,
      responsive: 'implemented',
      navigation: 'configured',
      designStyle: analysis.designStyle
    };
  }

  private async createHook(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`Creating custom hook: ${task.description}`);
    
    return {
      hook: task.description,
      componentsCreated: ['custom-hook'],
      filesModified: ['hook.ts', 'hook.test.ts'],
      features: analysis.features,
      documentation: 'generated',
      tests: 'created',
      performance: analysis.performance
    };
  }

  private async generalFrontendImplementation(task: TaskRequest, analysis: any, decisions: any[]): Promise<any> {
    this.log(`General frontend implementation with ${analysis.designStyle} style: ${task.description}`);
    
    return {
      implementation: task.description,
      componentsCreated: ['general-component'],
      filesModified: ['implementation.tsx'],
      features: analysis.features,
      styling: 'applied',
      designStyle: analysis.designStyle
    };
  }

  // Enhanced utility methods with design awareness
  async generateReactComponent(componentName: string, props: { name: string; type: string; required: boolean }[], designStyle: string): Promise<string> {
    const propTypes = props.map(prop => 
      `${prop.name}${prop.required ? '' : '?'}: ${prop.type}`
    ).join(';\n  ');

    const destructuredProps = props.map(prop => prop.name).join(', ');
    
    // Add design-specific styling
    const styleClass = designStyle.toLowerCase().replace(' ', '-');
    
    return `
import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  ${propTypes}
}

export const ${componentName}: React.FC<${componentName}Props> = ({ ${destructuredProps} }) => {
  return (
    <div className={\`\${styles.${componentName.toLowerCase()}} \${styles['${styleClass}']}\`}>
      {/* ${componentName} component with ${designStyle} styling */}
    </div>
  );
};
`;
  }

  async generateGlassMorphismStyles(componentName: string): Promise<string> {
    return `
.${componentName.toLowerCase()} {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.${componentName.toLowerCase()}:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
}
`;
  }

  async generateNeumorphismStyles(componentName: string): Promise<string> {
    return `
.${componentName.toLowerCase()} {
  background: #e0e5ec;
  border-radius: 20px;
  box-shadow: 
    20px 20px 60px #bec3c9,
    -20px -20px 60px #ffffff;
  padding: 20px;
  transition: all 0.3s ease;
}

.${componentName.toLowerCase()}:active {
  box-shadow: 
    inset 6px 6px 12px #bec3c9,
    inset -6px -6px 12px #ffffff;
}
`;
  }
}
