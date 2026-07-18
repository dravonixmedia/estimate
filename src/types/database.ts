/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql. Keep in
 * sync manually — this project intentionally avoids a generated-schema
 * questionnaire system, so there is no codegen step tied to dynamic pages.
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "consultation_scheduled"
  | "proposal_sent"
  | "won"
  | "lost"
  | "spam";

export type ServiceRow = {
  id: string;
  name: string;
  category: "branding" | "web" | "marketing" | "content" | "technical";
  unit: "one_time" | "monthly";
  price_min: number;
  price_max: number;
  description: string;
  active: boolean;
  manual_quotation_possible: boolean;
  updated_at: string;
};

export type LeadRow = {
  id: string;
  reference: string;
  full_name: string;
  business_name: string | null;
  whatsapp_number: string | null;
  email: string | null;
  business_stage: string | null;
  status: LeadStatus;
  privacy_accepted: boolean;
  contact_consent: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  session_id: string;
  created_at: string;
  updated_at: string;
};

export type ProjectBriefRow = {
  id: string;
  lead_id: string;
  project_description: string;
  reference_website: string | null;
  inspiration_link: string | null;
  ai_interpretation: Record<string, unknown> | null;
  selected_services: string[];
  services_not_sure: boolean;
  answers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EstimateRow = {
  id: string;
  lead_id: string;
  reference: string;
  one_time_min: number;
  one_time_max: number;
  monthly_min: number;
  monthly_max: number;
  essential_launch: Record<string, unknown>;
  recommended_solution: Record<string, unknown>;
  optional_upgrades: unknown[];
  future_expansion: unknown[];
  assumptions: unknown[];
  exclusions: unknown[];
  estimated_timeline_label: string;
  confidence: "high" | "medium" | "low";
  custom_quotation_required: boolean;
  created_at: string;
};

export type EstimateItemRow = {
  id: string;
  estimate_id: string;
  service_id: string;
  name: string;
  unit: "one_time" | "monthly";
  price_min: number;
  price_max: number;
  notes: string | null;
};

export type LeadActivityRow = {
  id: string;
  lead_id: string;
  type: "status_change" | "note" | "system";
  note: string | null;
  previous_status: string | null;
  new_status: string | null;
  created_by: string | null;
  created_at: string;
};

export type AppSettingRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      services: Table<ServiceRow>;
      leads: Table<LeadRow>;
      project_briefs: Table<ProjectBriefRow>;
      estimates: Table<EstimateRow>;
      estimate_items: Table<EstimateItemRow>;
      lead_activity: Table<LeadActivityRow>;
      app_settings: Table<AppSettingRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
