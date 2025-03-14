
import React, { useState, useEffect } from 'react';
import { DetectionProvider, useDetection } from '@/contexts/DetectionContext';
import UploadZone from '@/components/UploadZone';
import ProcessingStatus from '@/components/ProcessingStatus';
import DetectionTimeline from '@/components/DetectionTimeline';
import FrameViewer from '@/components/FrameViewer';
import DetectionAlert from '@/components/DetectionAlert';
import ExportButton from '@/components/ExportButton';
import frameExtractor from '@/services/frameExtractor';
import detectionService from '@/services/detectionService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, Clock, Pause, Play } from 'lucide-react';

// Main application content
const AppContent: React.FC = () => {
  const { 
    videoFile, 
    videoMetadata, 
    processingStatus, 
    setProcessingStatus, 
    detectedFrames,
    addDetectedFrame
  } = useDetection();
  
  const [isPaused, setIsPaused] = useState(false);
  const [extractionSignal] = useState({ stop: false });
  
  // Start processing when a video is loaded
  useEffect(() => {
    if (videoFile && videoMetadata && !processingStatus.isProcessing) {
      startProcessing();
    }
  }, [videoFile, videoMetadata]);
  
  // Toggle pause/resume
  useEffect(() => {
    if (isPaused) {
      extractionSignal.stop = true;
    } else if (processingStatus.isProcessing) {
      extractionSignal.stop = false;
      // TODO: Resume processing here if needed
    }
  }, [isPaused]);
  
  // Start the frame extraction and detection process
  const startProcessing = async () => {
    if (!videoFile || !videoMetadata) return;
    
    // Set processing status
    setProcessingStatus({
      isProcessing: true,
      totalFrames: Math.floor(videoMetadata.duration * videoMetadata.frameRate),
      processedFrames: 0,
      detectedFrames: 0,
      progress: 0,
      currentTimestamp: 0,
      errors: []
    });
    
    toast.success('Processing started');
    
    // Configure frame extraction rate (adjust as needed for performance)
    frameExtractor.configureExtraction({
      frameRate: 1 // Extract 1 frame per second
    });
    
    try {
      // Start frame extraction with callbacks
      await frameExtractor.extractFrames(
        videoFile,
        async (frame) => {
          // Update processing status
          setProcessingStatus(prev => ({
            ...prev,
            processedFrames: prev.processedFrames + 1
          }));
          
          // Process frame for human detection
          const processedFrame = await detectionService.detectHumans(frame);
          
          // If a human was detected, add to results
          if (processedFrame.humanDetected) {
            addDetectedFrame(processedFrame);
          }
        },
        (progress, currentTime) => {
          // Update progress
          setProcessingStatus(prev => ({
            ...prev,
            progress,
            currentTimestamp: currentTime
          }));
        },
        extractionSignal
      );
      
      // When complete
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100
      }));
      
      toast.success('Processing complete!');
    } catch (error) {
      console.error('Processing error:', error);
      
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        errors: [...prev.errors, error instanceof Error ? error.message : String(error)]
      }));
      
      toast.error('Error processing video');
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 sm:px-6 md:px-8">
      <header className="w-full max-w-5xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-merit rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">M.E.R.I.T.</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Mobile Emergency Rescue & Intervention Technology
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {processingStatus.isProcessing && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-transparent"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <>
                    <Play size={14} className="mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause size={14} className="mr-1" />
                    Pause
                  </>
                )}
              </Button>
            )}
            
            {detectedFrames.length > 0 && <ExportButton />}
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-5xl flex-1">
        <UploadZone />
        
        <ProcessingStatus />
        
        <DetectionTimeline />
        
        <FrameViewer />
        
        {!videoFile && !processingStatus.isProcessing && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-muted">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-3">Ready to Process Drone Footage</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Upload a video file to begin analyzing for human presence. Results will appear as frames are processed.
            </p>
          </div>
        )}
      </main>
      
      <footer className="w-full max-w-5xl mt-8 pt-4 border-t border-border/40">
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            M.E.R.I.T. Search & Rescue System
          </div>
          <div className="text-xs text-muted-foreground">
            Version 1.0
          </div>
        </div>
      </footer>
      
      <DetectionAlert />
    </div>
  );
};

// Wrap the app content with the detection provider
const Index: React.FC = () => {
  return (
    <DetectionProvider>
      <AppContent />
    </DetectionProvider>
  );
};

export default Index;
