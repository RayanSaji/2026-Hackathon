import { getDashboard } from "./lib/dashboard.mjs";
import { getInsights, getChat } from "./lib/ai.mjs";

// --- Response helpers ---

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function success(data, statusCode = 200) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify({ ok: true, data }),
  };
}

function fail(code, message, statusCode = 400) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify({ ok: false, error: { code, message } }),
  };
}

// --- Router ---

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  const path = event.rawPath || event.path || "/";

  // CORS preflight
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  try {
    // GET /dashboard?userId=...&month=2026-02
    if (method === "GET" && path === "/dashboard") {
      const params = event.queryStringParameters || {};
      const userId = params.userId;
      const month = params.month;

      if (!userId) return fail("VALIDATION_ERROR", "userId is required");
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return fail("VALIDATION_ERROR", "month is required (format: YYYY-MM)");
      }

      const data = await getDashboard(userId, month);
      return success(data);
    }

    // POST /ai/insights
    if (method === "POST" && path === "/ai/insights") {
      const body = JSON.parse(event.body || "{}");
      const { userId, month } = body;

      if (!userId) return fail("VALIDATION_ERROR", "userId is required");
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return fail("VALIDATION_ERROR", "month is required (format: YYYY-MM)");
      }

      const data = await getInsights(userId, month);
      return success(data);
    }

    // POST /ai/chat
    if (method === "POST" && path === "/ai/chat") {
      const body = JSON.parse(event.body || "{}");
      const { userId, message } = body;

      if (!userId) return fail("VALIDATION_ERROR", "userId is required");
      if (!message) return fail("VALIDATION_ERROR", "message is required");

      const data = await getChat(userId, message);
      return success(data);
    }

    return fail("NOT_FOUND", `No handler for ${method} ${path}`, 404);
  } catch (err) {
    console.error("Lambda error:", err);
    return fail("INTERNAL_ERROR", err.message || "Internal server error", 500);
  }
}
