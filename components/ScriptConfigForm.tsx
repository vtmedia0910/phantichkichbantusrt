
import React, { useState } from 'react';
import { FileText, Layers, Zap, AlignLeft } from 'lucide-react';
import { ScriptConfig } from '../types';

interface ScriptConfigFormProps {
  topic: string;
  onGenerate: (config: ScriptConfig) => void;
}

export const ScriptConfigForm: React.FC<ScriptConfigFormProps> = ({ topic, onGenerate }) => {
  const [targetWordCount, setTargetWordCount] = useState<number>(2000);
  const [parts, setParts] = useState(5);
  const [instructions, setInstructions] = useState('');

  const wordCountOptions = [1000, 2000, 3000, 4000, 5000];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Configure Script Generation</h2>
        <p className="text-slate-400">Selected Topic: <span className="text-indigo-400 font-semibold">{topic}</span></p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8 shadow-xl">
        {/* Word Count */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" /> Target Word Count
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {wordCountOptions.map((count) => (
              <button
                key={count}
                onClick={() => setTargetWordCount(count)}
                className={`px-3 py-3 rounded-lg text-sm font-medium border transition-all
                  ${targetWordCount === count 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}
                `}
              >
                {count} words
              </button>
            ))}
          </div>
        </div>

        {/* Parts */}
        <div>
          <div className="flex justify-between items-center mb-3">
             <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" /> Split Into Parts
            </label>
            <span className="text-xs px-2 py-1 bg-slate-800 text-indigo-300 rounded border border-slate-700 font-mono">
              {parts} Part{parts > 1 ? 's' : ''}
            </span>
          </div>
         
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={parts}
            onChange={(e) => setParts(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
          />
           <div className="flex justify-between text-xs text-slate-600 mt-2 px-1 font-mono">
            <span>1</span>
            <span>Approx {Math.round(targetWordCount / parts)} words/part</span>
            <span>20</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 bg-slate-950/50 p-3 rounded border border-slate-800/50">
            <span className="text-amber-500 font-semibold">Tip:</span> Higher part counts allow for extremely detailed scripts and avoid AI timeouts. You will review and generate each part manually.
          </p>
        </div>

         {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <AlignLeft size={18} className="text-indigo-400" /> Additional Instructions (Optional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="E.g., Make the intro very aggressive, focus on the technical details, end with a question..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none placeholder:text-slate-600"
          />
        </div>

        <button
          onClick={() => onGenerate({ targetWordCount, parts, instructions })}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transform hover:-translate-y-0.5"
        >
          <Zap size={20} />
          Start Generation
        </button>
      </div>
    </div>
  );
};
