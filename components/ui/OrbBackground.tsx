'use client';

import React from 'react';

export function OrbBackground() {
  return (
    <div className="orb-container fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="orb orb-4"></div>
      <div className="orb orb-5"></div>
      
      <style jsx>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: var(--orb-opacity, 0.4);
          animation: float 20s infinite ease-in-out;
          transition: opacity 0.3s ease;
        }

        [data-theme="dark"] .orb {
          filter: blur(60px);
          opacity: var(--orb-opacity-dark, 0.6);
        }
        
        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--orb-1, rgba(247, 202, 201, 0.3)) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          animation-duration: 25s;
        }
        
        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--orb-2, rgba(230, 230, 250, 0.3)) 0%, transparent 70%);
          top: 20%;
          right: -100px;
          animation-duration: 30s;
          animation-delay: -5s;
        }
        
        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, var(--orb-3, rgba(255, 182, 193, 0.25)) 0%, transparent 70%);
          bottom: -100px;
          left: 30%;
          animation-duration: 28s;
          animation-delay: -10s;
        }
        
        .orb-4 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, var(--orb-4, rgba(255, 218, 185, 0.2)) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-duration: 35s;
          animation-delay: -15s;
        }
        
        .orb-5 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, var(--orb-5, rgba(221, 160, 221, 0.2)) 0%, transparent 70%);
          bottom: 20%;
          right: 10%;
          animation-duration: 32s;
          animation-delay: -20s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -40px) scale(1.05);
          }
          50% {
            transform: translate(-20px, 30px) scale(0.95);
          }
          75% {
            transform: translate(40px, 20px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}