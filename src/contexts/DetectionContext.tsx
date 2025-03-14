
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DetectedFrame, VideoMetadata, ProcessingStatus } from '@/utils/types';

interface DetectionContextType {
  detectedFrames: DetectedFrame[];
  selectedFrame: DetectedFrame | null;
  videoFile: File | null;
  videoMetadata: VideoMetadata | null;
  processingStatus: ProcessingStatus;
  setDetectedFrames: React.Dispatch<React.SetStateAction<DetectedFrame[]>>;
  addDetectedFrame: (frame: DetectedFrame) => void;
  setSelectedFrame: React.Dispatch<React.SetStateAction<DetectedFrame | null>>;
  setVideoFile: React.Dispatch<React.SetStateAction<File | null>>;
  setVideoMetadata: React.Dispatch<React.SetStateAction<VideoMetadata | null>>;
  setProcessingStatus: React.Dispatch<React.SetStateAction<ProcessingStatus>>;
  clearAll: () => void;
}

const initialProcessingStatus: ProcessingStatus = {
  isProcessing: false,
  totalFrames: 0,
  processedFrames: 0,
  detectedFrames: 0,
  progress: 0,
  currentTimestamp: 0,
  errors: [],
};

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export const DetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [detectedFrames, setDetectedFrames] = useState<DetectedFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<DetectedFrame | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(initialProcessingStatus);

  const addDetectedFrame = (frame: DetectedFrame) => {
    setDetectedFrames(prev => [...prev, frame]);
    setProcessingStatus(prev => ({
      ...prev,
      detectedFrames: prev.detectedFrames + 1
    }));
  };

  const clearAll = () => {
    setDetectedFrames([]);
    setSelectedFrame(null);
    setVideoFile(null);
    setVideoMetadata(null);
    setProcessingStatus(initialProcessingStatus);
  };

  useEffect(() => {
    // When we get detections, update the count
    setProcessingStatus(prev => ({
      ...prev,
      detectedFrames: detectedFrames.length
    }));
  }, [detectedFrames.length]);

  return (
    <DetectionContext.Provider
      value={{
        detectedFrames,
        selectedFrame,
        videoFile,
        videoMetadata,
        processingStatus,
        setDetectedFrames,
        addDetectedFrame,
        setSelectedFrame,
        setVideoFile,
        setVideoMetadata,
        setProcessingStatus,
        clearAll
      }}
    >
      {children}
    </DetectionContext.Provider>
  );
};

export const useDetection = (): DetectionContextType => {
  const context = useContext(DetectionContext);
  if (context === undefined) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
};
