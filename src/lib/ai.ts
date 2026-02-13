import type { TriviaGame, MiniGame } from '../data/miniGames';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * GEMINI_MODELS Configuration
 * LOGIC: Ordered by Requests-Per-Minute (RPM) and Requests-Per-Day (RPD) limits.
 * We prioritize "Flash" models which are faster and cheaper, then fallback to "Pro" models.
 * This ensures the app remains responsive even under heavy usage.
 */
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

// Persist last successful model in localStorage for faster first requests
const LAST_WORKING_MODEL_KEY = 'ai_last_working_model';

function getLastWorkingModel(): string | null {
  return localStorage.getItem(LAST_WORKING_MODEL_KEY);
}

function setLastWorkingModel(model: string): void {
  localStorage.setItem(LAST_WORKING_MODEL_KEY, model);
}

function clearLastWorkingModel(): void {
  localStorage.removeItem(LAST_WORKING_MODEL_KEY);
}

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
 * LOGIC: To maximize reliability and minimize cost/rate-limits, we rotate through
 * a list of available Gemini models (Flash, Pro, Lite). If one model fails (429 Too Many Requests),
 * we automatically fallback to the next one in the list.
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
  
  // No API key configured - cannot generate questions
  console.warn('VITE_GEMINI_API_KEY not configured. Set it in .env to enable AI questions.');
  return null;
}

/**
 * Try each model in rotation until one succeeds
 * Prioritizes the last working model if available
 */
async function generateDirectWithRotation(category: string, type: AIRequestType): Promise<MiniGame | null> {
  // Try last working model first
  const lastWorkingModel = getLastWorkingModel();
  if (lastWorkingModel && GEMINI_MODELS.includes(lastWorkingModel)) {
    console.log(`Trying last working model first: ${lastWorkingModel}`);
    const result = await tryGenerateWithModel(lastWorkingModel, category, type);
    if (result.success && result.data) {
      return { ...result.data, generatedBy: lastWorkingModel };
    }
    // Last working model failed, clear it and continue with rotation
    console.log(`Last working model ${lastWorkingModel} failed, trying rotation...`);
    clearLastWorkingModel();
  }

  const startIndex = currentModelIndex;
  
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelIndex = (startIndex + i) % GEMINI_MODELS.length;
    const model = GEMINI_MODELS[modelIndex];
    
    // Skip if we just tried this model
    if (model === lastWorkingModel) continue;
    
    console.log(`Trying model: ${model}`);
    
    const result = await tryGenerateWithModel(model, category, type);
    
    if (result.success && result.data) {
      // Rotate to next model for next request & persist this working model
      currentModelIndex = (modelIndex + 1) % GEMINI_MODELS.length;
      setLastWorkingModel(model);
      return { ...result.data, generatedBy: model };
    }
    
    if (result.status === 429) {
      console.log(`${model} rate limited, trying next...`);
      continue;
    }
    
    console.log(`${model} failed with status ${result.status}, trying next...`);
  }
  
  // All models failed - cannot generate
  console.error('All Gemini models exhausted. Cannot generate AI questions.');
  return null;
}

// Difficulty Preference
export type Difficulty = 'easy' | 'medium' | 'hard';

export function getDifficulty(): Difficulty {
  return (localStorage.getItem('ai_difficulty') as Difficulty) || 'medium';
}

export function setDifficulty(diff: Difficulty): void {
  localStorage.setItem('ai_difficulty', diff);
}

/**
 * Try to generate with a specific model
 */
async function tryGenerateWithModel(
  model: string, 
  category: string,
  type: AIRequestType
): Promise<{ success: boolean; data?: MiniGame; status?: number }> {
  try {
    let prompt = "";
    const difficulty = getDifficulty();
    
    // Difficulty Strings
    const levelDesc = {
      easy: "very simple, beginner-level, clear and easy to understand",
      medium: "standard difficulty, intermediate level",
      hard: "challenging, advanced level, requires deep understanding"
    };

    if (type === 'budget_puzzle') {
       prompt = `Generate a creative "${difficulty}" difficulty "Budget Puzzle" scenario about ${category}. 
        User has a Total Budget. Provide a list of items (some essential, some not). 
        The sum of ESSENTIAL items must be <= Total Budget. 
        Total Budget should be between $50 and $500.
        ${difficulty === 'easy' ? 'Keep math simple (multiples of 10).' : ''}
        ${difficulty === 'hard' ? 'Make the budget tight and choices tricky.' : ''}
        Return ONLY valid JSON:
        {"type":"budget_puzzle","scenario":"You are planning X...","totalBudget":100,"items":[{"name":"Item A","cost":20,"essential":true},{"name":"Luxury Item","cost":50,"essential":false}],"correctEssentials":["Item A"]}`;
    } else {
        // Trivia
        prompt = `Generate a UNIQUE and RANDOM trivia question about ${category}.
        Difficulty Level: ${difficulty.toUpperCase()} (${levelDesc[difficulty]}).
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
