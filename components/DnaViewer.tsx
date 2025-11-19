import React, { useState } from 'react';
import { DnaResult } from '../types';
import { Copy, Check, Bot, Fingerprint } from 'lucide-react';

interface DnaViewerProps {
  dna: DnaResult;
}

export const DnaViewer: React.FC<DnaViewerProps> = ({ dna }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(dna.systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-8 flex items-start gap-6">
        <div className="p-4 bg-indigo-500/20 rounded-full border border-indigo-500/50">
          <Fingerprint size={32} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Persona Detected: {dna.personaName}</h2>
          <p className="text-slate-300">{dna.styleSummary}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-800/50 px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Generated System Prompt</span>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Prompt'}
          </button>
        </div>
        <div className="p-6 bg-slate-950/50 overflow-x-auto">
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {dna.systemPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
};