
import { VideoMetadata, DetectedFrame } from '@/utils/types';

// This service extracts frames from a video file
export class FrameExtractor {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private frameRate: number = 1; // Frames per second to extract
  private frameInterval: number = 1000; // Milliseconds between frames

  constructor() {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Allow seeking
    this.video.preload = 'auto';
    this.video.muted = true;
  }

  // Get video metadata
  public async getVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.video.src = url;

      this.video.onloadedmetadata = () => {
        // Estimate frame rate (most browsers don't expose this)
        const estimatedFrameRate = 30; // Default assumption
        
        const metadata: VideoMetadata = {
          name: file.name,
          duration: this.video.duration,
          width: this.video.videoWidth,
          height: this.video.videoHeight,
          frameRate: estimatedFrameRate,
          size: file.size,
          type: file.type
        };

        resolve(metadata);
        
        // Don't revoke URL here as we'll need it for processing
      };

      this.video.onerror = () => {
        URL.revokeObjectURL(this.video.src);
        reject(new Error("Failed to load video metadata"));
      };
    });
  }

  // Config frame extraction
  public configureExtraction(options: { frameRate?: number }) {
    if (options.frameRate) {
      this.frameRate = options.frameRate;
      this.frameInterval = 1000 / this.frameRate;
    }
  }

  // Extract frames with a callback for each frame
  public async extractFrames(
    file: File,
    onFrameExtracted: (frame: DetectedFrame) => void,
    onProgress: (progress: number, currentTime: number) => void,
    stopExtractionSignal: { stop: boolean } = { stop: false }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      
      if (!this.ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Configure video and canvas
      this.video.src = url;
      
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Start playing and extracting
        this.video.play().catch(reject);
      };

      let frameCount = 0;
      let lastFrameTime = 0;
      
      this.video.onplay = () => {
        const processFrame = () => {
          if (stopExtractionSignal.stop) {
            this.video.pause();
            URL.revokeObjectURL(url);
            resolve();
            return;
          }

          const currentTime = this.video.currentTime;
          
          // Check if enough time has passed to extract a new frame
          if (currentTime - lastFrameTime >= (1 / this.frameRate)) {
            if (this.ctx) {
              // Draw the current frame
              this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
              
              // Convert to image data
              const imageUrl = this.canvas.toDataURL('image/jpeg', 0.8);
              
              // Create frame object
              const frame: DetectedFrame = {
                id: `frame-${frameCount}`,
                frameNumber: frameCount,
                timestamp: currentTime,
                imageUrl,
                humanDetected: false, // Will be updated after detection
                confidence: 0,
                description: '',
              };
              
              // Send frame back via callback
              onFrameExtracted(frame);
              
              // Update counters
              frameCount++;
              lastFrameTime = currentTime;
            }
          }
          
          // Report progress
          const progress = (currentTime / this.video.duration) * 100;
          onProgress(progress, currentTime);
          
          // Continue if not at the end
          if (currentTime < this.video.duration) {
            requestAnimationFrame(processFrame);
          } else {
            this.video.pause();
            URL.revokeObjectURL(url);
            resolve();
          }
        };
        
        // Start processing
        requestAnimationFrame(processFrame);
      };
      
      this.video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Error during video playback"));
      };
    });
  }

  // Create a thumbnail from the video
  public async createThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.video.src = url;
      
      this.video.onloadeddata = () => {
        // Seek to 10% into the video for thumbnail
        this.video.currentTime = this.video.duration * 0.1;
      };
      
      this.video.onseeked = () => {
        if (this.ctx) {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
          
          const thumbnailUrl = this.canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(url);
          resolve(thumbnailUrl);
        } else {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context not available"));
        }
      };
      
      this.video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Error creating thumbnail"));
      };
    });
  }
}

export default new FrameExtractor();
