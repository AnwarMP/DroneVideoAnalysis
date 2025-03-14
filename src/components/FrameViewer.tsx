
import React, { useState, useEffect, useRef } from 'react';
import { useDetection } from '@/contexts/DetectionContext';
import { formatTimecode } from '@/utils/formatTime';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FrameViewer: React.FC = () => {
  const { selectedFrame, detectedFrames, setSelectedFrame, videoMetadata } = useDetection();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRate = videoMetadata?.frameRate || 30;

  // Navigate to previous/next detection
  const navigateFrames = (direction: 'prev' | 'next') => {
    if (!selectedFrame || detectedFrames.length === 0) return;
    
    const currentIndex = detectedFrames.findIndex(f => f.id === selectedFrame.id);
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    // Wrap around
    if (newIndex < 0) newIndex = detectedFrames.length - 1;
    if (newIndex >= detectedFrames.length) newIndex = 0;
    
    setSelectedFrame(detectedFrames[newIndex]);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!frameRef.current) return;
    
    if (!isFullscreen) {
      if (frameRef.current.requestFullscreen) {
        frameRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Draw bounding box on canvas
  useEffect(() => {
    if (selectedFrame && selectedFrame.boundingBox && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw bounding box
        const { x, y, width, height } = selectedFrame.boundingBox!;
        const boxX = (x / 100) * canvas.width;
        const boxY = (y / 100) * canvas.height;
        const boxWidth = (width / 100) * canvas.width;
        const boxHeight = (height / 100) * canvas.height;
        
        ctx.strokeStyle = 'rgba(var(--merit-highlight-rgb), 1)';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Add label
        ctx.fillStyle = 'rgba(var(--merit-highlight-rgb), 0.8)';
        ctx.fillRect(boxX, boxY - 20, 80, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Human ${Math.round(selectedFrame.confidence * 100)}%`, boxX + 5, boxY - 6);
      };
      img.src = selectedFrame.imageUrl;
    }
  }, [selectedFrame]);

  if (!selectedFrame) {
    return (
      <div className="w-full glassmorphism rounded-lg p-6 text-center animate-fade-in">
        <p className="text-muted-foreground">No detection selected</p>
        <p className="text-xs mt-2">
          Select a frame from the timeline to view detection details
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={frameRef}
      className={`w-full glassmorphism rounded-lg p-4 animate-fade-in ${
        isFullscreen ? 'fixed inset-0 z-50 bg-background rounded-none' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <span>Detection Details</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                  <Info size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Viewing frame {selectedFrame.frameNumber} ({formatTimecode(selectedFrame.timestamp, frameRate)})
                  with {(selectedFrame.confidence * 100).toFixed(1)}% confidence.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateFrames('prev')}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="text-xs px-2">
            {detectedFrames.findIndex(f => f.id === selectedFrame.id) + 1} / {detectedFrames.length}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateFrames('next')}
          >
            <ChevronRight size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={toggleFullscreen}
          >
            <Maximize size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="relative video-frame aspect-video">
            <img 
              src={selectedFrame.imageUrl} 
              alt={`Frame at ${formatTimecode(selectedFrame.timestamp, frameRate)}`}
              className="w-full h-full object-cover"
            />
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>
          
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {formatTimecode(selectedFrame.timestamp, frameRate)}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Detection Information</div>
            <div className="bg-background p-3 rounded-md border border-border/40">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <span className="text-xs font-medium">
                  {selectedFrame.humanDetected ? (
                    <span className="text-merit-highlight">Human Detected</span>
                  ) : (
                    <span className="text-muted-foreground">No Detection</span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <span className="text-xs font-medium">
                  {(selectedFrame.confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Frame:</span>
                <span className="text-xs font-medium">
                  {selectedFrame.frameNumber}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Timestamp:</span>
                <span className="text-xs font-medium">
                  {formatTimecode(selectedFrame.timestamp, frameRate)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Description</div>
            <div className="bg-background p-3 rounded-md border border-border/40 text-xs h-24 overflow-y-auto">
              {selectedFrame.description || 'No description available.'}
            </div>
          </div>
          
          <div className="mt-auto pt-4 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateFrames('prev')}
              className="text-xs"
            >
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateFrames('next')}
              className="text-xs"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameViewer;
