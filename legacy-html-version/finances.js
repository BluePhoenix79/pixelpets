import { supabase } from './supabase.js';

/**
 * increaseBalance: safely increase user's balance and total_earned.
 * Returns the updated finance row or null on error.
 */
export async function increaseBalance(userId, amount) {
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
    // Handle both cases
    if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null;
    }

    return data && data.length > 0 ? data[0] : null;
}

/**
 * decreaseBalance: safely decrease user's balance and increase total_spent.
 * Returns the updated finance row or null on error.
 */
export async function decreaseBalance(userId, amount) {
    if (!userId || amount === undefined || amount === null) return null;

    const { data, error } = await supabase.rpc('decrease_balance', {
        user_id_in: userId,
        amount_in: amount
    });

    if (error) {
        console.error('Failed decreasing balance', error);
        return null;
    }

    return data && data.length > 0 ? data[0] : null;
}

/**
 * ensureFinance: make sure a `user_finances` row exists for the user.
 * Returns the finance row (existing or newly created) or null on error.
 */
export async function ensureFinance(userId) {
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

    if (finance) return finance;

    // Create with default starting balance
    const initial = 20;
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

    return inserted || { balance: initial, total_earned: initial, total_spent: 0 };
}
