# AWS deployment — next phases (step-by-step)

This guide picks up where the **local Docker app** leaves off. The repository already includes a **Lambda handler** (`simple-server/lambda.js`), **packaging** (`npm run package:lambda`), **Amplify build config** (`amplify.yml`), and **GitHub Actions** under `.github/workflows/`. Your job is to **create and wire** AWS resources and secrets.

For a short overview, see the **P6** section in the [root README](../README.md).

---

## Phase 0 — Prerequisites

- [ ] **AWS account** with console access (course: expect minimal spend; delete resources when done).
- [ ] **GitHub repository** with this code pushed (fork or upstream).
- [ ] **Node.js 20+** and **npm** on your machine for packaging and tests.
- [ ] Optional: **AWS CLI v2** installed and configured (`aws configure`) for uploads and scripted deploys.

Confirm locally (optional but recommended):

```bash
docker compose up -d postgres
cd simple-server
npm ci
npm run test:integration
```

---

## Phase 1 — Database (PostgreSQL on AWS)

The backend **does not** create a database for you. On Lambda, **localhost is invalid**; the app expects a real connection string (see `simple-server/config/database.js`).

### Option A — Amazon RDS for PostgreSQL (typical for “all AWS”)

1. In **VPC**, note **private subnets** (or public if your course allows — private + Lambda in VPC is more realistic).
2. Create a **DB subnet group** covering at least two AZs (RDS requirement).
3. Create **RDS → PostgreSQL** (e.g. 15.x, small instance class). Set master username/password and **initial database name** (e.g. `discord_clone`).
4. **Security group for RDS**: inbound **TCP 5432** from the security group you will attach to **Lambda** (not `0.0.0.0/0` in production).
5. After status **Available**, copy the **endpoint** (hostname), port, DB name, user, password.

Build **`DATABASE_URL`**:

```text
postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE_NAME
```

Special characters in the password must be **URL-encoded**.

6. **Lambda networking**: attach the function to the **same VPC** as RDS, with subnets that can reach the DB subnet group, and a **security group** allowed by the RDS SG on **5432**.

### Option B — Managed Postgres outside AWS (e.g. Neon)

1. Create a project and copy the **connection string**.
2. Set that string as **`DATABASE_URL`** on Lambda (no VPC required if the provider allows public access — use **SSL** if the provider requires it; you may need `?sslmode=require` in the URL per provider docs).

### After the DB exists

- First successful Lambda run with an empty DB will run **`initializeDatabase`** (schema) and idempotent **seed** logic, same idea as local Docker — no separate migration CLI is required for the default flow.

---

## Phase 2 — AWS Lambda (backend)

1. **Create function** — Author from scratch, runtime **Node.js 20.x** (or 18.x if 20 is unavailable in your region).
2. **Handler** — `lambda.handler` (file `lambda.js`, exported `handler`).
3. **Package upload** — On your machine:

   ```bash
   cd simple-server
   npm ci
   npm run package:lambda
   ```

   Upload **`simple-server/lambda-deploy.zip`** via console **Upload from** → **.zip file**, or use the CLI after the function exists.

4. **Environment variables** (minimum):

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | Postgres connection string (**required**; must not use `localhost` on Lambda) |
   | `JWT_SECRET` | Strong random secret for signing tokens |
   | `JWT_EXPIRES_IN` | e.g. `7d` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGINS` | Your Amplify URL(s), comma-separated, e.g. `https://main.xxxxx.amplifyapp.com` |

5. **Configuration** — Increase **timeout** (e.g. **30 s**) for cold start + DB init. Set **memory** as needed (e.g. 512 MB). If the function is in a **VPC**, add **VPC + subnets + security group** that can reach RDS.

6. **Test** — Add a test event or use API Gateway (next phase). **CloudWatch Logs** show connection and init errors.

---

## Phase 3 — API Gateway (REST)

1. Create **REST API** (not HTTP API if your course specifies REST).
2. Add a resource and method that **proxy** to Lambda (**Lambda proxy integration**), or use **`{proxy+}`** with **ANY** method so all paths (`/health`, `/api/...`) hit the same function — matching how Express is mounted.
3. **Deploy** the API to a stage (e.g. `prod`).
4. Copy the **Invoke URL** (base URL, no trailing slash issues — be consistent with how the frontend calls paths).

5. **Lambda permission** — API Gateway must be allowed to invoke the function (console usually adds **AWS Lambda resource-based policy** when you pick the function).

6. **CORS** — Configure on API Gateway **and** ensure **`CORS_ORIGINS`** on Lambda includes your Amplify origin.

---

## Phase 4 — AWS Amplify (frontend)

1. **Amplify Hosting** → **Host web app** → Connect **GitHub** → select repo and branch.
2. Amplify should detect **`amplify.yml`** at the repo root (`npm ci`, `npm run build`, artifact `dist`).
3. **Environment variables** (Amplify console → **Environment variables**):

   - `VITE_API_URL` = **API Gateway invoke URL** (same stage you deployed), e.g. `https://xxxx.execute-api.region.amazonaws.com/prod`  
     (No trailing slash required if your client joins paths correctly; match what `src/app/services/apiService.ts` expects.)

4. **Redeploy** after changing env vars (rebuild picks up Vite env at build time).

5. Open the **Amplify domain** and try **login** with seeded demo users (if seed ran against this DB). If the UI calls the wrong host, fix **`VITE_API_URL`** and rebuild.

---

## Phase 5 — Verify end-to-end

1. Browser: Amplify URL → app loads, API calls succeed (check **Network** tab for your API host, not `localhost`).
2. **Cloud integration tests** (optional but good for the course):

   ```bash
   cd simple-server
   export INTEGRATION_TEST_API_URL=https://YOUR_API_GATEWAY_BASE/stage   # Unix
   # Windows PowerShell: $env:INTEGRATION_TEST_API_URL="https://..."
   npm run test:integration
   ```

   Seeded users must exist in **this** database (first Lambda init seeds if empty).

3. Fix **CORS**, **401**, or **5xx** using CloudWatch Logs on Lambda and browser devtools.

---

## Phase 6 — GitHub Actions and hygiene (course P6)

1. **Secrets** (repo → **Settings** → **Secrets and variables** → **Actions**):

   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   - `LAMBDA_FUNCTION_NAME`
   - `AMPLIFY_APP_ID`, `AMPLIFY_BRANCH` (e.g. `main`)
   - Optional: `VITE_API_URL` for the **deploy-aws-amplify** workflow build step

2. **IAM** — Use a user or role with **least privilege**: e.g. `lambda:UpdateFunctionCode`, `amplify:StartJob`, and read-only where possible. Prefer **OIDC** over long-lived keys if you advance beyond the course baseline ([GitHub docs](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)).

3. **Workflows** (already in repo):

   - `run-integration-tests.yml` — runs on pushes/PRs with a **Postgres service**.
   - `deploy-aws-lambda.yml` — on push to **`main`**, packages and updates Lambda.
   - `deploy-aws-amplify.yml` — on push to **`main`**, builds and triggers **Amplify** `start-job`.

   Adjust branch names in the YAML if your default branch is not `main`.

4. **Branch protection** — Require PR + passing checks (including integration tests) before merge to **`main`**, per assignment.

---

## Phase 7 — Teardown and cost awareness

- Stop or **delete** RDS, Lambda, API Gateway, Amplify app, and **NAT Gateway** / unused VPC pieces when the project ends — **NAT and RDS** are common surprise costs.
- Remove or rotate **GitHub secrets** and **AWS IAM keys** used for CI.

---

## Quick troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Lambda error about **localhost** / config throws on load | **`DATABASE_URL`** not set or still points to localhost; fix env on Lambda. |
| **Timeout** on first request | DB init + cold start; increase Lambda timeout; ensure RDS is reachable from Lambda SG/VPC. |
| **Cannot connect to Postgres** | Wrong SG, Lambda not in VPC, wrong subnet route, or RDS not “Available”. |
| Browser **CORS** error | **`CORS_ORIGINS`** on Lambda and/or API Gateway CORS; use exact Amplify URL including `https://`. |
| UI calls **localhost:3001** | Amplify build missing or wrong **`VITE_API_URL`**; rebuild after setting env. |
| **Too many connections** | Lower `pg` pool `max` for Lambda or use **RDS Proxy** under load. |

---

## Reference files in this repo

| Item | Path |
|------|------|
| Lambda entry | `simple-server/lambda.js` |
| Package script | `simple-server/scripts/package-lambda.cjs` → `npm run package:lambda` |
| DB pool + Lambda guard | `simple-server/config/database.js` |
| Amplify build | `amplify.yml` |
| Integration spec | `docs/INTEGRATION_TEST_SPEC.md` |
| Workflows | `.github/workflows/run-integration-tests.yml`, `deploy-aws-lambda.yml`, `deploy-aws-amplify.yml` |

When this guide is complete for your team, you should have a **public Amplify URL**, a working **API Gateway → Lambda** backend, and a **Postgres** instance referenced by **`DATABASE_URL`**.
