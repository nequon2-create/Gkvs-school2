import { createClient } from '@supabase/supabase-js';
import type { Database } from '@gkvs/shared';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are missing. Please check your environment variables.');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Export types
export type { Database } from '@gkvs/shared';
