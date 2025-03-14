
import React, { useState, useRef } from 'react';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';
import { useDetection } from '@/contexts/DetectionContext';
import frameExtractor from '@/services/frameExtractor';
import { toast } from 'sonner';

const UploadZone: React.FC = () => {
  const { setVideoFile, setVideoMetadata, processingStatus, clearAll } = useDetection();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file (.mp4, .mov, etc.)');
      return;
    }

    try {
      setIsLoading(true);
      
      // If we already have a video processing, clear it first
      if (processingStatus.isProcessing) {
        clearAll();
      }
      
      // Get video metadata
      const metadata = await frameExtractor.getVideoMetadata(file);
      
      // Set the video file and metadata
      setVideoFile(file);
      setVideoMetadata(metadata);
      
      toast.success(`Video loaded: ${file.name}`);
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('Failed to process video file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileDrop(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileDrop(e.target.files);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`w-full relative overflow-hidden transition-all duration-300 ${
        processingStatus.isProcessing 
          ? 'h-20 rounded-lg mb-4' 
          : 'h-60 rounded-xl'
      }`}
    >
      <div
        className={`glassmorphism w-full h-full flex flex-col items-center justify-center p-6 transition-all duration-300 ${
          isDragging ? 'border-merit border-2' : 'border'
        } ${isLoading ? 'opacity-70' : 'opacity-100'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {!processingStatus.isProcessing ? (
          <>
            <div className="bg-merit/10 p-3 mb-4 rounded-full">
              <Upload 
                size={32} 
                className="text-merit animate-pulse-subtle" 
              />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload Drone Footage</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Drag and drop your video file here, or click to browse
            </p>
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
              <FileVideo size={16} /> Supports MP4, MOV, AVI, MKV
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-merit mb-2"></div>
                  <span className="text-sm">Processing video...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex items-center justify-center gap-2">
            <FileVideo size={20} className="text-merit" />
            <span className="text-sm font-medium truncate">
              Processing: {processingStatus.processedFrames} frames analyzed
            </span>
            <span className="text-xs text-merit-highlight font-semibold bg-merit-highlight/10 px-2 py-0.5 rounded-full">
              {processingStatus.detectedFrames} detected
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default UploadZone;
