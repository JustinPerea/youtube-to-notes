'use client';

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    description: 'Advanced AI understands video content and creates intelligent summaries, notes, and guides.',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Process videos up to 6 hours long in minutes, not hours.',
    color: 'from-green-400 to-emerald-400'
  },
  {
    icon: '🎯',
    title: 'Multiple Formats',
    description: 'Generate summaries, study notes, presentations, tutorials, and more.',
    color: 'from-purple-400 to-pink-400'
  },
  {
    icon: '📱',
    title: 'Mobile Optimized',
    description: 'Works perfectly on all devices - upload videos from anywhere.',
    color: 'from-orange-400 to-red-400'
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    description: 'Your video content is processed securely and never stored permanently.',
    color: 'from-indigo-400 to-purple-400'
  },
  {
    icon: '💡',
    title: 'Smart Templates',
    description: 'Choose from specialized templates for different use cases and learning styles.',
    color: 'from-yellow-400 to-orange-400'
  }
];

export function FeatureSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose YouTube to Notes?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform the way you learn and create content with AI-powered video processing
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center animate-fadeInUp"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-16">
                      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Transform Your Videos?
            </h3>
            <p className="text-gray-300 mb-6">
              Start converting YouTube videos into smart content today. Free tier includes 3 videos per month.
            </p>
                          <button className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-8 py-4 text-white font-semibold text-lg transition-all duration-300 opacity-50 cursor-not-allowed relative" disabled>
              Start Free Trial
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">COMING SOON</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
