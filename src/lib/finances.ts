import { supabase } from './supabase';

export async function increaseBalance(userId: string, amount: number) {
    if (!userId || amount === undefined || amount === null) return null;

    const { data, error } = await supabase.rpc('increase_balance', {
        user_id_in: userId,
        amount_in: amount
    });

    if (error) {
        console.error('Failed increasing balance', error);
        return null;
    }

    if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null;
    }
    return data;
}

export async function decreaseBalance(userId: string, amount: number) {
    if (!userId || amount === undefined || amount === null) return null;
    const { data, error } = await supabase.rpc('decrease_balance', {
        user_id_in: userId,
        amount_in: amount
    });
    if (error) {
        console.error('Failed decreasing balance', error);
        return null;
    }
    if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null;
    }
    return data;
}

export async function ensureFinance(userId: string) {
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
