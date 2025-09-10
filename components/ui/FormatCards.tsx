'use client';

import React from 'react';
import { TEMPLATES } from '../../lib/templates/index';
import { useSubscription } from '../../hooks/useSubscription';

interface FormatCardsProps {
  selectedTemplates: string[];
  onTemplateToggle: (template: string) => void;
}

export function FormatCards({ selectedTemplates, onTemplateToggle }: FormatCardsProps) {
  const { tier, isPro } = useSubscription();
  
  // Show templates based on user's subscription tier
  const availableFormats = TEMPLATES.filter(template => {
    // Show free templates to everyone
    if (!template.isPremium) return true;
    // Show premium templates only to Pro users
    return isPro;
  }).slice(0, 5); // Allow up to 5 templates now (including premium)
  
  // Map templates to the format expected by the design
  const formatCards = availableFormats.map(template => ({
    id: template.id,
    icon: template.icon,
    name: template.name.replace(/\s+/g, ' '), // Clean up any extra spaces
    description: template.description
  }));

  return (
    <div className="format-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-[900px] mx-auto mb-10">
      {formatCards.map((format) => (
        <div
          key={format.id}
          onClick={() => onTemplateToggle(format.id)}
          className={`format-card bg-[var(--card-bg)] backdrop-blur-[20px] border-2 border-[var(--card-border)] rounded-xl p-6 cursor-pointer transition-all duration-300 text-center relative overflow-hidden hover:transform hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[var(--accent-pink)] ${
            selectedTemplates.includes(format.id) 
              ? 'selected border-[var(--accent-pink)] bg-[var(--accent-pink)] text-white' 
              : ''
          }`}
        >
          {/* Background gradient for selected state */}
          <div className={`absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] opacity-0 transition-opacity duration-300 ${
            selectedTemplates.includes(format.id) ? 'opacity-100' : ''
          }`}></div>
          
          {/* Checkbox indicator for selected templates */}
          {selectedTemplates.includes(format.id) && (
            <div className="absolute top-2 right-2 z-20">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="format-icon text-4xl mb-2 relative z-10">
            {format.icon}
          </div>
          <div className={`format-name text-sm font-semibold relative z-10 ${
            selectedTemplates.includes(format.id) ? 'text-white' : 'text-[var(--text-primary)]'
          }`}>
            {format.name}
          </div>
        </div>
      ))}
    </div>
  );
}