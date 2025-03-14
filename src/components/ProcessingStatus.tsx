
import React, { useEffect, useState } from 'react';
import { useDetection } from '@/contexts/DetectionContext';
import { Clock, CheckCircle, AlertCircle, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/utils/formatTime';

const ProcessingStatus: React.FC = () => {
  const { processingStatus, videoMetadata } = useDetection();
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Update elapsed time and estimated time remaining
  useEffect(() => {
    if (processingStatus.isProcessing && !isPaused) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Calculate estimated time remaining if we have enough data
        if (processingStatus.progress > 5 && videoMetadata) {
          const timePerPercent = elapsedTime / processingStatus.progress;
          const remaining = (100 - processingStatus.progress) * timePerPercent;
          setEstimatedTimeRemaining(remaining);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [processingStatus.isProcessing, processingStatus.progress, isPaused, elapsedTime, videoMetadata]);

  // Reset elapsed time when processing starts
  useEffect(() => {
    if (processingStatus.isProcessing) {
      setElapsedTime(0);
      setEstimatedTimeRemaining(null);
    }
  }, [processingStatus.isProcessing]);

  if (!processingStatus.isProcessing) {
    return null;
  }

  return (
    <div className="w-full glassmorphism rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock size={16} className="mr-2 text-merit" />
            <span className="text-sm font-medium">Processing Video</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <Play size={16} className="mr-1" />
            ) : (
              <Pause size={16} className="mr-1" />
            )}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>

        <div className="w-full progress-indicator mt-2">
          <div 
            className="progress-bar transition-all duration-300" 
            style={{ width: `${processingStatus.progress}%` }} 
          />
        </div>

        <div className="flex flex-wrap justify-between mt-1 text-xs text-muted-foreground">
          <div className="flex items-center">
            <span className="font-medium text-foreground mr-1">
              {processingStatus.processedFrames}
            </span> 
            frames processed
          </div>
          
          <div className="flex items-center">
            <span className="font-medium text-merit-highlight mr-1">
              {processingStatus.detectedFrames}
            </span>
            humans detected
          </div>
          
          <div className="flex items-center">
            {formatDuration(elapsedTime)}
            {estimatedTimeRemaining !== null && (
              <span className="ml-1">
                • est. {formatDuration(estimatedTimeRemaining)} remaining
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-1">
          <div className="text-xs">
            Current position: {formatDuration(processingStatus.currentTimestamp)}
          </div>
          <div className="text-xs">
            {processingStatus.progress.toFixed(1)}%
          </div>
        </div>

        {processingStatus.errors.length > 0 && (
          <div className="flex items-center mt-2 text-xs text-merit-alert">
            <AlertCircle size={12} className="mr-1" />
            <span>
              {processingStatus.errors[processingStatus.errors.length - 1]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;
