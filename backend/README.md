# BudgetU AWS Lambda Backend

Serverless backend that provides dashboard aggregation, risk scoring, and AI endpoints.
Reads data from the existing Supabase database (no DynamoDB needed).

## Architecture

```
Frontend → API Gateway (HTTP API) → Lambda → Supabase (reads via service role)
```

## AWS Setup

### 1. Create Lambda Function

- **Runtime:** Node.js 20.x
- **Handler:** `index.handler`
- **Memory:** 256 MB (default is fine)
- **Timeout:** 15 seconds
- **Environment variables:**

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL (same as `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard → Settings → API → `service_role` key |
| `ALLOWED_ORIGIN` | Your frontend URL (or `*` for hackathon) |

### 2. IAM Permissions

The Lambda execution role needs:
- `AWSLambdaBasicExecutionRole` (CloudWatch logs — attached by default)
- No DynamoDB or Bedrock permissions needed (yet)

### 3. Create API Gateway (HTTP API)

- Create an **HTTP API** (not REST API — HTTP is simpler and cheaper)
- Add routes:

| Method | Path | Integration |
|--------|------|-------------|
| GET | `/dashboard` | Lambda: `budgetu-api` |
| POST | `/ai/insights` | Lambda: `budgetu-api` |
| POST | `/ai/chat` | Lambda: `budgetu-api` |

- **CORS configuration:**
  - Allow Origins: your frontend domain (or `*`)
  - Allow Headers: `Content-Type`
  - Allow Methods: `GET, POST, OPTIONS`

### 4. Deploy

```bash
cd backend
chmod +x deploy.sh
./deploy.sh budgetu-api us-east-1
```

Or manually:
```bash
npm install --omit=dev
zip -r function.zip index.mjs lib/ node_modules/
aws lambda update-function-code --function-name budgetu-api --zip-file fileb://function.zip --region us-east-1
```

## API Endpoints

### GET /dashboard

```
GET /dashboard?userId=<supabase-user-id>&month=2026-02
```

Response:
```json
{
  "ok": true,
  "data": {
    "month": "2026-02",
    "monthlyIncome": 1200,
    "totalSpend": 980,
    "remaining": 220,
    "estimatedSavings": 220,
    "savingsRate": 0.183,
    "categoryBreakdown": [
      { "category": "Food", "amount": 320 },
      { "category": "Shopping", "amount": 190 }
    ],
    "risk": {
      "level": "Medium",
      "score": 62,
      "reasons": ["Savings rate is under 20%", "Food spending is high relative to income"]
    },
    "insights": ["..."],
    "suggestedActions": ["..."],
    "goals": [{ "name": "Car", "targetAmount": 3000, "currentAmount": 450, "progress": 0.15 }]
  }
}
```

### POST /ai/insights

```json
{ "userId": "...", "month": "2026-02" }
```

### POST /ai/chat

```json
{ "userId": "...", "message": "What is a HYSA and should I use it?" }
```

## Testing

```bash
# Test dashboard
curl "https://<api-id>.execute-api.<region>.amazonaws.com/dashboard?userId=<id>&month=2026-02"

# Test AI chat
curl -X POST "https://<api-id>.execute-api.<region>.amazonaws.com/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<id>", "message": "What is credit utilization?"}'
```
