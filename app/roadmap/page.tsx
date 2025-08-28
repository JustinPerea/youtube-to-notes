'use client';

import Roadmap from '../../components/Roadmap';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Development Roadmap
        </h1>
        <Roadmap />
      </div>
    </div>
  );
}
