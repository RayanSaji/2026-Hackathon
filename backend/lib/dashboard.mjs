import { getProfile, getMonthExpenses, getSavingsGoals } from "./supabase.mjs";
import { computeRisk } from "./risk.mjs";

export async function getDashboard(userId, month) {
  // Fetch data from Supabase
  const [profile, expenses, goals] = await Promise.all([
    getProfile(userId),
    getMonthExpenses(userId, month),
    getSavingsGoals(userId),
  ]);

  const monthlyIncome = Number(profile.monthly_income) || 0;

  // Total spend
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = monthlyIncome - totalSpend;
  const estimatedSavings = Math.max(0, remaining);
  const savingsRate = monthlyIncome > 0 ? remaining / monthlyIncome : 0;

  // Category breakdown
  const categoryMap = new Map();
  for (const expense of expenses) {
    const current = categoryMap.get(expense.category) ?? 0;
    categoryMap.set(expense.category, current + Number(expense.amount));
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // Risk scoring
  const risk = computeRisk(monthlyIncome, totalSpend, categoryBreakdown);

  // Deterministic insights (no AI)
  const insights = generateInsights(monthlyIncome, totalSpend, savingsRate, categoryBreakdown);
  const suggestedActions = generateActions(savingsRate, categoryBreakdown, monthlyIncome);

  // Goals with progress
  const goalsData = goals.map((g) => ({
    name: g.name,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount),
    progress:
      Number(g.target_amount) > 0
        ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) / 100
        : 0,
  }));

  return {
    month,
    monthlyIncome,
    totalSpend: Math.round(totalSpend * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    estimatedSavings: Math.round(estimatedSavings * 100) / 100,
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    categoryBreakdown,
    risk,
    insights,
    suggestedActions,
    goals: goalsData,
  };
}

function generateInsights(income, spend, savingsRate, categories) {
  const insights = [];

  if (categories.length > 0) {
    insights.push(
      `Your ${categories[0].category.toLowerCase()} spending is your top category this month.`
    );
  }

  if (categories.length > 1) {
    insights.push(
      `${categories[1].category} is your #2 category — consider a weekly cap.`
    );
  }

  if (savingsRate > 0 && savingsRate < 0.2) {
    insights.push(
      "You're still saving money, but it's tighter than your goal."
    );
  } else if (savingsRate >= 0.2) {
    insights.push(
      `Great job — you're saving ${Math.round(savingsRate * 100)}% of your income!`
    );
  } else if (savingsRate <= 0) {
    insights.push(
      "You've spent more than your income this month. Review recent expenses for quick wins."
    );
  }

  if (insights.length === 0) {
    insights.push("Keep tracking your expenses to stay on top of your budget.");
  }

  return insights.slice(0, 3);
}

function generateActions(savingsRate, categories, income) {
  const actions = [];

  if (categories.length > 0 && income > 0) {
    const topRatio = categories[0].amount / income;
    if (topRatio > 0.25) {
      const weeklyCap = Math.round(categories[0].amount / 4);
      actions.push(
        `Set a $${weeklyCap}/week ${categories[0].category.toLowerCase()} cap for the next 2 weeks.`
      );
    }
  }

  if (savingsRate < 0.2 && savingsRate >= 0) {
    actions.push(
      "Move $25/week into your savings goal — even manual transfers help build the habit."
    );
  }

  if (actions.length === 0) {
    actions.push("Keep up the good work! Review your goals to stay motivated.");
  }

  return actions.slice(0, 2);
}
