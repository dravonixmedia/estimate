import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatusPanel } from "@/components/admin/lead-status-panel";
import { formatCurrencyRange, formatDate } from "@/lib/format";

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: lead }, { data: brief }, { data: estimates }, { data: activity }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_briefs").select("*").eq("lead_id", id).maybeSingle(),
    supabase.from("estimates").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("lead_activity").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);

  if (!lead) notFound();

  const latestEstimate = estimates?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">{lead.full_name}</h1>
        <p className="text-brand-muted-foreground">{lead.business_name || "No business name provided"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-brand-text">
              <p>WhatsApp: {lead.whatsapp_number || "—"}</p>
              <p>Email: {lead.email || "—"}</p>
              <p>Business stage: {lead.business_stage?.replace(/_/g, " ") || "—"}</p>
              <p>Reference: {lead.reference}</p>
              <p>Created: {formatDate(lead.created_at)}</p>
            </CardContent>
          </Card>

          {brief && (
            <Card>
              <CardHeader>
                <CardTitle>Project Brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-brand-text">
                <p className="whitespace-pre-wrap">{brief.project_description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.selected_services.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  {brief.services_not_sure && <Badge variant="secondary">Not Sure</Badge>}
                </div>
              </CardContent>
            </Card>
          )}

          {latestEstimate && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-brand-text">
                <p className="text-lg font-semibold">
                  {formatCurrencyRange(latestEstimate.one_time_min, latestEstimate.one_time_max)}
                </p>
                <p>Confidence: {latestEstimate.confidence}</p>
                <p>Reference: {latestEstimate.reference}</p>
                <a href={`/result/${latestEstimate.reference}`} className="text-brand-primary underline">
                  View result page
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(activity ?? []).length === 0 && <p className="text-brand-muted-foreground">No activity yet.</p>}
              {(activity ?? []).map((a) => (
                <div key={a.id} className="border-b border-brand-border pb-2 last:border-0">
                  <p className="text-brand-text">
                    {a.type === "status_change"
                      ? `Status changed: ${a.previous_status} → ${a.new_status}`
                      : a.note}
                  </p>
                  <p className="text-xs text-brand-muted-foreground">{formatDate(a.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Manage Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStatusPanel leadId={lead.id} currentStatus={lead.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
