'use client';

import React from 'react';
import { TEMPLATES } from '../../lib/templates/index';

interface FormatCardsProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

export function FormatCards({ selectedTemplate, onTemplateChange }: FormatCardsProps) {
  // Use the same templates that are available in the free tier
  const availableFormats = TEMPLATES.filter(template => !template.isPremium).slice(0, 4);
  
  // Map templates to the format expected by the design
  const formatCards = availableFormats.map(template => ({
    id: template.id,
    icon: template.icon,
    name: template.name.replace(/\s+/g, ' '), // Clean up any extra spaces
    description: template.description
  }));

  return (
    <div className="format-grid grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[700px] mx-auto mb-10">
      {formatCards.map((format) => (
        <div
          key={format.id}
          onClick={() => onTemplateChange(format.id)} // Use the SAME function that was passed from VideoUpload
          className={`format-card bg-[var(--card-bg)] backdrop-blur-[20px] border-2 border-[var(--card-border)] rounded-xl p-6 cursor-pointer transition-all duration-300 text-center relative overflow-hidden hover:transform hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[var(--accent-pink)] ${
            selectedTemplate === format.id 
              ? 'selected border-[var(--accent-pink)] bg-[var(--accent-pink)] text-white' 
              : ''
          }`}
        >
          {/* Background gradient for selected state */}
          <div className={`absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] opacity-0 transition-opacity duration-300 ${
            selectedTemplate === format.id ? 'opacity-100' : ''
          }`}></div>
          
          <div className="format-icon text-4xl mb-2 relative z-10">
            {format.icon}
          </div>
          <div className={`format-name text-sm font-semibold relative z-10 ${
            selectedTemplate === format.id ? 'text-white' : 'text-[var(--text-primary)]'
          }`}>
            {format.name}
          </div>
        </div>
      ))}
    </div>
  );
}