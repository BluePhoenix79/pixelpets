import { supabase } from './supabase';
import type { TriviaGame, MiniGame } from '../data/miniGames';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Models ordered by RPM/RPD - spreads usage evenly for maximum total requests
// Only text-out compatible models included
const GEMINI_MODELS = [
  'gemini-3-flash',           // 5 RPM, 20 RPD
  'gemini-2.5-flash',         // 5 RPM, 20 RPD
  'gemini-2.5-flash-lite',    // 10 RPM, 20 RPD
  'gemma-3-1b',               // 30 RPM, 14.4K RPD
  'gemma-3-2b',               // 30 RPM, 14.4K RPD
  'gemma-3-4b',               // 30 RPM, 14.4K RPD
  'gemma-3-12b',              // 30 RPM, 14.4K RPD
  'gemma-3-27b',              // 30 RPM, 14.4K RPD
];

// Track which model to try first (rotates on each call)
let currentModelIndex = 0;

// Extended trivia with model info
export interface AITriviaGame extends TriviaGame {
  generatedBy?: string;
}

export type AIRequestType = 'trivia' | 'budget_puzzle';

// Preset topic options
export const QUESTION_TOPICS = [
  { id: 'general', label: 'General Business', value: 'general business knowledge for beginners' },
  { id: 'fbla', label: 'FBLA Basics', value: 'FBLA organization basics and history' },
  { id: 'finance', label: 'Personal Finance', value: 'simple personal finance and budgeting' },
  { id: 'marketing', label: 'Marketing', value: 'basic marketing concepts' },
  { id: 'leadership', label: 'Leadership', value: 'leadership and teamwork skills' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', value: 'starting a small business' },
];

// Get/set topic preference from localStorage
export function getQuestionTopic(): string {
  return localStorage.getItem('ai_question_topic') || 'general';
}

export function setQuestionTopic(topicId: string): void {
  localStorage.setItem('ai_question_topic', topicId);
}

export function getCustomTopic(): string {
  return localStorage.getItem('ai_custom_topic') || '';
}

export function setCustomTopic(topic: string): void {
  localStorage.setItem('ai_custom_topic', topic);
}

/**
 * Generate a question using direct API call with model rotation
 * Falls back to Supabase Edge Function if no API key is configured
 */
export async function generateAIQuestion(type: AIRequestType = 'trivia'): Promise<MiniGame | null> {
  // Get topic preference
  const topicId = getQuestionTopic();
  const customTopic = getCustomTopic();
  
  let category: string;
  if (topicId === 'custom' && customTopic) {
    category = customTopic;
  } else {
    const topic = QUESTION_TOPICS.find(t => t.id === topicId);
    category = topic?.value || QUESTION_TOPICS[0].value;
  }

  // Try direct API call first (if key is configured in .env)
  if (GEMINI_API_KEY) {
    return await generateDirectWithRotation(category, type);
  }
  
  // Fallback to Supabase Edge Function
  return await generateViaSupabase(category, type);
}

/**
 * Try each model in rotation until one succeeds
 */
async function generateDirectWithRotation(category: string, type: AIRequestType): Promise<MiniGame | null> {
  const startIndex = currentModelIndex;
  
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelIndex = (startIndex + i) % GEMINI_MODELS.length;
    const model = GEMINI_MODELS[modelIndex];
    
    console.log(`Trying model: ${model}`);
    
    const result = await tryGenerateWithModel(model, category, type);
    
    if (result.success && result.data) {
      // Rotate to next model for next request
      currentModelIndex = (modelIndex + 1) % GEMINI_MODELS.length;
      return { ...result.data, generatedBy: model };
    }
    
    if (result.status === 429) {
      console.log(`${model} rate limited, trying next...`);
      continue;
    }
    
    console.log(`${model} failed with status ${result.status}, trying next...`);
  }
  
  // All models failed, try Supabase fallback
  console.log('All models exhausted, trying Supabase fallback...');
  return await generateViaSupabase(category, type);
}

/**
 * Try to generate with a specific model - EASIER questions
 */
async function tryGenerateWithModel(
  model: string, 
  category: string,
  type: AIRequestType
): Promise<{ success: boolean; data?: MiniGame; status?: number }> {
  try {
    let prompt = "";
    
    if (type === 'budget_puzzle') {
       prompt = `Generate a creative "Budget Puzzle" scenario about ${category}. 
        User has a Total Budget. Provide a list of items (some essential, some not). 
        The sum of ESSENTIAL items must be <= Total Budget. 
        Total Budget should be between $50 and $500.
        Return ONLY valid JSON:
        {"type":"budget_puzzle","scenario":"You are planning X...","totalBudget":100,"items":[{"name":"Item A","cost":20,"essential":true},{"name":"Luxury Item","cost":50,"essential":false}],"correctEssentials":["Item A"]}`;
    } else {
        // Default Trivia
        prompt = `Generate a UNIQUE and RANDOM trivia question about ${category}.
        Do not repeat common questions.
        Return ONLY valid JSON with no markdown, no backticks, no extra text:
        {"type":"trivia","question":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"Why correct","category":"${category}"}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 300 }
        })
      }
    );

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { success: false, status: 500 };
    }

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const questionData = JSON.parse(jsonStr) as MiniGame;
    
    return { success: true, data: questionData };
    
  } catch (err) {
    console.error(`Error with model ${model}:`, err);
    return { success: false, status: 500 };
  }
}

/**
 * Supabase Edge Function call (secure, API key hidden)
 */
async function generateViaSupabase(category: string, type: AIRequestType): Promise<MiniGame | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: { category, type }
    });

    if (error) {
      console.error('Supabase function error:', error);
      return null;
    }

    return { ...data, generatedBy: 'Supabase Edge Function' } as MiniGame;
  } catch (err) {
    console.error('Failed to generate AI question:', err);
    return null;
  }
}
