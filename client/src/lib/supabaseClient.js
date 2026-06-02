import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[JK Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Auth will use local sandbox fallback.');
}

// Create a resilient Supabase client - uses placeholder values when env vars are missing
// The authStore login/register functions have sandbox fallbacks that handle this gracefully
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (...args) => {
        // Add a 5s timeout to all Supabase requests to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const [url, options = {}] = args;
        return fetch(url, { ...options, signal: controller.signal })
          .then(res => {
            clearTimeout(timeoutId);
            return res;
          })
          .catch(err => {
            clearTimeout(timeoutId);
            throw err;
          });
      }
    }
  }
);
