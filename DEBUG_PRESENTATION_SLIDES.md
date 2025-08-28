# Presentation Slides Text Cutoff Issue - Debug Document

## 🎯 **Problem Statement**
The presentation slides component is cutting off text, specifically the title "Presentation Slides: How to Design Effective Paywalls for Apps" is not displaying completely. The text appears to be truncated or cut off at the edges of the slide content area.

## 📋 **Current File Structure**
```
components/PresentationSlides.tsx - Main component with text cutoff issue
lib/templates/index.ts - Template definitions for presentation slides
app/api/videos/process/route.ts - API route that processes video content
```

## 🔍 **Issue Details**

### **Symptoms:**
- Text is cut off horizontally within the slide content area
- Title text "Presentation Slides: How to Design Effective Paywalls for Apps" is truncated
- Content appears to overflow the slide boundaries
- Slide 1 content is visible but incomplete

### **Expected Behavior:**
- All text should be fully visible within the slide content area
- Long titles should wrap properly to multiple lines
- Content should fit within the slide dimensions
- No horizontal or vertical cutoff

## 🛠️ **Attempted Solutions**

### **Solution 1: CSS Styling Adjustments**
- Added `max-width: 100%` to all text elements
- Added `overflow-wrap: break-word` and `word-break: break-word`
- Added `hyphens: auto` for automatic hyphenation
- Increased slide dimensions from 800x600 to 900x650

### **Solution 2: Overflow Control**
- Changed `overflow: hidden` to `overflow-y: auto` and `overflow-x: hidden`
- Allowed vertical scrolling while preventing horizontal overflow
- Increased padding from 1.5rem to 2rem

### **Solution 3: Font Size and Line Height**
- Increased title font size from 1.2rem to 1.4rem
- Improved line height from 1.1 to 1.2
- Added comprehensive text wrapping properties

### **Solution 4: Container Optimization**
- Reduced container padding from 1rem to 0.5rem
- Adjusted slide container dimensions
- Modified flex properties for better content distribution

## 📄 **Current Code**

### **components/PresentationSlides.tsx**
```typescript
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
  const allSlides = (content || '').split(/## Slide \d+:/);
  
  // Filter out empty slides and ensure we have content
  const slides = allSlides
    .filter(slide => slide && typeof slide === 'string' && slide.trim().length > 0)
    .map(slide => slide.trim());
  
  // Extract speaker notes from the content
  const extractSpeakerNotes = () => {
    const speakerNotesMatch = content.match(/\*\*Speaker Notes:\*\*([\s\S]*?)(?=$)/);
    return speakerNotesMatch ? speakerNotesMatch[1].trim() : 'Speaker notes will be generated with each slide.';
  };
  
  const speakerNotes = extractSpeakerNotes();
  
  // Process slide content and prepare for ReactMarkdown
  const processSlideContent = (slideContent: string) => {
    let processedContent = slideContent || '';
    
    // Ensure we have a string
    if (typeof processedContent !== 'string') {
      processedContent = String(processedContent || '');
    }
    
    // Clean up any leftover separator lines
    processedContent = processedContent.replace(/^---\s*$/gm, '');
    
    // Format bullet points properly
    processedContent = processedContent.replace(/^- /gm, '• ');
    
    // Ensure proper line breaks for better readability
    processedContent = processedContent.replace(/\n\*\*/g, '\n\n**');
    
    return processedContent.trim();
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
                {slide.split('\n').slice(0, 2).join(' ').replace(/\*\*/g, '').substring(0, 40)}...
              </div>
            </button>
          ))}
        </div>
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
          padding: 0.5rem;
        }

        .slide {
          width: 900px;
          height: 650px;
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
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
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
          font-size: 0.75rem;
          line-height: 1.2;
          color: #1f2937;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .slide-content * {
          max-width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }

        .slide-title {
          font-size: 1.4rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1rem;
          line-height: 1.3;
          text-align: center;
          width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }

        .slide-subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .slide-heading {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .slide-paragraph {
          margin-bottom: 0.5rem;
          color: #4b5563;
          font-size: 0.7rem;
          line-height: 1.1;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          text-align: left;
          hyphens: auto;
        }

        .slide-list {
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
        }

        .slide-list-item {
          margin-bottom: 0.4rem;
          color: #4b5563;
          font-size: 0.65rem;
          line-height: 1.1;
          padding-left: 0.5rem;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          text-align: left;
          hyphens: auto;
        }

        .slide-emphasis {
          font-weight: 600;
          color: #1f2937;
          max-width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
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

        .slide-screenshot-wrapper {
          margin: 1rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .slide-screenshot {
          width: 100%;
          height: auto;
          display: block;
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
```

### **lib/templates/index.ts (Relevant Section)**
```typescript
// Presentation Slides Template
{
  id: 'presentation-slides',
  name: 'Presentation Slides',
  description: 'Professional presentation slides with speaker notes',
  prompt: `Create professional presentation slides for this video content. Structure the content into 8 clear slides with meaningful content.

SLIDE STRUCTURE:
## Slide 1: Title Slide
## Slide 2: Problem Statement
## Slide 3: Key Concepts Overview
## Slide 4: Strategy 1 Details
## Slide 5: Strategy 2 Details
## Slide 6: Strategy 3 Details
## Slide 7: Implementation Guide
## Slide 8: Summary & Action Plan

REQUIREMENTS:
- Each slide should have clear, actionable content
- Use bullet points and structured formatting
- Keep text concise but informative
- Include relevant examples and explanations
- Focus on the most important concepts from the video

**Speaker Notes:** Provide detailed speaker notes for each slide that expand on the bullet points and provide additional context for the presenter.`
}
```

## 🔧 **Technical Context**

### **Framework & Dependencies:**
- Next.js 14.0.4
- React 18
- ReactMarkdown with remarkGfm plugin
- Styled JSX for CSS-in-JS
- TypeScript

### **Browser Compatibility:**
- Modern browsers with CSS Grid and Flexbox support
- Mobile responsive design considerations

### **Content Generation:**
- Content is generated by Gemini AI API
- Markdown format is parsed and rendered
- Slide parsing uses regex pattern `/## Slide \d+:/`

## 🎯 **Desired Outcome**
The presentation slides should display all text content completely within the slide boundaries, with proper text wrapping and no cutoff. The title "Presentation Slides: How to Design Effective Paywalls for Apps" should be fully visible and readable.

## 🔍 **Debugging Questions for Claude Desktop**
1. What is causing the text cutoff despite all the CSS text-wrapping properties?
2. Are there any CSS conflicts or specificity issues?
3. Is the slide container sizing appropriate for the content?
4. Should we use a different approach for text rendering or layout?
5. Are there any browser-specific issues we should consider?
6. Is the ReactMarkdown component handling the text rendering correctly?
7. Should we implement a different text scaling or wrapping strategy?
