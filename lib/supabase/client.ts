import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(supabaseUrl(), supabasePublishableKey());
}
