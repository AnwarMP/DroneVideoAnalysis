
import React, { useState, useRef, useEffect } from 'react';
import { useDetection } from '@/contexts/DetectionContext';
import { formatTimecode } from '@/utils/formatTime';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DetectionTimeline: React.FC = () => {
  const { detectedFrames, selectedFrame, setSelectedFrame, videoMetadata } = useDetection();
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const frameRate = videoMetadata?.frameRate || 30;

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = timelineRef.current.clientWidth * 0.8;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      timelineRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (timelineRef.current) {
      setScrollPosition(timelineRef.current.scrollLeft);
    }
  };

  // Auto-scroll to the selected frame
  useEffect(() => {
    if (selectedFrame && timelineRef.current) {
      const selectedElement = document.getElementById(`timeline-${selectedFrame.id}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedFrame]);

  if (detectedFrames.length === 0) {
    return null;
  }

  return (
    <div className="w-full glassmorphism rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Detection Timeline</h3>
        <div className="text-xs text-muted-foreground">
          {detectedFrames.length} detections
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={() => scrollTimeline('left')}
          disabled={scrollPosition <= 10}
        >
          <ChevronLeft size={18} />
        </Button>

        <div 
          ref={timelineRef}
          className="flex gap-2 overflow-x-auto py-2 scrollbar-thin"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'thin' }}
        >
          {detectedFrames.map((frame) => (
            <div 
              key={frame.id}
              id={`timeline-${frame.id}`}
              className={`flex-shrink-0 cursor-pointer group transition-all duration-200 transform hover:scale-105 ${
                selectedFrame?.id === frame.id ? 'scale-105' : ''
              }`}
              onClick={() => setSelectedFrame(frame)}
            >
              <div 
                className={`relative w-32 h-20 overflow-hidden rounded-md ${
                  selectedFrame?.id === frame.id ? 'ring-2 ring-merit' : 'ring-1 ring-border/40'
                }`}
              >
                <img 
                  src={frame.imageUrl} 
                  alt={`Frame at ${formatTimecode(frame.timestamp, frameRate)}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTimecode(frame.timestamp, frameRate)}
                </div>
                
                {/* Confidence indicator */}
                <div 
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: `rgba(var(--merit-highlight-rgb), ${frame.confidence})` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={() => scrollTimeline('right')}
          disabled={timelineRef.current && scrollPosition >= timelineRef.current.scrollWidth - timelineRef.current.clientWidth - 10}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default DetectionTimeline;
