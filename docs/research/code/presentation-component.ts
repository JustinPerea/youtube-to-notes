import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './PresentationSlides.module.css';

interface PresentationSlidesProps {
  content: string;
  videoUrl: string;
}

const PresentationSlides: React.FC<PresentationSlidesProps> = ({ content, videoUrl }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  
  // Parse slides with better error handling
  const slides = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return ['No content available'];
    }
    
    // Split by slide markers
    const allSlides = content.split(/## Slide \d+:/);
    
    // Filter and clean slides
    return allSlides
      .filter(slide => slide && slide.trim().length > 0)
      .map(slide => {
        // Clean up the slide content
        let cleaned = slide.trim();
        cleaned = cleaned.replace(/^---\s*$/gm, ''); // Remove separator lines
        cleaned = cleaned.replace(/^- /gm, '• '); // Format bullet points
        cleaned = cleaned.replace(/\n\*\*/g, '\n\n**'); // Add spacing for bold text
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

  // Custom markdown components with better styling
  const markdownComponents = {
    h1: ({children}: any) => <h1 className={styles.slideTitle}>{children}</h1>,
    h2: ({children}: any) => <h2 className={styles.slideSubtitle}>{children}</h2>,
    h3: ({children}: any) => <h3 className={styles.slideHeading}>{children}</h3>,
    p: ({children}: any) => <p className={styles.slideParagraph}>{children}</p>,
    ul: ({children}: any) => <ul className={styles.slideList}>{children}</ul>,
    ol: ({children}: any) => <ol className={styles.slideList}>{children}</ol>,
    li: ({children}: any) => <li className={styles.slideListItem}>{children}</li>,
    strong: ({children}: any) => <strong className={styles.slideEmphasis}>{children}</strong>,
    em: ({children}: any) => <em className={styles.slideItalic}>{children}</em>,
    code: ({children}: any) => <code className={styles.slideCode}>{children}</code>,
    pre: ({children}: any) => <pre className={styles.slideCodeBlock}>{children}</pre>,
  };

  return (
    <div className={styles.presentationViewer}>
      {/* Navigation Header */}
      <div className={styles.presentationNav}>
        <div className={styles.navLeft}>
          <h2>Professional Presentation Slides</h2>
          <span>Slide {currentSlide + 1} of {slides.length}</span>
        </div>
        
        <div className={styles.navCenter}>
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={styles.navBtn}
          >
            ← Previous
          </button>
          
          <span className={styles.slideIndicator}>
            {currentSlide + 1} / {slides.length}
          </span>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className={styles.navBtn}
          >
            Next →
          </button>
        </div>
        
        <div className={styles.navRight}>
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={styles.notesToggle}
          >
            {showSpeakerNotes ? 'Hide' : 'Show'} Speaker Notes
          </button>
        </div>
      </div>

      {/* Main Presentation Area */}
      <div className={styles.presentationMain}>
        {/* Current Slide */}
        <div className={styles.slideContainer}>
          <div className={styles.slide}>
            <div className={styles.slideHeader}>
              <span className={styles.slideNumber}>Slide {currentSlide + 1}</span>
              <span className={styles.slideTimer}>⏱️ ~{Math.round((currentSlide + 1) * 2)}min</span>
            </div>
            
            <div className={styles.slideContent}>
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
          <div className={styles.speakerNotesPanel}>
            <div className={styles.notesHeader}>
              <h3>Speaker Notes</h3>
            </div>
            <div className={styles.notesContent}>
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
      <div className={styles.slideThumbnails}>
        <h4 className={styles.thumbnailsTitle}>Slides</h4>
        <div className={styles.thumbnailsGrid}>
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
                className={`${styles.thumbnail} ${currentSlide === index ? styles.active : ''}`}
              >
                <div className={styles.thumbnailHeader}>
                  <span className={styles.thumbnailNumber}>{index + 1}</span>
                  <span className={styles.thumbnailTime}>~{Math.round((index + 1) * 2)}min</span>
                </div>
                <div className={styles.thumbnailContent}>
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

export default PresentationSlides;