import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  // Supabase Functions reserves SUPABASE_* env names; use a custom secret name.
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("Missing SUPABASE_URL env");
  }
  if (!serviceKey) {
    throw new Error("Missing SERVICE_ROLE_KEY env");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
