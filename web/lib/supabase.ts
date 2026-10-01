import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export type Submission = {
  id: string;
  number: number;
  sdg: number;
  title: string;
  summary: string | null;
  deck_path: string;
  created_at: string;
};

export type Criterion = {
  id: number;
  label: string;
  weight: number;
  max_score: number;
  position: number;
};

export type Judge = { user_id: string; name: string; is_admin: boolean };
