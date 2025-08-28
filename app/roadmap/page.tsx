'use client';

import { Roadmap } from '../../components/Roadmap';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function RoadmapPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />
      
      {/* Roadmap Section */}
      <Roadmap />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
