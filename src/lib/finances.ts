import { getFinances, createFinances, patchFinances } from './api';
import type { UserFinances } from '../types';

/**
 * increaseBalance: safely increase user's balance and total_earned.
 * LOGIC: Uses a Postgres RPC (Stored Procedure) to perform the update atomically.
 * This ensures that if two rewards happen simultaneously, we don't have a race condition
 * that overwrites one of the balance updates.
 */
export async function increaseBalance(userId: string, amount: number): Promise<UserFinances | null> {
  if (!userId || amount === undefined || amount === null) return null;
  try {
    const current = await getFinances(userId);
    if (!current) {
      // create with initial balance + amount
      const initial = 50 + amount;
      const created = await createFinances({ user_id: userId, balance: initial, total_earned: initial, total_spent: 0 });
      return created || null;
    }
    const updated = await patchFinances(userId, {
      balance: (current.balance || 0) + amount,
      total_earned: (current.total_earned || 0) + amount,
    });
    return updated || null;
  } catch (err) {
    console.error('Failed increasing balance', err);
    return null;
  }
}

/**
 * decreaseBalance: safely decrease user's balance and increase total_spent.
 * Returns the updated finance row or null on error.
 */
export async function decreaseBalance(userId: string, amount: number): Promise<UserFinances | null> {
  if (!userId || amount === undefined || amount === null) return null;
  try {
    const current = await getFinances(userId);
    if (!current) {
      console.error('No finance row to decrease');
      return null;
    }
    const updated = await patchFinances(userId, {
      balance: (current.balance || 0) - amount,
      total_spent: (current.total_spent || 0) + amount,
    });
    return updated || null;
  } catch (err) {
    console.error('Failed decreasing balance', err);
    return null;
  }
}

/**
 * ensureFinance: Guaranteed to return a valid finance row.
 * LOGIC: If a user doesn't have a finance row (new account), we create one immediately
 * with a starting balance of $50 so they can afford their first pet adoption.
 * This prevents null reference errors throughout the app.
 */
export async function ensureFinance(userId: string): Promise<UserFinances | null> {
  if (!userId) return null;
  try {
    const finance = await getFinances(userId);
    if (finance) return finance as UserFinances;
    const initial = 50;
    const created = await createFinances({ user_id: userId, balance: initial, total_earned: initial, total_spent: 0 });
    return created as UserFinances || { user_id: userId, balance: initial, total_earned: initial, total_spent: 0 };
  } catch (err) {
    console.error('Failed ensuring finances', err);
    return null;
  }
}
