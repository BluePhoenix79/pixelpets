export const XP_BASE = 100;

/**
 * Calculates the total XP required to complete the CURRENT level and reach the NEXT level.
 * Formula: Base * CurrentLevel
 * Level 1 -> 100 XP (1 task)
 * Level 2 -> 200 XP (2 tasks)
 * Level 3 -> 300 XP (3 tasks)
 */
export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/**
 * Calculates the percentage of progress through the current level.
 * @param currentXP The XP accumulated IN THE CURRENT LEVEL (reset after level up).
 * @param currentLevel The current level of the pet.
 * @returns A number between 0 and 100.
 */
export function getLevelProgress(currentXP: number, currentLevel: number): number {
  const required = getXPForNextLevel(currentLevel);
  if (required === 0) return 0;
  return Math.min(100, Math.max(0, (currentXP / required) * 100));
}

/**
 * Formats the XP string for display.
 * Example: "250 / 500 XP"
 */
export function formatXPString(currentXP: number, currentLevel: number): string {
  const required = getXPForNextLevel(currentLevel);
  return `${Math.floor(currentXP)} / ${required} XP`;
}
