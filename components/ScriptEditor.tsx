
import React, { useEffect, useRef } from 'react';
import { ScriptPart } from '../types';
import { Download, RefreshCw, PlayCircle, CheckCircle, FileText, Copy } from 'lucide-react';

interface ScriptEditorProps {
  scriptParts: ScriptPart[];
  topic: string;
  totalParts: number;
  isLoading: boolean;
  onNextPart: () => void;
  onReset: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ 
  scriptParts, 
  topic, 
  totalParts,
  isLoading, 
  onNextPart, 
  onReset 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new parts are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scriptParts, isLoading]);

  const handleDownloadPart = (part: ScriptPart) => {
    // Defensive check for content
    const content = (part.content || []).map(row => row.text).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-part-${part.partNumber}.txt`;
    a.click();
  };

  const handleDownloadAll = () => {
    let fullContent = `TITLE: ${topic}\n\n`;
    (scriptParts || []).forEach(part => {
      fullContent += `\n\n=== PART ${part.partNumber} ===\n\n`;
      fullContent += (part.content || []).map(row => row.text).join('\n\n');
    });
    
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-narrator-script-${topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
  };

  const handleCopyText = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const isComplete = scriptParts.length === totalParts;
  const nextPartNum = scriptParts.length + 1;

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-white">Narrator Script Editor</h2>
            <p className="text-slate-400 text-xs mt-1">
              Topic: <span className="text-indigo-300">{topic}</span> • 
              Progress: <span className={isComplete ? "text-green-400" : "text-amber-400"}>{scriptParts.length} / {totalParts} Parts</span>
            </p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 text-sm font-medium"
            >
              <RefreshCw size={16} />
              Restart
            </button>
            {scriptParts.length > 0 && (
              <button 
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20"
              >
                <Download size={16} />
                Download Full Script
              </button>
            )}
        </div>
      </div>

      <div className="flex-1 border border-slate-700 rounded-xl overflow-hidden flex flex-col bg-slate-950 shadow-2xl relative">
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth p-8 max-w-4xl mx-auto w-full">
            {scriptParts.length === 0 && !isLoading && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500">
                 <FileText size={48} className="mb-4 opacity-50" />
                 <p>Ready to generate high-quality narrative text.</p>
                 <p className="text-sm mt-2 text-slate-600">No visuals, just pure content.</p>
               </div>
            )}

            {(scriptParts || []).map((part) => (
              <div key={part.partNumber} className="mb-12">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-6">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Part {part.partNumber}</span>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => handleCopyText((part.content || []).map(r => r.text).join('\n\n'))}
                        className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Copy Text"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPart(part)}
                        className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Download Part"
                      >
                        <Download size={14} />
                      </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                    {(part.content || []).map((row, idx) => (
                        <p key={idx} className="text-slate-300 text-lg leading-relaxed font-serif text-justify">
                            {row.text}
                        </p>
                    ))}
                </div>
              </div>
            ))}

            {isLoading && (
               <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-indigo-400 font-mono text-sm">Crafting Part {nextPartNum}...</p>
                  <p className="text-slate-600 text-xs">Thinking deeply for maximum quality</p>
               </div>
            )}
            
            {isComplete && (
              <div className="py-12 text-center border-t border-slate-800 mt-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Narrative Complete</h3>
                <p className="text-slate-400 mt-2">The full script is ready for narration.</p>
              </div>
            )}
        </div>

        {/* Bottom Control Bar */}
        {!isComplete && !isLoading && (
          <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-center shrink-0">
            <button
              onClick={onNextPart}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transform hover:-translate-y-0.5 transition-all"
            >
              {scriptParts.length === 0 ? (
                <>
                  <PlayCircle size={20} /> Start Writing (Part 1/{totalParts})
                </>
              ) : (
                <>
                  <PlayCircle size={20} /> Continue to Part {nextPartNum}/{totalParts}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
