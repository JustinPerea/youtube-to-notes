import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PresentationSlidesProps {
  content: string;
  videoUrl: string;
}

const PresentationSlides: React.FC<PresentationSlidesProps> = ({ content, videoUrl }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  
  // Parse the markdown content to extract slides
  const slides = (content || '').split(/\*\*Slide \d+:/).filter(slide => slide && typeof slide === 'string');
  
  // Extract speaker notes from the content
  const extractSpeakerNotes = () => {
    const speakerNotesMatch = content.match(/\*\*Speaker Notes Template:\*\*([\s\S]*?)(?=\*\*Design Guidelines:\*\*|$)/);
    return speakerNotesMatch ? speakerNotesMatch[1].trim() : '';
  };
  
  const speakerNotes = extractSpeakerNotes();
  
  // Process slide content and prepare for ReactMarkdown
  const processSlideContent = (slideContent: string) => {
    let processedContent = slideContent || '';
    
    // Ensure we have a string
    if (typeof processedContent !== 'string') {
      processedContent = String(processedContent || '');
    }
    
    return processedContent;
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  return (
    <div className="presentation-viewer">
      {/* Navigation Header */}
      <div className="presentation-nav">
        <div className="nav-left">
          <h2 className="text-xl font-bold text-white">Professional Presentation Slides</h2>
          <span className="text-sm text-gray-400">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        
        <div className="nav-center">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="nav-btn"
          >
            ← Previous
          </button>
          
          <span className="slide-indicator">
            {currentSlide + 1} / {slides.length}
          </span>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="nav-btn"
          >
            Next →
          </button>
        </div>
        
        <div className="nav-right">
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className="notes-toggle"
          >
            {showSpeakerNotes ? 'Hide' : 'Show'} Speaker Notes
          </button>
        </div>
      </div>

      {/* Main Presentation Area */}
      <div className="presentation-main">
        {/* Current Slide */}
        <div className="slide-container">
          <div className="slide">
            <div className="slide-header">
              <span className="slide-number">Slide {currentSlide + 1}</span>
              <span className="slide-timer">⏱️ ~{Math.round((currentSlide + 1) * 2)}min</span>
            </div>
            
            <div className="slide-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="slide-title">{children}</h1>,
                  h2: ({children}) => <h2 className="slide-subtitle">{children}</h2>,
                  h3: ({children}) => <h3 className="slide-heading">{children}</h3>,
                  p: ({children}) => <p className="slide-paragraph">{children}</p>,
                  ul: ({children}) => <ul className="slide-list">{children}</ul>,
                  ol: ({children}) => <ol className="slide-list">{children}</ol>,
                  li: ({children}) => <li className="slide-list-item">{children}</li>,
                  strong: ({children}) => <strong className="slide-emphasis">{children}</strong>,
                  em: ({children}) => <em className="slide-italic">{children}</em>,
                  code: ({children}) => <code className="slide-code">{children}</code>,
                  pre: ({children}) => <pre className="slide-code-block">{children}</pre>,
                  img: ({src, alt}) => {
                    if (!src) return null;
                    
                    return (
                      <div className="slide-screenshot-wrapper">
                        <img 
                          src={src} 
                          alt={alt || 'Image'} 
                          className="slide-screenshot"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  },
                }}
              >
                                    {typeof slides[currentSlide] === 'string' ? processSlideContent(slides[currentSlide]) : String(slides[currentSlide] || '')}
              </ReactMarkdown>
            </div>


          </div>
        </div>

        {/* Speaker Notes Panel */}
        {showSpeakerNotes && (
          <div className="speaker-notes-panel">
            <div className="notes-header">
              <h3>Speaker Notes</h3>
            </div>
            <div className="notes-content">
                           <ReactMarkdown
               remarkPlugins={[remarkGfm]}
               components={{
                 h1: ({children}) => <h1 className="notes-title">{children}</h1>,
                 h2: ({children}) => <h2 className="notes-subtitle">{children}</h2>,
                 h3: ({children}) => <h3 className="notes-heading">{children}</h3>,
                 p: ({children}) => <p className="notes-paragraph">{children}</p>,
                 ul: ({children}) => <ul className="notes-list">{children}</ul>,
                 ol: ({children}) => <ol className="notes-list">{children}</ol>,
                 li: ({children}) => <li className="notes-list-item">{children}</li>,
               }}
             >
               {typeof speakerNotes === 'string' ? speakerNotes : String(speakerNotes || '')}
             </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Slide Thumbnails */}
      <div className="slide-thumbnails">
        <h4 className="thumbnails-title">Slides</h4>
        <div className="thumbnails-grid">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`thumbnail ${currentSlide === index ? 'active' : ''}`}
            >
              <div className="thumbnail-header">
                <span className="thumbnail-number">{index + 1}</span>
                <span className="thumbnail-time">~{Math.round((index + 1) * 2)}min</span>
              </div>
              <div className="thumbnail-content">
                {slide.split('\n')[0].replace(/\*\*/g, '').substring(0, 30)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Design Guidelines */}
      <div className="design-guidelines">
        <h4>Design Guidelines</h4>
        <ul>
          <li>Typography: 36-44pt titles, 28-32pt subtitles, 24pt+ body text</li>
          <li>Layout: 12-column grid with 40px minimum margins</li>
          <li>Colors: High contrast (4.5:1 ratio) for accessibility</li>
          <li>White Space: 30-40% ratio to prevent visual overwhelm</li>
        </ul>
      </div>

      <style jsx>{`
        .presentation-viewer {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e3a8a 100%);
          overflow: hidden;
        }

        .presentation-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-left h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .nav-left span {
          font-size: 0.875rem;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slide-indicator {
          color: white;
          font-weight: 600;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
        }

        .notes-toggle {
          background: rgba(59, 130, 246, 0.8);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notes-toggle:hover {
          background: rgba(59, 130, 246, 1);
          transform: translateY(-1px);
        }

        .presentation-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .slide-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }

                 .slide {
           width: 900px;
           height: 600px;
           background: white;
           border-radius: 1rem;
           box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
           overflow: hidden;
           display: flex;
           flex-direction: column;
           position: relative;
         }

        .slide-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slide-number {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .slide-timer {
          font-size: 0.9rem;
          opacity: 0.9;
        }

                 .slide-content {
           flex: 1;
           padding: 2rem;
           overflow-y: auto;
           overflow-x: hidden;
           font-size: 0.9rem;
           line-height: 1.4;
           max-height: calc(100% - 80px); /* Account for header */
         }

        .slide-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }

        .slide-subtitle {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .slide-heading {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .slide-paragraph {
          margin-bottom: 0.75rem;
          color: #4b5563;
          font-size: 0.9rem;
        }

        .slide-list {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .slide-list-item {
          margin-bottom: 0.4rem;
          color: #4b5563;
          font-size: 0.85rem;
        }

        .slide-emphasis {
          font-weight: 600;
          color: #1f2937;
        }

        .slide-italic {
          font-style: italic;
        }

        .slide-code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
        }

                 .slide-code-block {
           background: #f3f4f6;
           padding: 1rem;
           border-radius: 0.5rem;
           overflow-x: auto;
           margin: 1rem 0;
           font-family: 'Monaco', 'Menlo', monospace;
           font-size: 0.875rem;
         }

         /* Mathematical expression styling */
         .slide-paragraph em,
         .notes-paragraph em {
           font-style: italic;
           font-family: 'Times New Roman', serif;
         }

         .slide-paragraph em em {
           font-style: normal;
         }

         /* Formula styling */
         .slide-paragraph strong,
         .notes-paragraph strong {
           font-weight: 600;
           color: #1f2937;
         }

         /* Inline math-like expressions */
         .slide-paragraph code,
         .notes-paragraph code {
           background: #f8fafc;
           padding: 0.125rem 0.25rem;
           border-radius: 0.25rem;
           font-family: 'Courier New', monospace;
           font-size: 0.875rem;
           color: #dc2626;
         }

                 .slide-screenshot-wrapper {
           margin: 1rem 0;
           border-radius: 0.5rem;
           overflow: hidden;
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
         }

         .screenshot-placeholder {
           background: #f7fafc;
           border: 2px dashed #cbd5e0;
           border-radius: 8px;
           padding: 2rem;
           text-align: center;
           margin: 1rem 0;
         }

         .screenshot-placeholder.hidden {
           display: none;
         }

         .placeholder-icon {
           font-size: 2rem;
           margin-bottom: 0.5rem;
         }

         .placeholder-text {
           color: #718096;
           font-size: 0.9rem;
         }

        .slide-screenshot {
          width: 100%;
          height: auto;
          display: block;
        }

        .screenshot-caption {
          background: #f7fafc;
          padding: 0.5rem;
          font-size: 0.8rem;
          color: #4a5568;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }

        .slide-screenshot-info {
          padding: 1rem;
          background: #f7fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #4a5568;
        }

        .speaker-notes-panel {
          width: 350px;
          background: rgba(0, 0, 0, 0.9);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
        }

        .notes-header {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .notes-header h3 {
          color: white;
          margin: 0;
          font-size: 1.1rem;
        }

        .notes-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          color: #e5e7eb;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .notes-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: white;
          margin-bottom: 0.75rem;
        }

        .notes-subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 0.5rem;
        }

        .notes-heading {
          font-size: 1rem;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 0.5rem;
        }

        .notes-paragraph {
          margin-bottom: 0.75rem;
        }

        .notes-list {
          margin-bottom: 0.75rem;
          padding-left: 1rem;
        }

        .notes-list-item {
          margin-bottom: 0.25rem;
        }

        .slide-thumbnails {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 150px;
          overflow-x: auto;
        }

        .thumbnails-title {
          color: white;
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .thumbnails-grid {
          display: flex;
          gap: 0.5rem;
          padding: 0 0.5rem;
        }

        .thumbnail {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid transparent;
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          text-align: left;
        }

        .thumbnail:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .thumbnail.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.2);
        }

        .thumbnail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .thumbnail-number {
          color: white;
          font-weight: bold;
          font-size: 0.75rem;
        }

        .thumbnail-time {
          color: #9ca3af;
          font-size: 0.625rem;
        }

        .thumbnail-content {
          color: #d1d5db;
          font-size: 0.625rem;
          line-height: 1.2;
        }

        .design-guidelines {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 1rem;
          border-radius: 0.5rem;
          color: white;
          max-width: 250px;
          font-size: 0.75rem;
        }

        .design-guidelines h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #3b82f6;
        }

        .design-guidelines ul {
          margin: 0;
          padding-left: 1rem;
        }

        .design-guidelines li {
          margin-bottom: 0.25rem;
          color: #e5e7eb;
        }

        @media (max-width: 768px) {
          .slide {
            width: 100%;
            height: auto;
            min-height: 400px;
          }
          
          .speaker-notes-panel {
            width: 100%;
            height: 300px;
          }
          
          .presentation-main {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default PresentationSlides;
