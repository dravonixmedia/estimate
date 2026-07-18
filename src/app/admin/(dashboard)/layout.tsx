import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/server-env";
import { Logo } from "@/components/brand/logo";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { LayoutDashboard, Users, Tag, ToggleLeft, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/services", label: "Services", icon: ToggleLeft },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!getServerEnv().SUPABASE_URL || !getServerEnv().SUPABASE_ANON_KEY) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <Logo variant="mark" href={null} className="h-10" />
        <h1 className="text-xl font-semibold text-brand-text">Administrator area not configured</h1>
        <p className="max-w-sm text-brand-muted-foreground">
          Set SUPABASE_URL and SUPABASE_ANON_KEY to enable the administrator dashboard. See the README for setup
          steps.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-svh bg-brand-background">
      <aside className="hidden w-60 shrink-0 border-r border-brand-border bg-brand-surface sm:block">
        <div className="p-5">
          <Logo variant="full" className="h-7" href="/admin" />
        </div>
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-brand-muted hover:bg-brand-background hover:text-brand-text"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-3">
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-5 sm:p-8">{children}</main>
    </div>
  );
}
