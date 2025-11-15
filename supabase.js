/*
	supabase.js
	Initializes and exports the Supabase client used by the app.

	Notes:
	- Expects the following environment variables to be available at build/runtime:
		VITE_SUPABASE_URL and VITE_SUPABASE_SUPABASE_ANON_KEY
	- The project uses Vite-style import.meta.env variables; ensure your build provides them.
*/
import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables injected by the build
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

// Export a shared Supabase client for the rest of the app to use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        autoConfirmUser: true
    }
});
