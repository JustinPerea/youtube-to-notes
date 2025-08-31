'use client';

import Roadmap from '../../components/Roadmap';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] text-center mb-8">
          Development Roadmap
        </h1>
        <Roadmap />
      </div>
    </div>
  );
}
