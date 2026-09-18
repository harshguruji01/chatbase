import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzojuiccegnvanqowgmf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b2p1aWNjZWdudmFucW93Z21mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjU4NDgsImV4cCI6MjEwNTMwMTg0OH0.w2bYWS6QRxcJMvY127o3XGA7yhxB9ClxliGssLo1ps4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
