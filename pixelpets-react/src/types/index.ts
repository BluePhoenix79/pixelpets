// Pet Types
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'fish' | 'mouse';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  owner_id: string;
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  health: number;
  love: number;
  last_updated: string;
  created_at: string;
}

// User & Finance Types
export interface UserFinances {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface Expense {
  id: string;
  pet_id: string;
  user_id: string;
  expense_type: string;
  item_name: string;
  amount: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  task_name: string;
  reward_amount: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  pet_id: string;
  achievement_id: string;
  completed_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  pet_id: string;
  target_amount: number;
  created_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  last_login_date: string; // YYYY-MM-DD
  login_dates: string[]; // Array of YYYY-MM-DD
  updated_at: string;
}

// Achievement Definition Types
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check?: (pet: Pet) => boolean;
  asyncCheck?: (userId: string, petId: string) => Promise<boolean>;
  progress: (pet: Pet, stats?: AchievementStats) => number;
}

export interface AchievementStats {
  balance?: number;
  total_spent?: number;
  tasks_done?: number;
  vet_count?: number;
  toy_count?: number;
}

// FBLA Question Types
export interface FBLAQuestion {
  question: string;
  options: string[];
  answer: number;
}

// Action Types
export type ActionType = 'feed' | 'play' | 'clean' | 'rest' | 'vet' | 'toy';

export interface ActionResult {
  item: string;
  type: string;
}

// Theme Types
export type ThemePreference = 'light' | 'dark' | 'system';
