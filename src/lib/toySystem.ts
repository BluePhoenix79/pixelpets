
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface ToyItem {
  name: string;
  rarity: Rarity;
  icon: string; // Emoji for now
}

const TOY_DATABASE: ToyItem[] = [
  // Common (50%)
  { name: 'Squeaky Ball', rarity: 'Common', icon: '🎾' },
  { name: 'Wooden Stick', rarity: 'Common', icon: '🪵' },
  { name: 'Old Sock', rarity: 'Common', icon: '🧦' },
  { name: 'Cardboard Box', rarity: 'Common', icon: '📦' },
  
  // Rare (25%)
  { name: 'Frisbee', rarity: 'Rare', icon: '🥏' },
  { name: 'Laser Pointer', rarity: 'Rare', icon: '🔦' },
  { name: 'Plushie', rarity: 'Rare', icon: '🧸' },
  { name: 'Chew Rope', rarity: 'Rare', icon: '🧶' },

  // Epic (15%)
  { name: 'Auto-Feeder', rarity: 'Epic', icon: '🤖' },
  { name: 'Scratching Post', rarity: 'Epic', icon: '💈' },
  { name: 'Tunnel', rarity: 'Epic', icon: '🚇' },

  // Legendary (10%)
  { name: 'Golden Bone', rarity: 'Legendary', icon: '🦴' },
  { name: 'Diamond Collar', rarity: 'Legendary', icon: '💎' },
  { name: 'Rocket Ship', rarity: 'Legendary', icon: '🚀' }
];

export const RARITY_COLORS: Record<Rarity, string> = {
  'Common': '#94a3b8', // Slate 400
  'Rare': '#3b82f6',   // Blue 500
  'Epic': '#a855f7',   // Purple 500
  'Legendary': '#eab308' // Yellow 500
};

export const MYSTERY_BOX_COST = 50;

export function openMysteryBox(): ToyItem {
  const rand = Math.random() * 100;
  
  let chosenRarity: Rarity;
  if (rand < 50) chosenRarity = 'Common';
  else if (rand < 75) chosenRarity = 'Rare';
  else if (rand < 90) chosenRarity = 'Epic';
  else chosenRarity = 'Legendary';

  const pool = TOY_DATABASE.filter(t => t.rarity === chosenRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function parseToyItem(dbItemName: string): ToyItem {
  // Expected format: "[Rarity] Name"
  const match = dbItemName.match(/\[(.*?)\] (.*)/);
  if (match) {
    const rarity = match[1] as Rarity;
    const name = match[2];
    const original = TOY_DATABASE.find(t => t.name === name);
    return {
      name,
      rarity,
      icon: original?.icon || '🎁'
    };
  }
  // Fallback for old legacy toys
  return { name: dbItemName, rarity: 'Common', icon: '🧸' };
}

export function formatDbName(toy: ToyItem): string {
  return `[${toy.rarity}] ${toy.name}`;
}
