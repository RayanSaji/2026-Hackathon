/**
 * Rules-based risk scoring — deterministic, no AI.
 *
 * Inputs: income, totalSpend, categoryBreakdown [{ category, amount }]
 * Output: { level, score, reasons }
 */
export function computeRisk(income, totalSpend, categoryBreakdown) {
  const savings = income - totalSpend;
  const savingsRate = income > 0 ? savings / income : 0;

  const reasons = [];

  // --- Risk level from savings rate ---
  let level;
  if (savings < 0) {
    level = "High";
    reasons.push("You are spending more than your income this month");
  } else if (savingsRate < 0.1) {
    level = "High";
    reasons.push("Savings rate is under 10%");
  } else if (savingsRate < 0.2) {
    level = "Medium";
    reasons.push("Savings rate is under 20%");
  } else {
    level = "Low";
  }

  // --- Overspending flags ---
  for (const { category, amount } of categoryBreakdown) {
    const ratio = income > 0 ? amount / income : 0;

    if (category === "Food" && ratio > 0.25) {
      reasons.push("Food spending is high relative to income");
    }
    if (category === "Shopping" && ratio > 0.15) {
      reasons.push("Shopping spending is high relative to income");
    }
    if (category === "Subscriptions" && ratio > 0.1) {
      reasons.push("Subscription spending is high relative to income");
    }
    if (category === "Entertainment" && ratio > 0.15) {
      reasons.push("Entertainment spending is high relative to income");
    }
  }

  // --- Score (0–100) ---
  let score = 100;

  if (savingsRate < 0.1) score -= 40;
  else if (savingsRate < 0.2) score -= 20;

  // Each overspend flag beyond the savings-rate reason
  const overspendCount = reasons.length - (level !== "Low" ? 1 : 0);
  score -= overspendCount * 10;

  score = Math.max(0, Math.min(100, score));

  return { level, score, reasons };
}
