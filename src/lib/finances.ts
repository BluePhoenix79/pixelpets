import { supabase } from './supabase';
import type { UserFinances } from '../types';

/**
 * increaseBalance: safely increase user's balance and total_earned.
 * LOGIC: Uses a Postgres RPC (Stored Procedure) to perform the update atomically.
 * This ensures that if two rewards happen simultaneously, we don't have a race condition
 * that overwrites one of the balance updates.
 */
export async function increaseBalance(userId: string, amount: number): Promise<UserFinances | null> {
  if (!userId || amount === undefined || amount === null) return null;

  const { data, error } = await supabase.rpc('increase_balance', {
    user_id_in: userId,
    amount_in: amount
  });

  if (error) {
    console.error('Failed increasing balance', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // The RPC function returns a single object, but the client library may wrap it in an array
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }

  return data && (data as UserFinances[]).length > 0 ? (data as UserFinances[])[0] : null;
}

/**
 * decreaseBalance: safely decrease user's balance and increase total_spent.
 * Returns the updated finance row or null on error.
 */
export async function decreaseBalance(userId: string, amount: number): Promise<UserFinances | null> {
  if (!userId || amount === undefined || amount === null) return null;

  const { data, error } = await supabase.rpc('decrease_balance', {
    user_id_in: userId,
    amount_in: amount
  });

  if (error) {
    console.error('Failed decreasing balance', error);
    return null;
  }

  return data && (data as UserFinances[]).length > 0 ? (data as UserFinances[])[0] : null;
}

/**
 * ensureFinance: Guaranteed to return a valid finance row.
 * LOGIC: If a user doesn't have a finance row (new account), we create one immediately
 * with a starting balance of $50 so they can afford their first pet adoption.
 * This prevents null reference errors throughout the app.
 */
export async function ensureFinance(userId: string): Promise<UserFinances | null> {
  if (!userId) return null;

  const { data: finance, error: readErr } = await supabase
    .from('user_finances')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (readErr) {
    console.error('Failed reading finances', readErr);
    return null;
  }

  if (finance) return finance as UserFinances;

  // Create with default starting balance ($50 = enough for first pet)
  const initial = 50;
  const { data: inserted, error: insertErr } = await supabase.from('user_finances').insert({
    user_id: userId,
    balance: initial,
    total_earned: initial,
    total_spent: 0
  }).select().maybeSingle();

  if (insertErr) {
    console.error('Failed creating finance row', insertErr);
    return null;
  }

  return inserted as UserFinances || { user_id: userId, balance: initial, total_earned: initial, total_spent: 0 };
}
