import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Profile not found: ${error.message}`);
  return data;
}

export async function getMonthExpenses(userId, month) {
  // month format: "2026-02"
  const startDate = `${month}-01`;
  const [year, m] = month.split("-").map(Number);
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false });

  if (error) throw new Error(`Expenses query failed: ${error.message}`);
  return data ?? [];
}

export async function getSavingsGoals(userId) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Goals query failed: ${error.message}`);
  return data ?? [];
}
