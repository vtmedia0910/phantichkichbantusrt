import { TranscriptData, TranscriptSegment } from '../types';

export const parseSrt = (rawSrt: string, fileName: string): TranscriptData => {
  const segments: TranscriptSegment[] = [];
  // Normalize line endings
  const normalizedSrt = rawSrt.replace(/\r\n/g, '\n').trim();
  
  // Split by double newlines which typically separate SRT blocks
  const blocks = normalizedSrt.split(/\n\n/);

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      // Line 1: ID (ignored, we use index)
      // Line 2: Timecode
      const timecodeLine = lines[1];
      // Line 3+: Text
      const textLines = lines.slice(2).join(' ');

      // Parse Timecode 00:00:00,000 --> 00:00:02,500
      const timeMatch = timecodeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      
      if (timeMatch) {
        const startSeconds = 
          parseInt(timeMatch[1]) * 3600 + 
          parseInt(timeMatch[2]) * 60 + 
          parseInt(timeMatch[3]) + 
          parseInt(timeMatch[4]) / 1000;
          
        const endSeconds = 
          parseInt(timeMatch[5]) * 3600 + 
          parseInt(timeMatch[6]) * 60 + 
          parseInt(timeMatch[7]) + 
          parseInt(timeMatch[8]) / 1000;

        const duration = endSeconds - startSeconds;
        
        // Clean HTML tags from text
        const cleanText = textLines.replace(/<[^>]*>/g, '').trim();
        
        // Calculate WPM for this segment
        const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
        // Avoid division by zero or extremely short segments
        const safeDuration = duration > 0.5 ? duration : 0.5; 
        const wpm = Math.round((wordCount / (safeDuration / 60)));

        segments.push({
          id: index + 1,
          start: startSeconds,
          end: endSeconds,
          text: cleanText,
          wpm: wpm
        });
      }
    }
  });

  const fullText = segments.map(s => s.text).join(' ');
  const totalWords = fullText.split(/\s+/).length;
  const totalDuration = segments.length > 0 ? segments[segments.length - 1].end : 0;
  const avgWpm = totalDuration > 0 ? Math.round(totalWords / (totalDuration / 60)) : 0;

  return {
    fileName,
    duration: totalDuration,
    wordCount: totalWords,
    avgWpm,
    segments,
    fullText
  };
};
