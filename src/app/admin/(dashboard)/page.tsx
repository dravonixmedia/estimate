import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [{ count: totalLeads }, { count: totalEstimates }, { data: statusRows }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("estimates").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("status"),
  ]);

  const statusCounts = (statusRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const completionRate = totalLeads && totalLeads > 0 ? Math.round(((totalEstimates ?? 0) / totalLeads) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Dashboard</h1>
        <p className="text-brand-muted-foreground">Estimator completion and lead overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Leads" value={totalLeads ?? 0} />
        <StatCard label="Estimates Generated" value={totalEstimates ?? 0} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads by status</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Object.entries(statusCounts).length === 0 && <p className="text-sm text-brand-muted-foreground">No leads yet.</p>}
            {Object.entries(statusCounts).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-brand-text">{status.replace(/_/g, " ")}</span>
                <span className="font-medium text-brand-text">{count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-sm text-brand-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-brand-text">{value}</p>
      </CardContent>
    </Card>
  );
}
