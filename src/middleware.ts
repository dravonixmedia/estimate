import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/server-env";

/**
 * Refreshes the Supabase auth session on every /admin request (the
 * standard @supabase/ssr pattern) and redirects unauthenticated visitors
 * to /admin/login. Route handlers and Server Components still perform
 * their own authoritative checks — this is the first line of defence.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/admin/login") {
    return response;
  }

  const env = getServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
