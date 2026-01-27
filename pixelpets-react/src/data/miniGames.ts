// FBLA-Themed Educational Mini-Games

// ============================================
// EDUCATIONAL MINI-GAMES FOR TASK COMPLETION
// All games are FBLA (Future Business Leaders of America) themed
// ============================================

// Game types available (no math_challenge)
export type GameType = 'budget_puzzle' | 'memory_match' | 'quick_sort' | 'trivia';

export interface BudgetPuzzle {
  type: 'budget_puzzle';
  scenario: string;
  totalBudget: number;
  items: { name: string; cost: number; essential: boolean }[];
  correctEssentials: string[];
  generatedBy?: string;
}

export interface MemoryMatch {
  type: 'memory_match';
  pairs: { term: string; definition: string }[];
  theme: string;
  generatedBy?: string;
}

export interface QuickSort {
  type: 'quick_sort';
  instruction: string;
  items: string[];
  correctOrder: string[];
  category: string;
  generatedBy?: string;
}

export interface TriviaGame {
  type: 'trivia';
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  category: string;
  generatedBy?: string;
}

export type MiniGame = BudgetPuzzle | MemoryMatch | QuickSort | TriviaGame;

// ============================================
// BUDGET PUZZLES - FBLA Business Planning
// ============================================
export const BUDGET_PUZZLES: BudgetPuzzle[] = [
  {
    type: 'budget_puzzle',
    scenario: "You're planning an FBLA chapter meeting. Pick the ESSENTIAL items for $75 budget!",
    totalBudget: 75,
    items: [
      { name: "Meeting room supplies", cost: 15, essential: true },
      { name: "Printed agendas", cost: 10, essential: true },
      { name: "Name tags", cost: 8, essential: true },
      { name: "Fancy catering", cost: 50, essential: false },
      { name: "Basic refreshments", cost: 20, essential: true },
      { name: "Decorative balloons", cost: 25, essential: false },
    ],
    correctEssentials: ["Meeting room supplies", "Printed agendas", "Name tags", "Basic refreshments"]
  },
  {
    type: 'budget_puzzle',
    scenario: "FBLA State Competition prep! You have $200. What do you NEED?",
    totalBudget: 200,
    items: [
      { name: "Competition registration", cost: 50, essential: true },
      { name: "Professional attire", cost: 75, essential: true },
      { name: "Study materials", cost: 30, essential: true },
      { name: "Luxury hotel upgrade", cost: 100, essential: false },
      { name: "Travel expenses", cost: 40, essential: true },
      { name: "Souvenir t-shirts", cost: 25, essential: false },
    ],
    correctEssentials: ["Competition registration", "Professional attire", "Study materials", "Travel expenses"]
  },
  {
    type: 'budget_puzzle',
    scenario: "Starting a student business! $150 startup budget. Pick essentials!",
    totalBudget: 150,
    items: [
      { name: "Business cards", cost: 25, essential: true },
      { name: "Marketing materials", cost: 30, essential: true },
      { name: "Initial inventory", cost: 50, essential: true },
      { name: "Fancy logo design", cost: 80, essential: false },
      { name: "Basic website", cost: 35, essential: true },
      { name: "Office decorations", cost: 40, essential: false },
    ],
    correctEssentials: ["Business cards", "Marketing materials", "Initial inventory", "Basic website"]
  },
  {
    type: 'budget_puzzle',
    scenario: "Charity Fundraiser! You have $100 budget. Keep costs low to donate more!",
    totalBudget: 100,
    items: [
      { name: "Donation jar", cost: 5, essential: true },
      { name: "Venue rental", cost: 50, essential: false },
      { name: "Flyers", cost: 15, essential: true },
      { name: "Live Band", cost: 80, essential: false },
      { name: "Cookies for sale", cost: 20, essential: true },
      { name: "Decorations", cost: 20, essential: false },
    ],
    correctEssentials: ["Donation jar", "Flyers", "Cookies for sale"]
  },
  {
    type: 'budget_puzzle',
    scenario: "Office supply run! You need to restock for $60. Don't overspend!",
    totalBudget: 60,
    items: [
      { name: "Printer paper", cost: 15, essential: true },
      { name: "Ink cartridges", cost: 30, essential: true },
      { name: "Fancy pens", cost: 25, essential: false },
      { name: "Stapler", cost: 10, essential: true },
      { name: "Espresso machine", cost: 150, essential: false },
      { name: "Notebooks", cost: 20, essential: false },
    ],
    correctEssentials: ["Printer paper", "Ink cartridges", "Stapler"]
  }
];

// ============================================
// MEMORY MATCH - FBLA & Business Terms
// ============================================
export const MEMORY_MATCHES: MemoryMatch[] = [
  {
    type: 'memory_match',
    theme: "FBLA Basics",
    pairs: [
      { term: "FBLA Motto", definition: "Service, Education, and Progress" },
      { term: "FBLA Colors", definition: "Blue and Gold" },
      { term: "FBLA Founded", definition: "1940" },
      { term: "FBLA Goal", definition: "Develop future business leaders" },
    ]
  },
  {
    type: 'memory_match',
    theme: "Business Leadership",
    pairs: [
      { term: "Entrepreneur", definition: "Person who starts a business" },
      { term: "Leadership", definition: "Ability to guide and inspire others" },
      { term: "Networking", definition: "Building professional relationships" },
      { term: "Ethics", definition: "Moral principles in business" },
    ]
  },
  {
    type: 'memory_match',
    theme: "Financial Literacy",
    pairs: [
      { term: "Budget", definition: "A plan for spending money" },
      { term: "Profit", definition: "Revenue minus expenses" },
      { term: "Investment", definition: "Money put to work for growth" },
      { term: "Interest", definition: "Cost of borrowing or reward for saving" },
    ]
  },
  {
    type: 'memory_match',
    theme: "FBLA Competitive Events",
    pairs: [
      { term: "Introduction to Business", definition: "Objective test on business basics" },
      { term: "Public Speaking", definition: "4-minute speech on business topic" },
      { term: "Accounting I", definition: "Test on accounting principles" },
      { term: "Business Plan", definition: "Written proposal for new business" },
    ]
  },
];

// ============================================
// QUICK SORT - FBLA & Business Prioritization
// ============================================
export const QUICK_SORTS: QuickSort[] = [
  {
    type: 'quick_sort',
    instruction: "Order these FBLA competitive event categories from TEAM to INDIVIDUAL:",
    items: ["Parliamentary Procedure (Team)", "Public Speaking (Individual)", "Business Plan (Team)", "Impromptu Speaking (Individual)"],
    correctOrder: ["Parliamentary Procedure (Team)", "Business Plan (Team)", "Public Speaking (Individual)", "Impromptu Speaking (Individual)"],
    category: "FBLA Events"
  },
  {
    type: 'quick_sort',
    instruction: "Order these business startup steps from FIRST to LAST:",
    items: ["Launch business", "Create business plan", "Research the market", "Secure funding"],
    correctOrder: ["Research the market", "Create business plan", "Secure funding", "Launch business"],
    category: "Entrepreneurship"
  },
  {
    type: 'quick_sort',
    instruction: "Order these leadership skills from FOUNDATION to ADVANCED:",
    items: ["Strategic vision", "Communication", "Team building", "Active listening"],
    correctOrder: ["Active listening", "Communication", "Team building", "Strategic vision"],
    category: "Leadership Development"
  },
  {
    type: 'quick_sort',
    instruction: "Order from BEST to WORST professional behavior:",
    items: ["Arriving late to meetings", "Dressing professionally", "Active participation", "Using phone during presentations"],
    correctOrder: ["Dressing professionally", "Active participation", "Arriving late to meetings", "Using phone during presentations"],
    category: "Professional Etiquette"
  },
];

// ============================================
// TRIVIA GAMES - FBLA Knowledge
// ============================================
export const TRIVIA_GAMES: TriviaGame[] = [
  { type: 'trivia', question: "What does FBLA stand for?", options: ["Future Business Leaders of America", "Federal Business Loan Association", "Financial Business Learning Academy", "First Business League Award"], answer: 0, explanation: "FBLA - Future Business Leaders of America - prepares students for careers in business!", category: "FBLA Basics" },
  { type: 'trivia', question: "What is the FBLA motto?", options: ["Success Through Leadership", "Service, Education, and Progress", "Business First, Always", "Learn, Lead, Succeed"], answer: 1, explanation: "FBLA's motto 'Service, Education, and Progress' guides all members!", category: "FBLA Basics" },
  { type: 'trivia', question: "What are FBLA's official colors?", options: ["Red and White", "Blue and Gold", "Green and Silver", "Purple and Black"], answer: 1, explanation: "Blue and Gold are FBLA's official colors!", category: "FBLA Basics" },
  { type: 'trivia', question: "When was FBLA founded?", options: ["1920", "1940", "1960", "1980"], answer: 1, explanation: "FBLA was founded in 1940 and has been developing business leaders ever since!", category: "FBLA History" },
  { type: 'trivia', question: "What is the highest level of FBLA competition?", options: ["Local", "District", "State", "National"], answer: 3, explanation: "National Leadership Conference (NLC) is FBLA's highest competition level!", category: "FBLA Competitions" },
  { type: 'trivia', question: "What does an entrepreneur do?", options: ["Works for the government", "Starts and runs their own business", "Only invests in stocks", "Teaches business classes"], answer: 1, explanation: "Entrepreneurs take risks to start and run their own businesses!", category: "Business Basics" },
  { type: 'trivia', question: "What is 'networking' in business?", options: ["Setting up computer networks", "Building professional relationships", "Using social media only", "Sending emails"], answer: 1, explanation: "Networking means building valuable professional relationships!", category: "Business Skills" },
  { type: 'trivia', question: "What is a business plan?", options: ["A company's daily schedule", "A document outlining business goals and strategies", "A list of employees", "The company's website"], answer: 1, explanation: "A business plan outlines goals, strategies, and how to achieve success!", category: "Entrepreneurship" },
  { type: 'trivia', question: "What does 'professional attire' mean at FBLA events?", options: ["Casual clothes", "Business formal dress code", "Athletic wear", "Costumes"], answer: 1, explanation: "Professional attire means business formal - suit, tie, professional dress!", category: "FBLA Etiquette" },
  { type: 'trivia', question: "What is the FBLA creed's first line about?", options: ["Making money", "Education as the right of every person", "Winning competitions", "Starting businesses"], answer: 1, explanation: "The FBLA Creed begins: 'I believe education is the right of every person.'", category: "FBLA Basics" },
  { type: 'trivia', question: "What is 'Parliamentary Procedure'?", options: ["A type of government document", "Rules for running meetings effectively", "A legal requirement", "A competitive sport"], answer: 1, explanation: "Parliamentary Procedure helps run organized, fair, and efficient meetings!", category: "FBLA Skills" },
  { type: 'trivia', question: "What is business ethics?", options: ["How to make the most money", "Moral principles guiding business behavior", "A type of accounting", "Business law"], answer: 1, explanation: "Business ethics are moral principles that guide proper business conduct!", category: "Business Basics" },
  { type: 'trivia', question: "What is FBLA-PBL?", options: ["A different organization", "FBLA at the college level", "An FBLA award", "An FBLA conference"], answer: 1, explanation: "PBL (Phi Beta Lambda) is FBLA for college and university students!", category: "FBLA Basics" },
  { type: 'trivia', question: "What makes a good leader?", options: ["Always being in charge", "Listening to others and making ethical decisions", "Never admitting mistakes", "Working alone"], answer: 1, explanation: "Good leaders listen, collaborate, and make ethical decisions!", category: "Leadership" },
  { type: 'trivia', question: "What is 'public speaking' in FBLA?", options: ["Talking to friends", "A competitive event with prepared speeches", "Reading from notes", "Group discussions"], answer: 1, explanation: "FBLA Public Speaking is a competitive event with prepared 4-minute speeches!", category: "FBLA Events" },
  { type: 'trivia', question: "What is 'supply and demand'?", options: ["A store policy", "Economic principle determining price and quantity", "Making demands provided by a supplier", "None of the above"], answer: 1, explanation: "Supply and demand explains how markets determine prices!", category: "Economics" },
  { type: 'trivia', question: "What is a 'resume'?", options: ["A summary of a book", "A document listing qualifications for a job", "A resignation letter", "A business receipt"], answer: 1, explanation: "A resume showcases your skills and experience to employers!", category: "Career Development" },
  { type: 'trivia', question: "What does 'CEO' stand for?", options: ["Chief Executive Officer", "Company Employee Organizer", "Central Economic Office", "Chief Energy Operator"], answer: 0, explanation: "CEO stands for Chief Executive Officer, the highest-ranking executive!", category: "Business Roles" }
];

// ============================================
// GAME SELECTION & HELPERS
// ============================================

export function getRandomGame(): MiniGame {
  const gameTypes: GameType[] = ['budget_puzzle', 'memory_match', 'quick_sort', 'trivia'];
  const selectedType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
  
  switch (selectedType) {
    case 'budget_puzzle':
      return { ...BUDGET_PUZZLES[Math.floor(Math.random() * BUDGET_PUZZLES.length)], generatedBy: 'Premade List' };
    case 'memory_match':
      return { ...MEMORY_MATCHES[Math.floor(Math.random() * MEMORY_MATCHES.length)], generatedBy: 'Premade List' };
    case 'quick_sort':
      return { ...QUICK_SORTS[Math.floor(Math.random() * QUICK_SORTS.length)], generatedBy: 'Premade List' };
    case 'trivia':
      return { ...TRIVIA_GAMES[Math.floor(Math.random() * TRIVIA_GAMES.length)], generatedBy: 'Premade List' };
  }
}



export function getGameInstructions(game: MiniGame): string {
  switch (game.type) {
    case 'budget_puzzle': return 'Select only the ESSENTIAL items that fit the budget!';
    case 'memory_match': return 'Match each FBLA term with its correct definition!';
    case 'quick_sort': return 'Put the items in the correct order!';
    case 'trivia': return 'Test your FBLA knowledge!';
  }
}

// Colors for matched pairs in memory match
export const MATCH_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];
