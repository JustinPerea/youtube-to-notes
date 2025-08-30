'use client';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

import { TEMPLATES } from '../lib/templates/index';

const templates = TEMPLATES.map(template => ({
  id: template.id,
  name: template.name,
  description: template.description,
  icon: template.icon,
  free: !template.isPremium,
  comingSoon: template.isPremium
}));

export function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Choose Your Output Format
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => !template.comingSoon && onTemplateChange(template.id)}
            className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-300 ${
              template.comingSoon
                ? 'cursor-not-allowed opacity-60'
                : selectedTemplate === template.id
                ? 'ring-2 ring-purple-400 bg-purple-500/20 cursor-pointer'
                : 'hover:bg-white/10 cursor-pointer'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{template.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  {!template.free && !template.comingSoon && (
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs rounded-full">
                      PRO
                    </span>
                  )}
                  {template.comingSoon && (
                    <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full">
                      COMING SOON
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 mt-1">{template.description}</p>
                {template.free && !template.comingSoon && (
                  <span className="inline-block mt-2 text-xs text-green-400">
                    ✓ Free tier available
                  </span>
                )}
                {template.comingSoon && (
                  <span className="inline-block mt-2 text-xs text-yellow-400">
                    🚧 Coming soon - {                            template.id === 'mindMap' ? 'Mind mapping for concept visualization' :
                            template.id === 'tutorial' ? 'Step-by-step guides with visual instructions' :
                                   template.id === 'research' ? 'Academic research papers and analysis' : 
                                   'Enhanced template features'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Upgrade to Pro for unlimited access to all templates</p>
      </div>
    </div>
  );
}
