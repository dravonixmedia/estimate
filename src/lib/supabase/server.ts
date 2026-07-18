import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/server-env";

/** Server client for Server Components / Route Handlers, using the
 * anon key + the visitor's auth cookies (RLS enforced, admin-only). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — safe to ignore because
          // middleware refreshes the session on every request.
        }
      },
    },
  });
}
