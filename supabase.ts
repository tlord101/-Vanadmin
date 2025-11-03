import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The Supabase URL and Key are hardcoded here to resolve the initialization error,
// as process.env variables are not available in this environment.
const supabaseUrl = 'https://yxzjirgmrjktinogvyqo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emppcmdtcmprdGlub2d2eXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYwNzYsImV4cCI6MjA3NzcxMjA3Nn0.kg45SVdKgp9MH9NTDHJG3XEtRbVICRkevei0-S14VBQ';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
