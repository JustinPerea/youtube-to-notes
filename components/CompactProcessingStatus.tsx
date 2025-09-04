'use client';

import React from 'react';

export interface CompactProcessingStep {
  key: 'notes' | 'analysis' | 'chatbot';
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  icon: string;
}

export interface CompactProcessingStatusProps {
  steps: CompactProcessingStep[];
  className?: string;
}

export const CompactProcessingStatus: React.FC<CompactProcessingStatusProps> = ({
  steps,
  className = ""
}) => {
  const getStatusIcon = (step: CompactProcessingStep) => {
    switch (step.status) {
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-[var(--card-border)] border-2 border-[var(--text-muted)] opacity-50"></div>
        );
    }
  };

  const getStatusText = (status: CompactProcessingStep['status']) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 font-medium';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
      default:
        return 'text-[var(--text-muted)] opacity-50';
    }
  };

  const processingStep = steps.find(step => step.status === 'processing');
  const completedCount = steps.filter(step => step.status === 'complete').length;

  return (
    <div className={`compact-processing-status bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl p-6 ${className}`}>
      {/* Current Status Header */}
      {processingStep && (
        <div className="text-center mb-4">
          <div className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {processingStep.icon} {processingStep.label}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Please wait while we process your video...
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Status Icon */}
              {getStatusIcon(step)}
              
              {/* Label */}
              <div className={`mt-2 text-xs text-center ${getStatusText(step.status)}`}>
                <div className="font-medium">{step.icon}</div>
                <div className="max-w-[80px] leading-tight">{step.label}</div>
              </div>
            </div>
            
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                steps[index + 1].status === 'complete' || steps[index + 1].status === 'processing'
                  ? 'bg-green-300' 
                  : 'bg-[var(--card-border)]'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 text-center">
        <div className="text-xs text-[var(--text-secondary)]">
          {completedCount} of {steps.length} steps complete
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-2 w-full bg-[var(--card-border)] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompactProcessingStatus;