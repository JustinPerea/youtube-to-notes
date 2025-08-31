'use client';
import React from 'react';

interface Phase {
  id: string;
  title: string;
  description: string;
  features: string[];
  status: 'completed' | 'in-progress' | 'planned' | 'coming-soon';
  color: string;
}

const phases: Phase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core MVP',
    description: 'Basic video processing and note generation',
    features: [
      'YouTube video URL processing',
      'Basic summary generation',
      'Study notes template',
      'Presentation slides template',
      'Responsive web interface'
    ],
    status: 'completed',
    color: 'completed'
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Enhanced Features',
    description: 'Advanced templates and user experience',
    features: [
      'Mind map generation',
      'Quick reference panels',
      'Custom templates',
      'Export functionality',
      'User accounts',
      'Verbosity controls'
    ],
    status: 'in-progress',
    color: 'in-progress'
  },
  {
    id: 'phase-3',
    title: 'Phase 3: AI Chat & Pro Features',
    description: 'AI-powered Q&A and advanced capabilities',
    features: [
      'AI Chat Bot for video Q&A (Pro)',
      'Video transcript generation',
      'Source attribution system',
      'Timestamp linking',
      'Chat history & export',
      'Content-aware note generation'
    ],
    status: 'planned',
    color: 'planned'
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Enterprise Features',
    description: 'Professional and team collaboration tools',
    features: [
      'Team workspaces',
      'Advanced analytics',
      'API integrations',
      'Custom branding',
      'Enterprise security'
    ],
    status: 'coming-soon',
    color: 'coming-soon'
  }
];

// Helper function to get theme-aware styling for each phase status
const getPhaseStyles = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        cardStyle: 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30',
        statusColor: 'text-green-400',
        accentColor: 'border-green-500/50'
      };
    case 'in-progress':
      return {
        cardStyle: 'bg-gradient-to-br from-[var(--accent-pink)]/20 to-[var(--accent-pink)]/30 border-[var(--accent-pink)]/30',
        statusColor: 'text-[var(--accent-pink)]',
        accentColor: 'border-[var(--accent-pink)]/50'
      };
    case 'planned':
      return {
        cardStyle: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30',
        statusColor: 'text-purple-400',
        accentColor: 'border-purple-500/50'
      };
    case 'coming-soon':
      return {
        cardStyle: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30',
        statusColor: 'text-orange-400',
        accentColor: 'border-orange-500/50'
      };
    default:
      return {
        cardStyle: 'bg-[var(--card-bg)] border-[var(--card-border)]',
        statusColor: 'text-[var(--text-secondary)]',
        accentColor: 'border-[var(--card-border)]'
      };
  }
};

export default function Roadmap() {
  return (
    <div className="relative overflow-x-auto pb-4">
      <div className="flex space-x-6 md:space-x-8 min-w-max p-4 md:p-8">
        {phases.map((phase, index) => {
          const styles = getPhaseStyles(phase.status);
          
          return (
            <div key={phase.id} className="flex flex-col items-center">
              {/* Phase Card */}
              <div 
                className={`${styles.cardStyle} backdrop-blur-md border rounded-2xl p-4 md:p-6 w-72 md:w-80 shadow-[var(--card-shadow)] transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
                style={{ minHeight: '280px' }}
              >
                <div>
                  <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{phase.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{phase.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {phase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start text-sm">
                        <span className="mr-2 text-[var(--accent-pink)] mt-1 flex-shrink-0">•</span>
                        <span className="text-[var(--text-primary)]">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`mt-4 pt-4 border-t ${styles.accentColor}`}>
                    <span className={`text-xs uppercase tracking-wide font-semibold ${styles.statusColor}`}>
                      {phase.status === 'completed' && '✅ Completed'}
                      {phase.status === 'in-progress' && '🔄 In Progress'}
                      {phase.status === 'planned' && '📋 Planned'}
                      {phase.status === 'coming-soon' && '🚀 Coming Soon'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Connection Line (except for last phase) */}
              {index < phases.length - 1 && (
                <div className="mt-6 flex items-center">
                  <div className="w-16 h-0.5 bg-[var(--card-border)]"></div>
                  <div className="w-3 h-3 bg-[var(--accent-pink)] rounded-full -ml-1.5 border-2 border-[var(--bg-primary)]"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
