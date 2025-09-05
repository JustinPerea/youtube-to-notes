'use client';

/**
 * Progressive Processing Status Bar
 * Shows user-friendly processing steps with immediate value delivery
 */

import React from 'react';
import { CheckCircle, Clock, XCircle, FileText, Brain, MessageCircle, Download, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProcessingStep = 'notes' | 'analysis' | 'chatbot';
type StepStatus = 'pending' | 'processing' | 'complete' | 'error';

interface ProcessingStepData {
  status: StepStatus;
  message?: string;
  features?: string[];
  error?: string;
}

export interface ProcessingStep {
  key: string;
  label: string;
  status: string;
  description: string;
  enabledFeatures?: string[];
}

interface ProcessingStatusBarProps {
  steps: ProcessingStep[] | Record<ProcessingStep, ProcessingStepData>;
  className?: string;
  compact?: boolean;
  onFeatureClick?: (step: ProcessingStep) => void;
}

const STEP_CONFIG = {
  notes: {
    icon: FileText,
    title: 'Your Notes',
    messages: {
      pending: 'Waiting to process...',
      processing: 'Converting video to structured notes...',
      complete: 'Notes generated successfully! Read, download, or adjust detail level.',
      error: 'Note generation failed'
    },
    features: {
      pending: [],
      processing: [],
      complete: ['Read Notes', 'Download PDF', 'Adjust Detail Level'],
      error: []
    }
  },
  analysis: {
    icon: Brain,
    title: 'Enhanced Features',
    messages: {
      pending: 'Preparing enhanced features...',
      processing: 'Analyzing video for deeper insights...',
      complete: 'Enhanced analysis complete! More features available.',
      error: 'Enhanced features unavailable'
    },
    features: {
      pending: [],
      processing: [],
      complete: ['Detailed Analysis', 'Concept Mapping', 'Key Timestamps'],
      error: []
    }
  },
  chatbot: {
    icon: MessageCircle,
    title: 'AI Assistant',
    messages: {
      pending: 'AI assistant will be activated...',
      processing: 'Preparing AI assistant...',
      complete: 'AI assistant ready! Ask questions about your video content.',
      error: 'AI assistant unavailable'
    },
    features: {
      pending: [],
      processing: [],
      complete: ['Ask Questions', 'Get Insights', 'Explore Topics'],
      error: []
    }
  }
};

const StatusIcon: React.FC<{ status: StepStatus; icon: React.ComponentType<any> }> = ({ status, icon: Icon }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-[var(--accent-pink)]" />;
    case 'processing':
      return <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent-pink)] border-t-transparent" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Icon className="w-5 h-5 text-[var(--text-secondary)] opacity-50" />;
  }
};

const FeatureTag: React.FC<{ feature: string; available: boolean }> = ({ feature, available }) => (
  <span 
    className={cn(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
      available 
        ? "bg-green-100 text-green-800 border border-green-200" 
        : "bg-gray-100 text-gray-600 border border-gray-200"
    )}
  >
    {available && <CheckCircle className="w-3 h-3 mr-1" />}
    {feature}
  </span>
);

const ProcessingStep: React.FC<{
  step: ProcessingStep;
  data: ProcessingStepData;
  config: typeof STEP_CONFIG[keyof typeof STEP_CONFIG];
  compact?: boolean;
}> = ({ step, data, config, compact = false }) => {
  const Icon = config.icon;
  const message = data.message || config.messages[data.status];
  const features = data.features || config.features[data.status];

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <StatusIcon status={data.status} icon={Icon} />
        <span className="text-sm text-gray-700">{config.title}</span>
        {data.status === 'processing' && (
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg transition-all duration-300",
      data.status === 'complete' && "border-green-200 bg-green-50",
      data.status === 'processing' && "border-blue-200 bg-blue-50",
      data.status === 'error' && "border-red-200 bg-red-50",
      data.status === 'pending' && "border-gray-200 bg-gray-50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <StatusIcon status={data.status} icon={Icon} />
          <h3 className="font-medium text-gray-900">{config.title}</h3>
        </div>
        
        {data.status === 'processing' && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Message */}
      <p className={cn(
        "text-sm mb-3",
        data.status === 'complete' && "text-green-700",
        data.status === 'processing' && "text-blue-700",
        data.status === 'error' && "text-red-700",
        data.status === 'pending' && "text-gray-600"
      )}>
        {message}
      </p>

      {/* Error Details */}
      {data.status === 'error' && data.error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          {data.error}
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {features.map((feature, idx) => (
            <FeatureTag 
              key={idx} 
              feature={feature} 
              available={data.status === 'complete'} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProcessingStatusBar({ steps, className, compact = false, onFeatureClick }: ProcessingStatusBarProps) {
  // Handle both array and object-based steps
  const stepArray = Array.isArray(steps) ? steps : Object.entries(steps).map(([key, stepData]) => {
    // Convert record-based steps to array format with proper labels
    const stepConfig = STEP_CONFIG[key as keyof typeof STEP_CONFIG];
    if (!stepConfig) return null;
    
    return {
      key,
      label: stepConfig.title,
      description: stepData.message || stepConfig.messages[stepData.status],
      status: stepData.status,
      enabledFeatures: stepConfig.features[stepData.status] || []
    };
  }).filter(Boolean);
  
  // Only filter out completely invalid steps (null/undefined)
  const validSteps = stepArray.filter(step => step && step.status);
  
  if (compact) {
    // Show only current processing step in compact mode
    const currentStep = validSteps.find(step => step.status === 'processing') || 
                       validSteps.find(step => step.status === 'pending') ||
                       validSteps[0];
    
    if (!currentStep) return null;
    
    return (
      <div className={cn("flex items-center justify-between p-3 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl shadow-[var(--card-shadow)]", className)}>
        <div className="flex items-center space-x-3">
          <StatusIcon status={currentStep.status as StepStatus} icon={FileText} />
          <span className="text-sm text-[var(--text-primary)] font-medium">{currentStep.label}</span>
          {currentStep.status === 'processing' && (
            <div className="w-16 h-1.5 bg-[var(--accent-pink-soft)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-pink)] rounded-full animate-pulse w-2/3"></div>
            </div>
          )}
        </div>
        
        {/* Overall Progress */}
        <div className="flex items-center space-x-3 text-sm text-[var(--text-secondary)]">
          <span className="font-medium">
            {validSteps.filter(step => step.status === 'complete').length}/{validSteps.length}
          </span>
          <div className="w-12 h-1.5 bg-[var(--accent-pink-soft)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-pink)] rounded-full transition-all duration-300"
              style={{ 
                width: `${(validSteps.filter(step => step.status === 'complete').length / validSteps.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Features Available</h4>
        <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
          <span className="font-medium">
            {validSteps.filter(step => step.status === 'complete').length}/{validSteps.length} Complete
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {validSteps.map((step, index) => (
          <div key={step.key || `step-${index}`} className="relative">
            <div className={cn(
              "p-4 backdrop-blur-md border border-[var(--card-border)] rounded-xl transition-all duration-300 hover:transform hover:translate-y-[-1px] shadow-[var(--card-shadow)]",
              step.status === 'complete' && "border-green-200 bg-green-50 text-green-800",
              step.status === 'processing' && "border-[var(--accent-pink)]/50 bg-[var(--accent-pink-soft)] text-[var(--text-primary)]", 
              step.status === 'error' && "border-red-300 bg-red-50 text-red-900",
              step.status === 'pending' && "bg-[var(--card-bg)] text-[var(--text-primary)] opacity-75 hover:opacity-100",
              onFeatureClick && "cursor-pointer"
            )}
            onClick={() => onFeatureClick?.(step)}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={step.status as StepStatus} icon={getStepIcon(step.key)} />
                  <h3 className={cn(
                    "font-medium",
                    step.key === 'analysis' ? "text-sm" : "text-base"
                  )}>{step.label}</h3>
                </div>
                
                {step.status === 'processing' && (
                  <div className="flex items-center space-x-2 text-sm text-[var(--accent-pink)]">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-[var(--accent-pink)] border-t-transparent"></div>
                    <span className="font-medium">Processing...</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm mb-3 leading-relaxed">
                {step.description}
              </p>

              {/* Features */}
              {step.enabledFeatures && step.enabledFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.enabledFeatures.map((feature, idx) => (
                    <span 
                      key={idx}
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                        step.status === 'complete' 
                          ? "bg-green-100 text-green-800 border border-green-200" 
                          : "bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"
                      )}
                    >
                      {step.status === 'complete' && <CheckCircle className="w-3 h-3 mr-1 text-green-600" />}
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Progress Line */}
            {index < validSteps.length - 1 && (
              <div className="flex justify-center my-2">
                <div className={cn(
                  "w-px h-4 transition-colors duration-300",
                  step.status === 'complete' ? "bg-[var(--accent-pink)]/50" : "bg-[var(--card-border)]"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStepIcon(key: string) {
  switch (key) {
    case 'notes': return FileText;
    case 'analysis': return Brain;
    case 'chatbot': return MessageCircle;
    default: return FileText;
  }
}