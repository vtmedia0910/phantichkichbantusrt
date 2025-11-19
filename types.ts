
export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  wpm: number;
}

export interface TranscriptData {
  fileName: string;
  duration: number;
  wordCount: number;
  avgWpm: number;
  segments: TranscriptSegment[];
  fullText: string;
}

export interface SentimentPoint {
  time: number;
  score: number; // -1 to 1
}

export interface AnalysisResult {
  hookType: string;
  structureSummary: string;
  pacingHeatmap: { time: number; wpm: number }[];
  sentimentArc: SentimentPoint[];
  keyThemes: string[];
}

export interface DnaResult {
  personaName: string;
  styleSummary: string;
  systemPrompt: string;
}

export interface StrategyItem {
  id: string;
  title: string;
  concept: string;
  whyItWorks: string;
}

// CHANGED: Simplified to single text field for narration script
export interface GeneratedScriptRow {
  text: string;
}

export interface ScriptConfig {
  targetWordCount: number;
  parts: number;
  instructions: string;
}

export interface ScriptPart {
  partNumber: number;
  content: GeneratedScriptRow[];
}

export type AppStep = 'ingest' | 'analyze' | 'dna' | 'strategy' | 'write';

export interface ProjectState {
  transcript: TranscriptData | null;
  analysis: AnalysisResult | null;
  dna: DnaResult | null;
  strategies: StrategyItem[];
  selectedStrategy: StrategyItem | null;
  scriptParts: ScriptPart[];
}
