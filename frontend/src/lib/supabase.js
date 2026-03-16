import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development this helps catch misconfiguration early.
  // In production, Supabase will simply fail to initialize.
  // eslint-disable-next-line no-console
  console.warn("Supabase environment variables are not set");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

