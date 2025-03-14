
export interface DetectedFrame {
  id: string;
  frameNumber: number;
  timestamp: number; // In seconds
  imageUrl: string; // Base64 or object URL
  humanDetected: boolean;
  confidence: number;
  description: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VideoMetadata {
  name: string;
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  size: number; // In bytes
  type: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  totalFrames: number;
  processedFrames: number;
  detectedFrames: number;
  progress: number; // 0-100
  currentTimestamp: number;
  errors: string[];
}

export interface DetectionResponse {
  humanDetected: boolean;
  description: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
