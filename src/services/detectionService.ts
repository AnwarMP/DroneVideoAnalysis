
import { DetectedFrame, DetectionResponse } from '@/utils/types';
import { toast } from 'sonner';

// This is a mock service for detection - in a real app, you would integrate with Gemini API
export class DetectionService {
  private apiKey: string = '';
  private apiUrl: string = 'https://api.gemini.google.com/v1/models/gemini-1.5-flash:analyzeImage';
  private mockMode: boolean = true; // Set to false to use actual API

  // Set API key
  public setApiKey(key: string): void {
    this.apiKey = key;
    this.mockMode = false;
  }

  // Process a single frame
  public async detectHumans(frame: DetectedFrame): Promise<DetectedFrame> {
    try {
      if (this.mockMode) {
        return await this.mockDetection(frame);
      } else {
        return await this.realDetection(frame);
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Error in human detection');
      // Return the original frame if detection fails
      return frame;
    }
  }

  // Process multiple frames in parallel
  public async batchDetectHumans(frames: DetectedFrame[], batchSize: number = 5): Promise<DetectedFrame[]> {
    const results: DetectedFrame[] = [];
    const batches = [];
    
    // Create batches
    for (let i = 0; i < frames.length; i += batchSize) {
      batches.push(frames.slice(i, i + batchSize));
    }
    
    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(frame => this.detectHumans(frame));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Real API implementation (would connect to Gemini API)
  private async realDetection(frame: DetectedFrame): Promise<DetectedFrame> {
    // Convert base64 image data for API
    const imageData = frame.imageUrl.split(',')[1];
    
    // In a real implementation, you would make API calls to Gemini
    // This is a placeholder for the actual implementation
    const body = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this drone footage frame. Is there a human present in this image? If yes, describe where they are located in the image. Return only a JSON with format: {humanDetected: boolean, description: string, confidence: number between 0 and 1}"
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }
      ]
    };
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse the response text to extract JSON
      const resultText = data.candidates[0].content.parts[0].text;
      let detectionResult: DetectionResponse;
      
      try {
        // Try to parse directly first
        detectionResult = JSON.parse(resultText);
      } catch (e) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          detectionResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse detection result");
        }
      }
      
      // Update the frame with detection results
      return {
        ...frame,
        humanDetected: detectionResult.humanDetected,
        confidence: detectionResult.confidence,
        description: detectionResult.description,
        boundingBox: detectionResult.boundingBox
      };
    } catch (error) {
      console.error("API detection error:", error);
      return frame;
    }
  }
  
  // Mock implementation for development/testing
  private async mockDetection(frame: DetectedFrame): Promise<DetectedFrame> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Random detection (20% chance of detecting a human in test mode)
    const detected = Math.random() < 0.2;
    const confidence = detected ? 0.5 + Math.random() * 0.5 : Math.random() * 0.3;
    
    let description = '';
    let boundingBox = undefined;
    
    if (detected) {
      // Generate random position descriptions and bounding boxes
      const positions = ['top left', 'top right', 'bottom left', 'bottom right', 'center'];
      const position = positions[Math.floor(Math.random() * positions.length)];
      
      description = `Human detected in the ${position} of the frame.`;
      
      // Generate a random bounding box
      const x = Math.floor(Math.random() * 60) + 20;
      const y = Math.floor(Math.random() * 60) + 20;
      const width = Math.floor(Math.random() * 30) + 10;
      const height = Math.floor(Math.random() * 40) + 20;
      
      boundingBox = { x, y, width, height };
    } else {
      description = 'No humans detected in this frame.';
    }
    
    return {
      ...frame,
      humanDetected: detected,
      confidence,
      description,
      boundingBox
    };
  }
}

export default new DetectionService();
