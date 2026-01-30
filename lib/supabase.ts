import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ajută enorm la debug
  console.error("Missing Supabase env vars:", {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "SET" : undefined,
  });
  throw new Error("Missing Supabase environment variables in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);