
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://snpwliohsikybhbdzrzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHdsaW9oc2lreWJoYmR6cnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzIxNjksImV4cCI6MjA4NjMwODE2OX0.rq82TYJpXVp9d5LMdnLoW4ERCiG4-dh9SFwbwFyflnA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
