import "server-only";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseSecret, supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";

export function createAdminSupabase() {
  if (!hasSupabaseSecret()) return null;
  const key = supabaseSecretKey();
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const incoming = new Headers(init?.headers);
        const headers = new Headers();
        headers.set("apikey", key);
        for (const name of ["Accept", "Content-Type", "Prefer", "Accept-Profile", "Content-Profile"]) {
          const value = incoming.get(name);
          if (value) headers.set(name, value);
        }
        return fetch(input, {
          method: init?.method,
          body: init?.body,
          headers,
          cache: "no-store",
        });
      },
    },
  });
}
