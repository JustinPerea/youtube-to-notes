import React, { useState, useMemo, CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PresentationSlidesProps {
  content: string;
  videoUrl: string;
}

// Define inline styles with proper text handling
const styles: Record<string, CSSProperties> = {
  presentationViewer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e3a8a 100%)',
    overflow: 'hidden',
  },
  presentationNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0,
  },
  navTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: 'white',
  },
  navSubtitle: {
    fontSize: '0.875rem',
    color: '#9ca3af',
  },
  navCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  slideIndicator: {
    color: 'white',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
  },
  notesToggle: {
    background: 'rgba(59, 130, 246, 0.8)',
    border: 'none',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  presentationMain: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  slideContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    minWidth: 0,
  },
  slide: {
    width: '100%',
    maxWidth: '900px',
    height: '100%',
    maxHeight: '650px',
    background: 'white',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  slideHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  slideContent: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#1f2937',
    minHeight: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  // Text element styles with proper wrapping
  slideTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1.5rem',
    lineHeight: 1.3,
    textAlign: 'center' as const,
    width: '100%',
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'normal' as const,
    display: 'block',
    padding: '0 1rem',
    boxSizing: 'border-box' as const,
  },
  slideText: {
    width: '100%',
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'normal' as const,
    padding: '0 0.5rem',
    boxSizing: 'border-box' as const,
  },
  speakerNotesPanel: {
    width: '350px',
    background: 'rgba(0, 0, 0, 0.9)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  notesHeader: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  notesContent: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    color: '#e5e7eb',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  slideThumbnails: {
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    padding: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    maxHeight: '150px',
    overflowX: 'auto',
    flexShrink: 0,
  },
  thumbnailsGrid: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0 0.5rem',
  },
  thumbnail: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid transparent',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
    maxWidth: '120px',
    textAlign: 'left' as const,
    color: 'white',
  },
  thumbnailActive: {
    borderColor: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.2)',
  },
};

const PresentationSlidesInline: React.FC<PresentationSlidesProps> = ({ content, videoUrl }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  
  // Parse slides
  const slides = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return ['No content available'];
    }
    
    const allSlides = content.split(/## Slide \d+:/);
    
    return allSlides
      .filter(slide => slide && slide.trim().length > 0)
      .map(slide => {
        let cleaned = slide.trim();
        cleaned = cleaned.replace(/^---\s*$/gm, '');
        cleaned = cleaned.replace(/^- /gm, '• ');
        cleaned = cleaned.replace(/\n\*\*/g, '\n\n**');
        return cleaned;
      });
  }, [content]);
  
  // Extract speaker notes
  const speakerNotes = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return 'Speaker notes will be generated with each slide.';
    }
    
    const match = content.match(/\*\*Speaker Notes:\*\*([\s\S]*?)(?=$)/);
    return match ? match[1].trim() : 'Speaker notes will be generated with each slide.';
  }, [content]);
  
  // Navigation handlers
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

  // Custom markdown components with inline styles
  const markdownComponents = {
    h1: ({children}: any) => (
      <h1 style={styles.slideTitle}>{children}</h1>
    ),
    h2: ({children}: any) => (
      <h2 style={{...styles.slideText, fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem'}}>
        {children}
      </h2>
    ),
    h3: ({children}: any) => (
      <h3 style={{...styles.slideText, fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem'}}>
        {children}
      </h3>
    ),
    p: ({children}: any) => (
      <p style={{...styles.slideText, marginBottom: '1rem', lineHeight: 1.6}}>
        {children}
      </p>
    ),
    ul: ({children}: any) => (
      <ul style={{...styles.slideText, marginBottom: '1rem', paddingLeft: '2rem'}}>
        {children}
      </ul>
    ),
    ol: ({children}: any) => (
      <ol style={{...styles.slideText, marginBottom: '1rem', paddingLeft: '2rem'}}>
        {children}
      </ol>
    ),
    li: ({children}: any) => (
      <li style={{...styles.slideText, marginBottom: '0.5rem', listStyleType: 'disc'}}>
        {children}
      </li>
    ),
    strong: ({children}: any) => (
      <strong style={{fontWeight: 600, color: '#1f2937'}}>
        {children}
      </strong>
    ),
    em: ({children}: any) => (
      <em style={{fontStyle: 'italic'}}>
        {children}
      </em>
    ),
    code: ({children}: any) => (
      <code style={{
        background: '#f3f4f6',
        padding: '0.125rem 0.25rem',
        borderRadius: '0.25rem',
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap',
      }}>
        {children}
      </code>
    ),
    pre: ({children}: any) => (
      <pre style={{
        background: '#f3f4f6',
        padding: '1rem',
        borderRadius: '0.5rem',
        overflowX: 'auto',
        margin: '1rem 0.5rem',
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '0.875rem',
      }}>
        {children}
      </pre>
    ),
  };

  return (
    <div style={styles.presentationViewer}>
      {/* Navigation Header */}
      <div style={styles.presentationNav}>
        <div>
          <h2 style={styles.navTitle}>Professional Presentation Slides</h2>
          <span style={styles.navSubtitle}>
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        
        <div style={styles.navCenter}>
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{
              ...styles.navBtn,
              ...(currentSlide === 0 ? styles.navBtnDisabled : {}),
            }}
          >
            ← Previous
          </button>
          
          <span style={styles.slideIndicator}>
            {currentSlide + 1} / {slides.length}
          </span>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            style={{
              ...styles.navBtn,
              ...(currentSlide === slides.length - 1 ? styles.navBtnDisabled : {}),
            }}
          >
            Next →
          </button>
        </div>
        
        <div>
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            style={styles.notesToggle}
          >
            {showSpeakerNotes ? 'Hide' : 'Show'} Speaker Notes
          </button>
        </div>
      </div>

      {/* Main Presentation Area */}
      <div style={styles.presentationMain}>
        {/* Current Slide */}
        <div style={styles.slideContainer}>
          <div style={styles.slide}>
            <div style={styles.slideHeader}>
              <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>
                Slide {currentSlide + 1}
              </span>
              <span style={{fontSize: '0.9rem', opacity: 0.9}}>
                ⏱️ ~{Math.round((currentSlide + 1) * 2)}min
              </span>
            </div>
            
            <div style={styles.slideContent}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {slides[currentSlide]}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Speaker Notes Panel */}
        {showSpeakerNotes && (
          <div style={styles.speakerNotesPanel}>
            <div style={styles.notesHeader}>
              <h3 style={{color: 'white', margin: 0, fontSize: '1.1rem'}}>
                Speaker Notes
              </h3>
            </div>
            <div style={styles.notesContent}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {speakerNotes}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Slide Thumbnails */}
      <div style={styles.slideThumbnails}>
        <h4 style={{color: 'white', margin: '0 0 0.5rem 0', fontSize: '1rem'}}>
          Slides
        </h4>
        <div style={styles.thumbnailsGrid}>
          {slides.map((slide, index) => {
            const preview = slide
              .replace(/\*\*/g, '')
              .replace(/^#+ /gm, '')
              .split('\n')
              .slice(0, 2)
              .join(' ')
              .substring(0, 50);
            
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  ...styles.thumbnail,
                  ...(currentSlide === index ? styles.thumbnailActive : {}),
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{color: 'white', fontWeight: 'bold', fontSize: '0.75rem'}}>
                    {index + 1}
                  </span>
                  <span style={{color: '#9ca3af', fontSize: '0.625rem'}}>
                    ~{Math.round((index + 1) * 2)}min
                  </span>
                </div>
                <div style={{
                  color: '#d1d5db',
                  fontSize: '0.625rem',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                }}>
                  {preview}...
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PresentationSlidesInline;