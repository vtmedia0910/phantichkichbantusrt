
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DnaResult, StrategyItem, GeneratedScriptRow, ScriptConfig } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON strings if the model wraps them in markdown
const cleanJsonString = (str: string): string => {
  let clean = str.trim();
  // Remove markdown code blocks
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // FIX: Truncate extremely long floating point numbers (more than 10 decimal places)
  // This fixes the "Failed to parse analysis JSON" error caused by 100+ digit floats
  clean = clean.replace(/(\d+\.\d{10})\d+/g, '$1');

  return clean;
};

// Helper to safely parse JSON that might be truncated due to token limits
const safeJsonParse = (jsonStr: string): any => {
  const cleaned = cleanJsonString(jsonStr);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // If parsing fails, check if it looks like a truncated array
    if (cleaned.trim().startsWith('[')) {
      console.warn("JSON parse failed, attempting to repair truncated array...");
      // Find the last closing brace '}' which signifies the end of an object
      const lastObjectEnd = cleaned.lastIndexOf('}');
      
      if (lastObjectEnd !== -1) {
        // Substring up to the last valid object end
        let repaired = cleaned.substring(0, lastObjectEnd + 1);
        // Close the array
        repaired += ']';
        
        try {
          const result = JSON.parse(repaired);
          console.log(`Successfully repaired JSON. Recovered ${result.length} items.`);
          return result;
        } catch (repairError) {
          console.error("JSON repair failed:", repairError);
          // Fall through to throw original error
        }
      }
    }
    throw e;
  }
};

export const analyzeTranscript = async (transcriptText: string): Promise<AnalysisResult> => {
  const prompt = `
    Analyze the following video transcript. 
    Return a JSON object with the following fields:
    1. hookType (string): Identify the style of the first 5-10 seconds (e.g., "Curiosity Gap", "Statement of Fact", "Visual Shock").
    2. structureSummary (string): A concise summary of the narrative structure (e.g., "Problem-Agitate-Solution" or "Chronological Storytelling").
    3. keyThemes (array of strings): Top 3 themes.
    4. sentimentArc (array of objects): Sample sentiment every 10% of the text. Each object has { "time": number (percentage 0-100), "score": number (-1 to 1) }.
    
    Transcript:
    ${transcriptText.substring(0, 25000)} 
    (Truncated if too long for safe analysis in one go)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hookType: { type: Type.STRING },
          structureSummary: { type: Type.STRING },
          keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentimentArc: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.NUMBER },
                score: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  
  try {
    const data = safeJsonParse(text);
    
    // Defensive coding: Ensure all expected fields exist
    return {
      hookType: data.hookType || "Unknown Style",
      structureSummary: data.structureSummary || "Analysis incomplete.",
      keyThemes: Array.isArray(data.keyThemes) ? data.keyThemes : [],
      sentimentArc: Array.isArray(data.sentimentArc) ? data.sentimentArc : [],
      pacingHeatmap: [] // Calculated in frontend usually, or placeholder
    };
  } catch (e) {
    console.error("Failed to parse analysis JSON:", text);
    throw new Error("Failed to parse analysis results.");
  }
};

export const extractDna = async (transcriptText: string, analysis: AnalysisResult): Promise<DnaResult> => {
  const prompt = `
    You are an expert AI Architect. Your task is to reverse-engineer the "DNA" of this script.
    
    Transcript Context:
    ${transcriptText.substring(0, 30000)}

    Analysis Context:
    Structure: ${analysis.structureSummary}
    Hook: ${analysis.hookType}

    Task:
    1. Deeply analyze the vocabulary complexity, sentence structure variance, and rhetorical devices used.
    2. Define a specific "Persona" (e.g., "The Skeptical Futurist").
    3. Create a high-fidelity SYSTEM PROMPT that I could paste into an LLM to make it write *exactly* like this author.
    
    The system prompt must be detailed, covering tone, forbidden words, formatting quirks, and how to handle pacing.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personaName: { type: Type.STRING },
          styleSummary: { type: Type.STRING },
          systemPrompt: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No DNA extracted from model");
  
  try {
    const result = safeJsonParse(text);
    return {
      personaName: result.personaName || "Unknown Persona",
      styleSummary: result.styleSummary || "No style summary available",
      systemPrompt: result.systemPrompt || ""
    };
  } catch (e) {
    console.error("Failed to parse DNA JSON:", text);
    throw new Error("Failed to parse DNA results.");
  }
};

export const generateStrategies = async (dna: DnaResult, context: string): Promise<StrategyItem[]> => {
  const prompt = `
    Based on the following persona and style DNA, generate 4 viral video content ideas.
    
    Persona: ${dna.personaName}
    Style: ${dna.styleSummary}
    Original Context: ${context.substring(0, 1000)}...

    Return JSON array of ideas.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            concept: { type: Type.STRING },
            whyItWorks: { type: Type.STRING }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No strategies generated");
  
  try {
    const parsed = safeJsonParse(text);
    if (Array.isArray(parsed)) return parsed;
    // Handle object wrapper case
    if (parsed && typeof parsed === 'object') {
      // Try to find an array property
      const values = Object.values(parsed);
      const arrayVal = values.find(v => Array.isArray(v));
      if (arrayVal) return arrayVal as StrategyItem[];
    }
    return [];
  } catch (e) {
    console.error("Failed to parse strategy JSON:", text);
    throw new Error("Failed to parse strategy results.");
  }
};

export const generateScriptPart = async (
  dna: DnaResult, 
  topic: string, 
  config: ScriptConfig,
  currentPart: number,
  previousContext: string
): Promise<GeneratedScriptRow[]> => {
  
  const totalParts = config.parts || 1;
  const isFirstPart = currentPart === 1;
  const isLastPart = currentPart === totalParts;
  const wordsPerPart = Math.round(config.targetWordCount / totalParts);

  let specificInstructions = "";
  if (isFirstPart && isLastPart) {
    specificInstructions = "Write the COMPLETE script from start to finish.";
  } else if (isFirstPart) {
    specificInstructions = `Write PART 1 of ${totalParts} (The Intro/Hook). Do NOT finish the script yet.`;
  } else if (isLastPart) {
    specificInstructions = `Write PART ${currentPart} of ${totalParts} (The Conclusion/Outro). Wrap up all points.`;
  } else {
    specificInstructions = `Write PART ${currentPart} of ${totalParts} (Middle Section). Maintain flow from the previous text.`;
  }

  const prompt = `
    ACT AS THE PERSONA defined below.
    
    SYSTEM PROMPT / STYLE DNA:
    ${dna.systemPrompt}
    
    TASK:
    Write a HIGH-QUALITY NARRATIVE SCRIPT for a video about: "${topic}".
    This is a TEXT-ONLY script for a narrator. DO NOT include visual descriptions, timestamps, or speaker labels.
    
    CRITICAL QUALITY INSTRUCTIONS:
    1. Focus 100% on the content depth, logical flow, rhetorical power, and vocabulary.
    2. The output must be ready for a professional voiceover artist.
    3. Maximize engagement by using the exact pacing and tone defined in the persona DNA.
    4. The content should be dense, valuable, and insightful.
    
    Target Word Count for this part: ~${wordsPerPart} words.
    User Instructions: ${config.instructions}
    
    CURRENT STEP: ${specificInstructions}
    
    ${!isFirstPart ? `PREVIOUS CONTEXT (The story so far - continue seamlessly): "...${previousContext.slice(-2000)}"` : ''}
    
    IMPORTANT: Return ONLY a strict JSON array.
    
    OUTPUT FORMAT:
    Return a JSON array of objects. Each object represents a paragraph or block of text.
    [{ "text": "The first paragraph of the script..." }, { "text": "The second paragraph..." }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        // Increased thinking budget significantly to ensure high quality content logic
        thinkingConfig: { thinkingBudget: 8192 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error(`No script generated for part ${currentPart}`);
    
    const parsed = safeJsonParse(text);
    
    if (Array.isArray(parsed)) return parsed;
    
    // Robust fallback if model returns object wrapper like { "script": [...] }
    if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.content)) return parsed.content;
        if (Array.isArray(parsed.script)) return parsed.script;
        if (Array.isArray(parsed.data)) return parsed.data;
        
        // If it's just a single object row, wrap it
        if (parsed.text) return [parsed];
    }
    
    console.warn("Unexpected script format received:", parsed);
    return []; // Return empty array instead of throwing to avoid crashing UI
  } catch (e) {
    console.error(`Error generating part ${currentPart}:`, e);
    throw new Error(`Failed at part ${currentPart}: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
};
