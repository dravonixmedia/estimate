"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/** Browser client for admin-authenticated pages only (anon key + RLS). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY);
}
