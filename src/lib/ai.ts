import type { MiniGame } from '../data/miniGames';
import {
  TRIVIA_GAMES,
  BUDGET_PUZZLES,
  MEMORY_MATCHES,
  QUICK_SORTS
} from '../data/miniGames';


// ==================== AZURE CONFIG ====================
const AZURE_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;
const AZURE_API_VERSION =
  import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-04-01-preview';


// ==================== STATE ====================
let isFetching = false;
let ongoingPromise: Promise<MiniGame | null> | null = null;
let previousQuestions: string[] = [];


// ==================== TYPES ====================
export type AIRequestType =
  | 'trivia'
  | 'budget_puzzle'
  | 'memory_match'
  | 'quick_sort';


export type Difficulty = 'easy' | 'medium' | 'hard';


// ==================== SETTINGS ====================
export function getDifficulty(): Difficulty {
  return (localStorage.getItem('ai_difficulty') as Difficulty) || 'medium';
}


// ==================== CATEGORY ====================
function getCategory(): string {
  return 'FBLA business concepts';
}


// ==================== PROMPT ====================
function buildPrompt(
  type: AIRequestType,
  category: string,
  difficulty: Difficulty
): string {
  const previousQsText = previousQuestions.length
    ? previousQuestions.map(q => `"${q}"`).join(', ')
    : 'None';


  return `
Role: You are an educational game master for PixelPets, a virtual pet app for FBLA students.


Task: Generate ONE unique ${type} game.


Rules:
- Topic: ${category}
- Difficulty: ${difficulty}
- Do not repeat: ${previousQsText}
- Return ONLY raw JSON.


TRIVIA:
{"type":"trivia","question":"","options":["","","",""],"answer":0,"explanation":"","category":"${category}"}


BUDGET_PUZZLE:
{"type":"budget_puzzle","scenario":"","totalBudget":0,"items":[{"name":"","cost":0,"essential":true}],"correctEssentials":[""]}


MEMORY_MATCH:
{"type":"memory_match","theme":"","pairs":[{"term":"","definition":""}]}


QUICK_SORT:
{"type":"quick_sort","instruction":"","items":["","","",""],"correctOrder":[""],"category":"${category}"}
`;
}


// ==================== SHUFFLE ====================
function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}


function ensureShuffled(game: MiniGame): MiniGame {
  if (game.type === 'trivia') {
    const correct = game.options[game.answer];
    const shuffled = shuffleArray(game.options);
    return {
      ...game,
      options: shuffled,
      answer: shuffled.indexOf(correct)
    };
  }


  if (game.type === 'quick_sort') {
    let shuffled = shuffleArray(game.items);
    while (JSON.stringify(shuffled) === JSON.stringify(game.correctOrder)) {
      shuffled = shuffleArray(game.items);
    }
    return { ...game, items: shuffled };
  }


  return game;
}


// ==================== FALLBACK ====================
function getFallbackGame(type: AIRequestType): MiniGame {
  const map = {
    trivia: TRIVIA_GAMES,
    budget_puzzle: BUDGET_PUZZLES,
    memory_match: MEMORY_MATCHES,
    quick_sort: QUICK_SORTS
  };


  const list = map[type];
  return list[Math.floor(Math.random() * list.length)];
}


// ==================== API CALL ====================
async function apiCall(type: AIRequestType): Promise<MiniGame | null> {
  if (isFetching && ongoingPromise) return ongoingPromise;


  if (!AZURE_KEY || !AZURE_ENDPOINT || !AZURE_DEPLOYMENT) {
    console.warn('Azure not configured → using fallback');
    return getFallbackGame(type);
  }


  isFetching = true;


  ongoingPromise = (async () => {
    const category = getCategory();
    const difficulty = getDifficulty();
    const prompt = buildPrompt(type, category, difficulty);


    try {
      const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/responses?api-version=${AZURE_API_VERSION}`;


      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_KEY
        },
        body: JSON.stringify({
          input: prompt,
          max_output_tokens: 500
        })
      });


      if (!response.ok) {
        console.error('Azure error → fallback');
        return getFallbackGame(type);
      }


      const data = await response.json();
      const rawText = data.output?.[0]?.content?.[0]?.text;


      if (!rawText) return getFallbackGame(type);


      const jsonStr = rawText.replace(/```json|```/g, '').trim();


      const parsed = JSON.parse(jsonStr) as MiniGame;


      // track history
      if (parsed.type === 'trivia') {
        previousQuestions.push(parsed.question);
      }


      if (previousQuestions.length > 50) {
        previousQuestions = previousQuestions.slice(-50);
      }


      return ensureShuffled(parsed);
    } catch (err) {
      console.error('Request failed → fallback', err);
      return getFallbackGame(type);
    } finally {
      isFetching = false;
      ongoingPromise = null;
    }
  })();


  return ongoingPromise;
}


// ==================== PUBLIC FUNCTION ====================
export async function generateAIQuestion(
  type: AIRequestType = 'trivia'
): Promise<MiniGame> {
  const result = await apiCall(type);
  return result ?? getFallbackGame(type);
}
