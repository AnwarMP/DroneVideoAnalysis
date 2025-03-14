
import React, { useState } from 'react';
import { useDetection } from '@/contexts/DetectionContext';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimecode } from '@/utils/formatTime';
import { toast } from 'sonner';

const ExportButton: React.FC = () => {
  const { detectedFrames, videoMetadata, processingStatus } = useDetection();
  const [isExporting, setIsExporting] = useState(false);
  const frameRate = videoMetadata?.frameRate || 30;

  const handleExport = async () => {
    if (detectedFrames.length === 0) {
      toast.error('No detections to export');
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Generate CSV data
      let csvContent = 'Frame Number,Timestamp,Confidence,Description\n';
      detectedFrames.forEach(frame => {
        csvContent += `${frame.frameNumber},${formatTimecode(frame.timestamp, frameRate)},${(frame.confidence * 100).toFixed(1)}%,"${frame.description.replace(/"/g, '""')}"\n`;
      });
      
      // Generate HTML report
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>M.E.R.I.T. Detection Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            h1 { color: #0284c7; }
            .report-info { margin-bottom: 20px; }
            .detection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
            .detection-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
            .detection-card img { width: 100%; height: 150px; object-fit: cover; }
            .detection-info { padding: 10px; }
            .confidence-high { color: #22c55e; }
            .confidence-medium { color: #f59e0b; }
            .confidence-low { color: #ef4444; }
            .timestamp { font-family: monospace; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>M.E.R.I.T. Human Detection Report</h1>
          <div class="report-info">
            <p><strong>Video:</strong> ${videoMetadata?.name || 'Unknown'}</p>
            <p><strong>Duration:</strong> ${formatTimecode(videoMetadata?.duration || 0, frameRate)}</p>
            <p><strong>Total Detections:</strong> ${detectedFrames.length}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <h2>Detections Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Frame</th>
                <th>Timestamp</th>
                <th>Confidence</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${detectedFrames.map(frame => `
                <tr>
                  <td>${frame.frameNumber}</td>
                  <td class="timestamp">${formatTimecode(frame.timestamp, frameRate)}</td>
                  <td class="${frame.confidence > 0.7 ? 'confidence-high' : frame.confidence > 0.4 ? 'confidence-medium' : 'confidence-low'}">
                    ${(frame.confidence * 100).toFixed(1)}%
                  </td>
                  <td>${frame.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Visual Detections</h2>
          <div class="detection-grid">
            ${detectedFrames.map(frame => `
              <div class="detection-card">
                <img src="${frame.imageUrl}" alt="Detection at ${formatTimecode(frame.timestamp, frameRate)}">
                <div class="detection-info">
                  <div class="timestamp">${formatTimecode(frame.timestamp, frameRate)}</div>
                  <div class="${frame.confidence > 0.7 ? 'confidence-high' : frame.confidence > 0.4 ? 'confidence-medium' : 'confidence-low'}">
                    Confidence: ${(frame.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      
      // Create Zip file with JSZip
      const JSZip = await import('jszip').then(m => m.default);
      const zip = new JSZip();
      
      // Add files to zip
      zip.file('detections.csv', csvContent);
      zip.file('report.html', htmlContent);
      
      // Add images folder
      const imagesFolder = zip.folder('images');
      
      // Add each image
      for (let i = 0; i < detectedFrames.length; i++) {
        const frame = detectedFrames[i];
        const imageData = frame.imageUrl.split(',')[1];
        imagesFolder?.file(`detection_${frame.frameNumber}.jpg`, imageData, { base64: true });
      }
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MERIT_Detections_${new Date().toISOString().replace(/:/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export detections');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      className="text-xs bg-merit text-white hover:bg-merit/90"
      onClick={handleExport}
      disabled={isExporting || detectedFrames.length === 0}
    >
      <Download size={14} className="mr-1" />
      {isExporting ? 'Exporting...' : 'Export Report'}
    </Button>
  );
};

export default ExportButton;
