
import React, { useState, useRef, useEffect } from 'react';
import { Upload, BarChart2, Dna, Lightbulb, PenTool, FileText, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { parseSrt } from './services/srtParser';
import { analyzeTranscript, extractDna, generateStrategies, generateScriptPart } from './services/geminiService';
import { TranscriptData, AnalysisResult, DnaResult, StrategyItem, ScriptPart, AppStep, ScriptConfig } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { DnaViewer } from './components/DnaViewer';
import { StrategyGenerator } from './components/StrategyGenerator';
import { ScriptEditor } from './components/ScriptEditor';
import { ScriptConfigForm } from './components/ScriptConfigForm';

const steps: { id: AppStep; label: string; icon: React.ReactNode }[] = [
  { id: 'ingest', label: 'Upload', icon: <Upload size={18} /> },
  { id: 'analyze', label: 'Analyze', icon: <BarChart2 size={18} /> },
  { id: 'dna', label: 'Extract DNA', icon: <Dna size={18} /> },
  { id: 'strategy', label: 'Strategize', icon: <Lightbulb size={18} /> },
  { id: 'write', label: 'Write', icon: <PenTool size={18} /> },
];

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('ingest');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Data
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [dna, setDna] = useState<DnaResult | null>(null);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyItem | null>(null);
  
  // Script Generation State
  const [scriptConfig, setScriptConfig] = useState<ScriptConfig | null>(null);
  const [scriptParts, setScriptParts] = useState<ScriptPart[]>([]);

  // Check for API Key
  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("Missing API_KEY environment variable. Please restart with a valid key.");
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingStatus("Parsing SRT file...");
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseSrt(text, file.name);
      setTranscript(parsed);
      setCurrentStep('analyze');
      
      // Auto-trigger analysis
      await runAnalysis(parsed.fullText);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse SRT file.");
      setLoading(false);
    }
  };

  const runAnalysis = async (text: string) => {
    setLoading(true);
    setLoadingStatus("Analyzing pacing, structure, and sentiment...");
    setError(null);
    try {
      const result = await analyzeTranscript(text);
      setAnalysis(result);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setLoading(false);
    }
  };

  const runDnaExtraction = async () => {
    if (!transcript || !analysis) return;
    setLoading(true);
    setLoadingStatus("Reverse engineering persona DNA...");
    setCurrentStep('dna');
    setError(null);
    try {
      const result = await extractDna(transcript.fullText, analysis);
      setDna(result);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "DNA Extraction failed.");
      setLoading(false);
    }
  };

  const runStrategyGeneration = async () => {
    if (!dna || !transcript) return;
    setLoading(true);
    setLoadingStatus("Brainstorming viral concepts...");
    setCurrentStep('strategy');
    setError(null);
    try {
      const result = await generateStrategies(dna, transcript.fullText);
      setStrategies(result);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Strategy generation failed.");
      setLoading(false);
    }
  };

  const handleStrategySelect = (strategy: StrategyItem) => {
    setSelectedStrategy(strategy);
    setScriptConfig(null);
    setScriptParts([]);
    setCurrentStep('write');
  };

  const handleScriptConfigSubmit = (config: ScriptConfig) => {
    setScriptConfig(config);
    setScriptParts([]);
    // Don't start auto-generating. The user will click "Start" in the editor view.
  };

  const handleGenerateNextPart = async () => {
    if (!dna || !selectedStrategy || !scriptConfig) return;

    const nextPartNum = scriptParts.length + 1;
    if (nextPartNum > scriptConfig.parts) return;

    setLoading(true);
    setLoadingStatus(`Generating Part ${nextPartNum} of ${scriptConfig.parts}...`);
    setError(null);

    // Construct context from previous parts (up to last 3000 chars to keep it fresh)
    // UPDATED: Use only 'text' field for context
    const previousContext = scriptParts
      .map(p => p.content.map(row => row.text).join(' '))
      .join(' ');

    try {
      const partContent = await generateScriptPart(
        dna,
        selectedStrategy.title,
        scriptConfig,
        nextPartNum,
        previousContext
      );

      const newPart: ScriptPart = {
        partNumber: nextPartNum,
        content: partContent
      };

      setScriptParts(prev => [...prev, newPart]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Script generation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Dna size={24} />
            <span>ScriptDNA</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            // Only allow navigating back to previous steps if data exists
            const isEnabled = 
              step.id === 'ingest' || 
              (step.id === 'analyze' && transcript) ||
              (step.id === 'dna' && analysis) ||
              (step.id === 'strategy' && dna) ||
              (step.id === 'write' && selectedStrategy);

            return (
              <button
                key={step.id}
                disabled={!isEnabled}
                onClick={() => isEnabled && setCurrentStep(step.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : isEnabled 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                      : 'text-slate-700 cursor-not-allowed'}
                `}
              >
                {step.icon}
                <span className="font-medium text-sm">{step.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-400">Model Status</p>
            <div className="flex justify-between">
              <span>Gemini Flash</span>
              <span className="text-green-400">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>Gemini Pro</span>
              <span className="text-indigo-400">Thinking</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 max-w-6xl mx-auto">
        {/* Header Area */}
        <div className="mb-8 flex justify-between items-end">
          <div>
             <h1 className="text-3xl font-bold text-white mb-2">
               {steps.find(s => s.id === currentStep)?.label}
             </h1>
             <p className="text-slate-400">
               {currentStep === 'ingest' && "Upload your SRT file to begin reverse engineering."}
               {currentStep === 'analyze' && "Review pacing and structure before extraction."}
               {currentStep === 'dna' && "The AI Architect has decoded the persona."}
               {currentStep === 'strategy' && "Select a concept to generate a script."}
               {currentStep === 'write' && "Configure and generate your final viral script."}
             </p>
          </div>
          
          {/* Action Buttons based on step */}
          {currentStep === 'analyze' && analysis && (
             <button 
               onClick={runDnaExtraction}
               disabled={loading}
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Dna size={18} /> Extract DNA
             </button>
          )}
           {currentStep === 'dna' && dna && (
             <button 
               onClick={runStrategyGeneration}
               disabled={loading}
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Lightbulb size={18} /> Generate Ideas
             </button>
          )}
          {currentStep === 'strategy' && strategies.length > 0 && (
             <button 
               onClick={runStrategyGeneration}
               disabled={loading}
               className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
             >
               <RefreshCw size={18} /> Regenerate Ideas
             </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Overlay - Global for Analysis/DNA/Strategy, localized for Write */}
        {loading && currentStep !== 'write' && (
           <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="animate-spin mr-3 h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              {loadingStatus || "Processing..."}
           </div>
        )}

        {/* Step Content */}
        
        {/* STEP 1: INGEST */}
        {currentStep === 'ingest' && (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors cursor-pointer group"
               onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              accept=".srt" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <div className="bg-slate-800 p-6 rounded-full mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <FileText size={32} className="text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200">Upload .SRT Transcript</h3>
            <p className="text-slate-500 mt-2">Click to browse or drag and drop</p>
          </div>
        )}

        {/* STEP 2: ANALYZE */}
        {currentStep === 'analyze' && transcript && analysis && !loading && (
          <AnalysisDashboard transcript={transcript} analysis={analysis} />
        )}

        {/* STEP 3: DNA */}
        {currentStep === 'dna' && dna && !loading && (
          <DnaViewer dna={dna} />
        )}

        {/* STEP 4: STRATEGY */}
        {currentStep === 'strategy' && (
           <StrategyGenerator 
             strategies={strategies} 
             isLoading={loading} 
             onSelect={handleStrategySelect} 
             selectedId={selectedStrategy?.id}
           />
        )}

        {/* STEP 5: WRITE */}
        {currentStep === 'write' && selectedStrategy && (
          <>
            {!scriptConfig ? (
              <ScriptConfigForm 
                topic={selectedStrategy.title} 
                onGenerate={handleScriptConfigSubmit}
              />
            ) : (
              <ScriptEditor 
                scriptParts={scriptParts}
                topic={selectedStrategy.title}
                totalParts={scriptConfig.parts}
                isLoading={loading}
                onNextPart={handleGenerateNextPart}
                onReset={() => { setScriptConfig(null); setScriptParts([]); }}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default App;
    