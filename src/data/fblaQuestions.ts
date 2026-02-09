import type { FBLAQuestion } from '../types';

export const FBLA_QUESTIONS: FBLAQuestion[] = [
  // --- FBLA BASICS & HISTORY ---
  {
    question: "Which of the following is NOT one of the FBLA goals?",
    options: ["Develop competent, aggressive business leadership.", "Encourage members in the development of individual projects.", "Develop character, prepare for useful citizenship, and foster patriotism.", "Encourage and practice efficient money management."],
    answer: 1,
    category: "FBLA Basics",
    difficulty: "medium",
    explanation: "Individual projects are encouraged, but the specific goal wording is distinct."
  },
  {
    question: "What are the three words on the FBLA emblem?",
    options: ["Service, Education, and Progress", "Leadership, Service, and Career", "Community, Opportunity, and Success", "Knowledge, Leadership, and Community"],
    answer: 0,
    category: "FBLA Basics",
    difficulty: "easy",
    explanation: "Service, Education, and Progress are the core mottos found on the emblem."
  },
  {
    question: "In the FBLA Creed, what is the first line?",
    options: ["I believe education is the right of every person.", "I believe in the future of agriculture...", "I believe that every person should prepare for a useful occupation.", "I believe that the American business system is the best in the world."],
    answer: 0,
    category: "FBLA Basics",
    difficulty: "easy",
    explanation: "The creed begins with the fundamental right to education."
  },
  {
    question: "Which national officer is responsible for keeping accurate minutes of all national officer meetings?",
    options: ["President", "Treasurer", "Secretary", "Parliamentarian"],
    answer: 2,
    category: "FBLA Leadership",
    difficulty: "easy",
    explanation: "The Secretary is responsible for recording the minutes of meetings."
  },
  {
    question: "What is the name of the national FBLA publication for members?",
    options: ["Tomorrow's Business Leader", "The Professional Edge", "FBLA-PBL Adviser Hotline", "The Business Journal"],
    answer: 0,
    category: "FBLA Basics",
    difficulty: "medium",
     explanation: "Tomorrow's Business Leader is the flagship magazine for FBLA members."
  },
  {
    question: "The first FBLA chapter was chartered in what state in 1942?",
    options: ["Iowa", "Georgia", "Virginia", "Tennessee"],
    answer: 3,
    category: "FBLA History",
    difficulty: "hard",
    explanation: "Johnson City, Tennessee was the site of the first chartered chapter."
  },
  {
    question: "In parliamentary procedure, what motion is used to immediately end a debate?",
    options: ["Adjourn", "Point of Order", "Previous Question", "Recess"],
    answer: 2,
    category: "Parliamentary Procedure",
    difficulty: "medium",
    explanation: "Moving the 'Previous Question' calls for an immediate vote to end debate."
  },
  {
    question: "The FBLA National Center is located in which city?",
    options: ["Washington, D.C.", "Reston, Virginia", "New York, New York", "Chicago, Illinois"],
    answer: 1,
    category: "FBLA Facts",
    difficulty: "medium",
    explanation: "The National Center is headquartered in Reston, Virginia."
  },
  {
    question: "What does 'PBL' stand for in FBLA-PBL?",
    options: ["Professional Business Leaders", "Public Business League", "Phi Beta Lambda", "Progressive Business Liaisons"],
    answer: 2,
    category: "FBLA Structure",
    difficulty: "easy",
    explanation: "PBL stands for Phi Beta Lambda, the collegiate division."
  },
  {
    question: "What is the FBLA motto?",
    options: ["Service, Education, and Progress", "Preparing Leaders for the World of Business", "Education for Business, Business for Education", "Future Business Leaders of Tomorrow"],
    answer: 0,
    category: "FBLA Basics",
    difficulty: "easy",
    explanation: "Service, Education, and Progress."
  },
  {
    question: "What year was FBLA founded?",
    options: ["1937", "1940", "1942", "1945"],
    answer: 1, // 1940 concept proposed, 1942 first chapter. Usually 1940 is cited as founding of concept.
    category: "FBLA History",
    difficulty: "medium",
    explanation: "The concept was developed in 1937, but the name was selected in 1940."
  },
  {
    question: "Which colors represent FBLA?",
    options: ["Red, White, and Blue", "Blue and Gold", "Navy Blue and Silver", "Teal and Purple"],
    answer: 1,
    category: "FBLA Basics",
    difficulty: "easy",
     explanation: "Blue and Gold are the official colors of FBLA."
  },

  // --- BUSINESS BASICS ---
  {
    question: "What is the primary purpose of a 'mission statement'?",
    options: ["To list all employees", "To define the company's purpose and goals", "To show financial earnings", "To explain the dress code"],
    answer: 1,
    category: "Business Management",
    difficulty: "easy",
    explanation: "A mission statement defines the core purpose and objectives of an organization."
  },
  {
    question: "In business, what does 'SWOT' analysis stand for?",
    options: ["Strengths, Weaknesses, Opportunities, Threats", "Sales, Work, Organization, Team", "Strategy, Wealth, Operations, Time", "Stocks, Wages, Orders, Taxes"],
    answer: 0,
    category: "Business Management",
    difficulty: "medium",
    explanation: "SWOT analyzes internal Strengths/Weaknesses and external Opportunities/Threats."
  },
  {
    question: "Which of the following is considered a 'variable cost'?",
    options: ["Rent", "Insurance premiums", "Raw materials", "Salaried wages"],
    answer: 2,
    category: "Finance",
    difficulty: "hard",
    explanation: "Raw materials costs vary directly with the level of production."
  },
  {
    question: "What is the term for a market with only a few large sellers?",
    options: ["Monopoly", "Oligopoly", "Perfect Competition", "Monopsony"],
    answer: 1,
    category: "Economics",
    difficulty: "hard",
    explanation: "An Oligopoly is dominated by a small number of large firms."
  },
  {
    question: "Which document summarizes a company's financial position at a specific point in time?",
    options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Annual Report"],
    answer: 1,
    category: "Finance",
    difficulty: "medium",
    explanation: "The Balance Sheet shows assets, liabilities, and equity at a specific date."
  },

  // --- MARKETING ---
  {
    question: "What are the '4 Ps' of the Marketing Mix?",
    options: ["Product, Price, Place, Promotion", "People, Process, Programs, Performance", "Plan, Prepare, Profit, Publish", "Power, Prestige, Position, Public"],
    answer: 0,
    category: "Marketing",
    difficulty: "easy",
    explanation: "Product, Price, Place, and Promotion are the foundational 4 Ps of marketing."
  },
  {
    question: "What is a 'target market'?",
    options: ["The physical location of a store", "A specific group of consumers a business aims to reach", "The goal for monthly sales", "A list of competitors"],
    answer: 1,
    category: "Marketing",
    difficulty: "easy",
    explanation: "A target market is the specific audience a product or service is designed for."
  },
  {
    question: "Which marketing strategy involves using social media influencers?",
    options: ["Direct Mail", "Telemarketing", "Influencer Marketing", "Guerrilla Marketing"],
    answer: 2,
    category: "Marketing",
    difficulty: "easy",
    explanation: "Influencer Marketing leverages individuals with a social following to promote products."
  },

  // --- ENTREPRENEURSHIP ---
  {
    question: "What is an 'elevator pitch'?",
    options: ["A sales pitch made in an elevator", "A brief, persuasive speech about a product or idea", "A method for fixing elevators", "A long, detailed business presentation"],
    answer: 1,
    category: "Entrepreneurship",
    difficulty: "medium",
    explanation: "An elevator pitch is a short summary defined by the time it takes to ride an elevator."
  },
  {
    question: "What does 'ROI' stand for?",
    options: ["Rate of Inflation", "Return on Investment", "Risk of Injury", "Realm of Influence"],
    answer: 1,
    category: "Finance",
    difficulty: "medium",
    explanation: "ROI measures the gain or loss generated on an investment relative to its cost."
  },
  {
    question: "Which business structure protects owners from personal liability?",
    options: ["Sole Proprietorship", "Partnership", "Limited Liability Company (LLC)", "General Partnership"],
    answer: 2,
    category: "Business Law",
    difficulty: "hard",
     explanation: "An LLC separates personal assets from business debts and liabilities."
  },

  // --- TECHNOLOGY & DIGITAL ---
  {
    question: "What does 'SEO' stand for in digital marketing?",
    options: ["Search Engine Optimization", "System Entry Organ", "Sales Executive Officer", "Secure Electronic Order"],
    answer: 0,
    category: "Technology",
    difficulty: "medium",
    explanation: "SEO involves optimizing content to rank higher in search engine results."
  },
  {
    question: "Which of these is a 'Cloud Computing' service?",
    options: ["Microsoft Word 2007", "Google Drive", "A USB Flash Drive", "A Local Hard Drive"],
    answer: 1,
    category: "Technology",
    difficulty: "easy",
     explanation: "Google Drive stores data on remote servers (the cloud) rather than local devices."
  },

  // --- PROFESSIONALISM ---
  {
    question: "What is the best way to handle a workplace conflict?",
    options: ["Ignore the person forever", "Gossip to coworkers", "Address the issue privately and respectfully", "Complain on social media"],
    answer: 2,
    category: "Professionalism",
    difficulty: "easy",
    explanation: "Private, respectful communication is key to professional conflict resolution."
  },
  {
    question: "When arriving for a job interview, how early should you be?",
    options: ["On time exactly", "5-10 minutes early", "30 minutes early", "5 minutes late"],
    answer: 1,
    category: "Career Prep",
    difficulty: "easy",
    explanation: "Arriving 5-10 minutes early shows punctuality without inconveniencing the interviewer."
  }
];
