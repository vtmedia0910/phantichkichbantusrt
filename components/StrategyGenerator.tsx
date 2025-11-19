
import React from 'react';
import { StrategyItem } from '../types';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

interface StrategyGeneratorProps {
  strategies: StrategyItem[];
  onSelect: (strategy: StrategyItem) => void;
  selectedId?: string;
  isLoading: boolean;
}

export const StrategyGenerator: React.FC<StrategyGeneratorProps> = ({ strategies, onSelect, selectedId, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
        <Sparkles className="animate-pulse text-indigo-500" size={48} />
        <p>Brainstorming viral concepts based on persona DNA...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {(strategies || []).map((strategy) => (
        <div 
          key={strategy.id}
          onClick={() => onSelect(strategy)}
          className={`
            group cursor-pointer relative p-6 rounded-xl border transition-all duration-200
            ${selectedId === strategy.id 
              ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' 
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'}
          `}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-slate-800 rounded-lg text-yellow-500">
              <Lightbulb size={20} />
            </div>
            {selectedId === strategy.id && (
              <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                Selected
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            {strategy.title}
          </h3>
          
          <p className="text-slate-300 text-sm mb-4 line-clamp-2">
            {strategy.concept}
          </p>
          
          <div className="text-xs text-slate-500 border-t border-slate-700/50 pt-3">
            <span className="font-semibold text-slate-400">Why it works:</span> {strategy.whyItWorks}
          </div>
        </div>
      ))}
    </div>
  );
};
