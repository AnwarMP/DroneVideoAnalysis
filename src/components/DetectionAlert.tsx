
import React, { useEffect, useState } from 'react';
import { useDetection } from '@/contexts/DetectionContext';
import { Bell, ChevronRight } from 'lucide-react';
import { formatTimecode } from '@/utils/formatTime';
import { Button } from '@/components/ui/button';

const DetectionAlert: React.FC = () => {
  const { detectedFrames, setSelectedFrame, processingStatus, videoMetadata } = useDetection();
  const [recentDetections, setRecentDetections] = useState<typeof detectedFrames>([]);
  const [showAlert, setShowAlert] = useState(false);
  const frameRate = videoMetadata?.frameRate || 30;

  // Sound effect for alerts
  const playAlertSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,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';
    audio.volume = 0.25;
    audio.play();
  };

  // Update recent detections
  useEffect(() => {
    // Only get the last 3 detections and only when processing
    if (processingStatus.isProcessing && detectedFrames.length > 0) {
      const recent = detectedFrames.slice(-3);
      
      // Check if we have new detections
      const newDetections = recent.filter(
        r => !recentDetections.some(d => d.id === r.id)
      );
      
      if (newDetections.length > 0) {
        setRecentDetections(recent);
        setShowAlert(true);
        
        // Play sound for new detections
        playAlertSound();
        
        // Hide alert after 5 seconds
        const timer = setTimeout(() => {
          setShowAlert(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [detectedFrames, processingStatus.isProcessing, recentDetections]);

  if (!showAlert || recentDetections.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-scale-up">
      <div className="bg-merit/95 text-white rounded-lg p-3 shadow-lg w-72">
        <div className="flex items-center mb-2">
          <Bell size={18} className="mr-2 animate-pulse" />
          <h4 className="font-medium">Detection Alert</h4>
        </div>
        
        <p className="text-xs mb-2">
          Human detected in {recentDetections.length} recent frames
        </p>
        
        <div className="flex gap-2 mb-2">
          {recentDetections.map((detection) => (
            <div 
              key={detection.id}
              className="w-16 h-12 rounded overflow-hidden border border-white/20 cursor-pointer"
              onClick={() => {
                setSelectedFrame(detection);
                setShowAlert(false);
              }}
            >
              <img 
                src={detection.imageUrl} 
                alt={`Detection at ${formatTimecode(detection.timestamp, frameRate)}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        <Button 
          variant="secondary"
          size="sm"
          className="w-full text-xs bg-white/20 hover:bg-white/30 border-none text-white"
          onClick={() => {
            setSelectedFrame(recentDetections[recentDetections.length - 1]);
            setShowAlert(false);
          }}
        >
          View Detection <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default DetectionAlert;
