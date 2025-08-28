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
    color: 'bg-green-500'
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
      'User accounts'
    ],
    status: 'in-progress',
    color: 'bg-blue-500'
  },
  {
    id: 'phase-3',
    title: 'Phase 3: AI Optimization',
    description: 'Advanced AI capabilities and personalization',
    features: [
      'Content-aware note generation',
      'Learning style adaptation',
      'Smart summarization',
      'Multi-language support',
      'Voice-to-text integration'
    ],
    status: 'planned',
    color: 'bg-purple-500'
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
    color: 'bg-orange-500'
  }
];

export default function Roadmap() {
  return (
    <div className="relative overflow-x-auto">
      <div className="flex space-x-8 min-w-max p-8">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex flex-col items-center">
            {/* Phase Card */}
            <div 
              className={`${phase.color} rounded-lg p-6 w-80 shadow-lg transform transition-transform duration-300 hover:scale-105 cursor-pointer`}
              style={{ minHeight: '200px' }}
            >
              <div className="text-white">
                <h3 className="text-xl font-bold mb-2">{phase.title}</h3>
                <p className="text-sm opacity-90 mb-4">{phase.description}</p>
                
                <div className="space-y-2">
                  {phase.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm">
                      <span className="mr-2">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/20">
                  <span className="text-xs uppercase tracking-wide opacity-75">
                    {phase.status === 'completed' && '✅ Completed'}
                    {phase.status === 'in-progress' && '🔄 In Progress'}
                    {phase.status === 'planned' && '📋 Planned'}
                    {phase.status === 'coming-soon' && '🚀 Coming Soon'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Arrow (except for last phase) */}
            {index < phases.length - 1 && (
              <div className="mt-4 flex items-center">
                <div className="w-16 h-0.5 bg-gray-400"></div>
                <div className="w-4 h-4 bg-gray-400 rounded-full -ml-2"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
