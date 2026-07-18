import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Download } from "lucide-react";

export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: leads } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Leads</h1>
          <p className="text-brand-muted-foreground">{leads?.length ?? 0} total</p>
        </div>
        <Button asChild variant="secondary">
          <a href="/api/admin/export-leads">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-brand-border text-left text-brand-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {(leads ?? []).map((lead) => (
                <tr key={lead.id} className="hover:bg-brand-background">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-brand-primary hover:underline">
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-text">{lead.business_name ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted-foreground">{lead.whatsapp_number || lead.email || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-brand-muted-foreground">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
              {(!leads || leads.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
