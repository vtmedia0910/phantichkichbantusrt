
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AnalysisResult, TranscriptData } from '../types';
import { MetricBadge } from './MetricBadge';
import { Activity, MessageSquare, Clock, BrainCircuit } from 'lucide-react';

interface AnalysisDashboardProps {
  transcript: TranscriptData;
  analysis: AnalysisResult;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ transcript, analysis }) => {
  
  // Prepare Pacing Data from transcript segments (grouping for smoother chart)
  const pacingData = (transcript?.segments || []).reduce((acc: any[], seg, idx) => {
    if (idx % 5 === 0) { // Downsample for readability
        acc.push({ time: Math.floor(seg.start), wpm: seg.wpm });
    }
    return acc;
  }, []);

  // Prepare Sentiment Data for Chart - DEFENSIVE CHECK added here
  const sentimentData = (analysis?.sentimentArc || []).map(pt => ({
    progress: `${pt.time}%`,
    score: pt.score
  }));

  // Ensure keyThemes is an array
  const keyThemes = analysis?.keyThemes || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBadge 
          label="Avg WPM" 
          value={transcript.avgWpm} 
          subValue="Words per minute" 
          icon={<Activity size={16} />} 
        />
        <MetricBadge 
          label="Duration" 
          value={`${Math.floor(transcript.duration / 60)}m ${Math.floor(transcript.duration % 60)}s`} 
          icon={<Clock size={16} />} 
        />
        <MetricBadge 
          label="Structure" 
          value={analysis.hookType || "N/A"} 
          subValue="Hook Style"
          icon={<BrainCircuit size={16} />} 
        />
        <MetricBadge 
          label="Word Count" 
          value={transcript.wordCount} 
          icon={<MessageSquare size={16} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pacing Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pacing Heatmap (WPM)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pacingData}>
                <defs>
                  <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickFormatter={(v) => `${Math.floor(v/60)}:${(v%60).toString().padStart(2,'0')}`} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelFormatter={(v) => `Time: ${Math.floor(v/60)}:${(v%60).toString().padStart(2,'0')}`}
                />
                <Area type="monotone" dataKey="wpm" stroke="#6366f1" fillOpacity={1} fill="url(#colorWpm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sentiment Arc</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData}>
                <XAxis dataKey="progress" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} domain={[-1, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Structure Summary</h3>
        <p className="text-slate-300 leading-relaxed">{analysis.structureSummary}</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {keyThemes.map((theme, i) => (
            <span key={i} className="px-3 py-1 bg-slate-800 text-slate-200 text-sm rounded-full border border-slate-700">
              #{theme}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
