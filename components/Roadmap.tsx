'use client';

import React, { useState } from 'react';

export const Roadmap: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const roadmapItems = [
    {
      phase: 'Phase 1',
      title: 'Pro Templates Launch',
      timeframe: 'Coming Soon',
      status: 'in-progress',
      description: 'Enhanced versions of current templates with more depth and advanced features',
      features: [
        '📊 Pro Basic Summary: Timeline analysis, critical insights, action items, and related topics',
        '📚 Pro Study Notes: Memory techniques, advanced questions, personalized study plans, and cross-references',
        '📊 Pro Presentation Slides: Advanced designs, data visualization suggestions, storytelling frameworks, and detailed speaker notes'
      ],
      color: 'purple'
    },
    {
      phase: 'Phase 2',
      title: 'New Content Formats',
      timeframe: 'Q2 2024',
      status: 'planned',
      description: 'Expanding beyond the current template offerings with new specialized formats',
      features: [
        '🔧 Tutorial Guides: Step-by-step instructions with troubleshooting and verification steps',
        '📄 Research Papers: Academic formatting with citations, methodology, and discussion sections',
        '🗺️ Mind Maps: Visual content organization with interactive connections and relationships',
        '📝 Quick Reference: Instant key points, summaries, and essential information extraction'
      ],
      color: 'blue'
    },
    {
      phase: 'Phase 3',
      title: 'Advanced Features',
      timeframe: 'Q3 2024',
      status: 'planned',
      description: 'Premium features and enhanced user experience with collaboration tools',
      features: [
        '👥 Team Collaboration: Share and collaborate on notes with real-time editing',
        '📱 Mobile App: Native iOS and Android applications with offline support',
        '🔗 API Access: Integrate with your own applications and workflows',
        '🎨 Custom Templates: Build your own content formats and share with teams'
      ],
      color: 'green'
    },
    {
      phase: 'Phase 4',
      title: 'Enterprise Solutions',
      timeframe: 'Q4 2024',
      status: 'planned',
      description: 'Professional and business-focused features for organizations',
      features: [
        '🏢 White-label Solutions: Custom branding and domain for organizations',
        '📊 Analytics Dashboard: Usage insights, performance metrics, and content analytics',
        '🔒 Advanced Security: SSO integration, audit logs, and compliance features',
        '🌐 Multi-language Support: Global accessibility with translation capabilities'
      ],
      color: 'orange'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'planned':
        return '📅';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-purple-500';
      case 'planned':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fadeInUp">
            Product Roadmap
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            See what we're building next and help shape the future of AI-powered content creation
          </p>
        </div>

        {/* Horizontal Roadmap */}
        <div className="relative">
          {/* Animated Dashed Arrows Line */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-30">
            <div className="h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.3)_20px,rgba(255,255,255,0.3)_30px)] animate-pulse"></div>
          </div>

          {/* Phases Container */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-4 items-center justify-between relative z-10">
            {roadmapItems.map((item, index) => (
              <div 
                key={index}
                className="relative flex-1 max-w-xs animate-fadeInUp"
                style={{animationDelay: `${0.4 + index * 0.1}s`}}
              >
                {/* Phase Cloud */}
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedPhase(selectedPhase === index ? null : index)}
                >
                  {/* Pink Cloud Background */}
                  <div className="bg-gradient-to-r from-pink-400/80 to-purple-400/80 backdrop-blur-lg border border-white/20 rounded-full px-6 py-4 text-center shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-pink-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        item.status === 'in-progress' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {getStatusIcon(item.status)}
                      </span>
                      <span className="text-xs text-white/80 font-medium">
                        {item.timeframe}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1">
                      {item.phase}
                    </h3>
                    <p className="text-sm text-white/90 font-medium">
                      {item.title}
                    </p>
                    
                    {/* Click Indicator */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100">
                      Click for details
                    </div>
                  </div>
                </div>

                {/* Arrow (only show between phases) */}
                {index < roadmapItems.length - 1 && (
                  <div className="hidden md:block absolute top-16 -right-2 w-8 h-8">
                    <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase Details Panel */}
        {selectedPhase !== null && (
          <div className="mt-12 animate-fadeInUp">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {roadmapItems[selectedPhase].phase}: {roadmapItems[selectedPhase].title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {roadmapItems[selectedPhase].description}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPhase(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Features List */}
              <div className="grid md:grid-cols-2 gap-4">
                {roadmapItems[selectedPhase].features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3 bg-white/5 rounded-lg p-4">
                    <span className="text-lg mt-0.5">•</span>
                    <span className="text-gray-300 text-sm leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Help Shape Our Roadmap
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              We're constantly listening to user feedback. Have a feature request or want to prioritize something specific? Let us know!
            </p>
            <button className="glass-button px-6 py-3 text-white font-semibold opacity-50 cursor-not-allowed" disabled>
              Submit Feature Request
              <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">SOON</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
