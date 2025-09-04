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

interface ProcessingStatusBarProps {
  steps: Record<ProcessingStep, ProcessingStepData>;
  className?: string;
  compact?: boolean;
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
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'processing':
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Icon className="w-5 h-5 text-gray-400" />;
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

export default function ProcessingStatusBar({ steps, className, compact = false }: ProcessingStatusBarProps) {
  const stepOrder: ProcessingStep[] = ['notes', 'analysis', 'chatbot'];
  
  if (compact) {
    // Show only current processing step in compact mode
    const currentStep = stepOrder.find(step => steps[step].status === 'processing') || 
                      stepOrder.find(step => steps[step].status === 'pending') ||
                      'notes';
    
    return (
      <div className={cn("flex items-center justify-between p-2 bg-gray-50 border rounded-lg", className)}>
        <ProcessingStep 
          step={currentStep}
          data={steps[currentStep]}
          config={STEP_CONFIG[currentStep]}
          compact={true}
        />
        
        {/* Overall Progress */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            {stepOrder.filter(step => steps[step].status === 'complete').length}/{stepOrder.length}
          </span>
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${(stepOrder.filter(step => steps[step].status === 'complete').length / stepOrder.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Processing Status</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            {stepOrder.filter(step => steps[step].status === 'complete').length}/{stepOrder.length} Complete
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {stepOrder.map((step, index) => (
          <div key={step} className="relative">
            <ProcessingStep 
              step={step}
              data={steps[step]}
              config={STEP_CONFIG[step]}
            />
            
            {/* Progress Line */}
            {index < stepOrder.length - 1 && (
              <div className="flex justify-center my-2">
                <div className={cn(
                  "w-px h-4 transition-colors duration-300",
                  steps[step].status === 'complete' ? "bg-green-300" : "bg-gray-300"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}