import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhhhrvckhdpkokxepgrt.supabase.co';
const supabaseKey = 'sb_publishable_jmoQ45Z-QxbiyenNkKH0GQ_0Wk6Tb7s';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});