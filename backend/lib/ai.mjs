import { getProfile, getMonthExpenses, getSavingsGoals } from "./supabase.mjs";
import { computeRisk } from "./risk.mjs";

/**
 * AI Insights — stub implementation (deterministic).
 * Replace internals with Bedrock/LLM call later.
 */
export async function getInsights(userId, month) {
  const [profile, expenses, goals] = await Promise.all([
    getProfile(userId),
    getMonthExpenses(userId, month),
    getSavingsGoals(userId),
  ]);

  const income = Number(profile.monthly_income) || 0;
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savingsRate = income > 0 ? (income - totalSpend) / income : 0;

  // Category breakdown
  const categoryMap = new Map();
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + Number(e.amount));
  }
  const categories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const risk = computeRisk(income, totalSpend, categories);

  // Deterministic insights
  const insights = [];
  if (categories.length > 0) {
    insights.push(
      `Your top spending category is ${categories[0].category} at $${categories[0].amount.toFixed(2)}.`
    );
  }
  if (savingsRate < 0.2 && savingsRate >= 0) {
    insights.push(
      `Your savings rate is ${Math.round(savingsRate * 100)}% — aim for at least 20%.`
    );
  }
  if (totalSpend > income) {
    insights.push("You've exceeded your monthly income. Review expenses for areas to cut.");
  }

  const suggestedActions = [];
  if (categories.length > 0 && categories[0].amount / income > 0.25) {
    suggestedActions.push(
      `Try reducing ${categories[0].category.toLowerCase()} spending by 10% next month.`
    );
  }
  suggestedActions.push("Track every expense — awareness is the first step to better budgeting.");

  const riskNarrative = `Your financial risk level is ${risk.level} (score: ${risk.score}/100). ${risk.reasons.join(". ")}.`;

  return { insights, suggestedActions, riskNarrative };
}

/**
 * AI Chat — stub implementation.
 * Replace internals with Bedrock/LLM call later.
 */
export async function getChat(userId, message) {
  // Simple keyword-based responses for demo
  const lower = message.toLowerCase();

  let reply;
  let suggestedActions = [];

  if (lower.includes("hysa") || lower.includes("high-yield") || lower.includes("savings account")) {
    reply =
      "A HYSA (High-Yield Savings Account) offers higher interest rates than traditional savings accounts — often 4-5% APY. It's a great place for your emergency fund or short-term savings goals. Your money stays accessible while earning more. This is not financial advice.";
    suggestedActions = [
      "If you don't have an emergency fund, start by saving $200–$500 in a HYSA.",
    ];
  } else if (lower.includes("credit") && lower.includes("utilization")) {
    reply =
      "Credit utilization is the percentage of your available credit that you're using. Keeping it under 30% is generally recommended, and under 10% is ideal for boosting your credit score. This is not financial advice.";
    suggestedActions = [
      "Check your current credit card balances and aim to pay them down below 30% of your limit.",
    ];
  } else if (lower.includes("budget") || lower.includes("budgeting")) {
    reply =
      "A good starting point is the 50/30/20 rule: 50% of income for needs, 30% for wants, and 20% for savings. As a student, your ratios might differ — the key is tracking consistently. This is not financial advice.";
    suggestedActions = [
      "Review your current month's spending in the dashboard and see how it maps to 50/30/20.",
    ];
  } else if (lower.includes("save") || lower.includes("saving")) {
    reply =
      "Start small! Even $25/week adds up to $1,300/year. Automate transfers to a savings account so you pay yourself first. This is not financial advice.";
    suggestedActions = [
      "Set up a weekly $25 transfer to your savings goal.",
    ];
  } else {
    reply =
      "That's a great question! I'm BudgetU's financial literacy assistant. I can help with topics like budgeting, saving, credit, and understanding financial terms. Try asking about HYSAs, credit utilization, or budgeting strategies. This is not financial advice.";
    suggestedActions = [
      "Explore the Education tab for financial literacy topics.",
    ];
  }

  return { reply, suggestedActions };
}
