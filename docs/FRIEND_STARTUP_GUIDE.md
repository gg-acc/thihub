# Friend Startup Guide (AI-Agent Driven, Setup-Only)

## Purpose
This guide is for a non-developer founder who will hand this file to an AI agent (Codex, Claude, etc.) and let the agent run setup.

Scope:
- End-to-end onboarding and launch.
- No required app code changes.
- Focus on functionality and performance checks.

Roles:
- Human: provide credentials, confirmations, and access when the agent asks.
- Agent: execute setup commands phase-by-phase, validate each phase, and report status.

Non-goal:
- Security hardening is not required for launch in this guide. Optional recommendations are at the end.

---

## Operator Interface (How The Agent Must Work)
The agent must follow this contract during setup.

1. Run phases sequentially.
2. Do not modify application code unless the human explicitly approves.
3. Ask for missing credentials only when blocked.
4. After each phase, print a status block in this format:

```text
PHASE: <name>
STATUS: PASS | FAIL
COMMANDS_RUN:
- <command 1>
- <command 2>
VALIDATION:
- <check 1 result>
- <check 2 result>
BLOCKERS:
- <none or exact blocker>
NEXT_ACTION:
- <what agent will do next>
```

5. On failure, stop and provide:
- exact failing command
- exact error
- exact fix attempt to run next

---

## Prerequisites And Access

### Accounts and permissions
- GitHub access to this repository.
- Supabase account with permission to create projects.
- Vercel account with permission to create/link projects.
- Domain registrar/DNS access if using custom domain.

### Local tools (agent should verify/install)
- `git`
- `node`
- `npm`
- `supabase`
- `vercel`

Optional but useful:
- `psql`
- `jq`

### Required secrets/values to collect
- Supabase project URL
- Supabase anon key
- Supabase service role key
- Gemini API key (`GEMINI_API_KEY`)
- Production site URL (`NEXT_PUBLIC_SITE_URL`)

Note:
- This codebase includes helper routes that reference `SUPABASE_SERVICE_ROLE_KEY`, so set that exact variable name in environments where those helpers are used.

---

## Master Prompt To Give Any AI Agent
Copy and paste the prompt below to your AI agent:

```text
You are my setup operator for this repository. Follow docs/FRIEND_STARTUP_GUIDE.md exactly.

Rules:
1) Execute phases in order.
2) Do not edit app code unless I explicitly approve.
3) Ask me for missing credentials/access only when blocked.
4) After each phase, print:
   PHASE, STATUS, COMMANDS_RUN, VALIDATION, BLOCKERS, NEXT_ACTION.
5) If any command fails, stop and show:
   - exact command
   - exact error
   - exact fix command you will run next

Goal:
- Get this app running on my own Supabase + Vercel setup.
- Verify public routes and admin login.
- Verify first-use workflow and performance/functionality checks.
```

---

## Phase 1: Clone And Bootstrap

### Goal
Get local project running with dependencies installed and baseline checks passing.

### Agent steps
1. Clone and enter repo:

```bash
git clone <YOUR_FORK_OR_REPO_URL>
cd thihub
```

2. Verify tools:

```bash
git --version
node --version
npm --version
supabase --version
vercel --version
```

3. Install dependencies:

```bash
npm install
```

4. Confirm required project files exist:

```bash
ls -la
ls -la supabase/migrations
```

Expected migration files:
- `20240101000000_init.sql`
- `20240101000001_storage.sql`
- `20240102000000_quizzes.sql`
- `20240104000000_article_v2_fields.sql`
- `20250105000000_pixels_and_urls.sql`

5. Build sanity check:

```bash
npm run build
```

6. Runtime sanity check:

```bash
npm run dev
```

In another shell, verify basic routes:

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/admin/login
curl -I http://127.0.0.1:3000/disclaimer
```

---

## Phase 2: Supabase Project Setup

### Goal
Create/link Supabase project, apply schema, validate tables/policies, and create first admin user.

### Agent steps
1. Authenticate Supabase CLI:

```bash
supabase login
```

2. Create a Supabase project (if not already created) and capture:
- project ref
- database password
- project URL
- anon key
- service role key

3. Apply migrations in order from `supabase/migrations`.

Preferred (agent decides command based on current CLI/project state):
- use Supabase migration workflow if repo is linked
- if migration workflow is blocked, execute SQL files in order using SQL editor or DB connection

Migration order must be:
1. `supabase/migrations/20240101000000_init.sql`
2. `supabase/migrations/20240101000001_storage.sql`
3. `supabase/migrations/20240102000000_quizzes.sql`
4. `supabase/migrations/20240104000000_article_v2_fields.sql`
5. `supabase/migrations/20250105000000_pixels_and_urls.sql`

Programmatic migration option (recommended if CLI flow is unclear):

```bash
npm install pg dotenv
SUPABASE_DB_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require" \
node <<'NODE'
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  throw new Error('SUPABASE_DB_URL is missing');
}

const files = [
  '20240101000000_init.sql',
  '20240101000001_storage.sql',
  '20240102000000_quizzes.sql',
  '20240104000000_article_v2_fields.sql',
  '20250105000000_pixels_and_urls.sql',
].map((f) => path.join('supabase', 'migrations', f));

(async () => {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');
    await client.query(sql);
    console.log(`Applied: ${file}`);
  }
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
NODE
```

4. Validate table existence:
- `articles`
- `pixels`
- `cta_urls`
- `global_config`
- `quizzes`
- `quiz_slides`
- `quiz_responses`

5. Validate RLS/policies exist for those tables.

6. Create first admin auth user (email/password) in Supabase Authentication.
This user will log into `/admin/login`.

Programmatic user creation option:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="<strong-password>"

curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"email_confirm\": true
  }"
```

Programmatic validation command (tables + policies):

```bash
SUPABASE_DB_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require" \
node <<'NODE'
const { Client } = require('pg');

const requiredTables = [
  'articles',
  'pixels',
  'cta_urls',
  'global_config',
  'quizzes',
  'quiz_slides',
  'quiz_responses',
];

(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const tableRows = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  );
  const found = new Set(tableRows.rows.map((r) => r.table_name));
  const missing = requiredTables.filter((t) => !found.has(t));
  if (missing.length > 0) {
    throw new Error(`Missing tables: ${missing.join(', ')}`);
  }
  const policyRows = await client.query(
    "select tablename, policyname from pg_policies where schemaname='public' and tablename = any($1::text[])",
    [requiredTables]
  );
  if (policyRows.rows.length === 0) {
    throw new Error('No policies found for required tables');
  }
  console.log('All required tables found.');
  console.log(`Policies found: ${policyRows.rows.length}`);
  await client.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
NODE
```

### Validation checklist
- All 7 required tables exist.
- No failed migration remains.
- RLS/policies visible in Supabase.
- Admin user can authenticate in Supabase Auth.

---

## Phase 3: Environment Variables

### Goal
Create local and deployment environment values correctly.

### Required runtime variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Optional but recommended
- `SUPABASE_SERVICE_ROLE_KEY`

### Compatibility note
This repository includes setup helper endpoints that reference `SUPABASE_SERVICE_ROLE_KEY`.  
Set this exact key name even if your team uses prefixed naming elsewhere.

### Local `.env.local` template

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
GEMINI_API_KEY=<gemini-api-key>
NEXT_PUBLIC_SITE_URL=https://<your-production-domain>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Agent validation
1. Confirm required vars are present.
2. Confirm app can start:

```bash
npm run dev
```

3. Confirm `/admin/login` loads without env-related server errors.

---

## Phase 4: Vercel Deployment

### Goal
Deploy app to friend's Vercel project with correct env config.

### Agent steps
1. Authenticate and link project:

```bash
vercel login
vercel link
```

2. Add production env variables in Vercel (CLI example).
Values must match Phase 3:

```bash
printf "%s" "https://<project-ref>.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
printf "%s" "<anon-key>" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
printf "%s" "<gemini-api-key>" | vercel env add GEMINI_API_KEY production
printf "%s" "https://<your-production-domain-or-vercel-domain>" | vercel env add NEXT_PUBLIC_SITE_URL production
printf "%s" "<service-role-key>" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

3. Deploy:

```bash
vercel --prod
```

4. Validate deployed routes:
- `/`
- `/admin/login`
- `/disclaimer`

Example checks:

```bash
curl -I https://<deployment-domain>/
curl -I https://<deployment-domain>/admin/login
curl -I https://<deployment-domain>/disclaimer
```

### Validation checklist
- Deployment succeeds.
- All three routes return success responses.
- No missing env variable errors in Vercel logs.

---

## Phase 5: Custom Domain For Public Pages (Optional)

### Goal
Attach friend's domain/subdomain and validate TLS + routing.

Default approach:
- Start with subdomain (example: `news.friendbrand.com`) before apex domain.

### Agent steps
1. Add domain/subdomain to Vercel project.
2. Configure DNS records at registrar exactly as instructed by Vercel.
3. Wait for domain verification and TLS certificate issuance.
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel to live domain.
5. Redeploy production.

### Validation checklist
- Domain status is verified in Vercel.
- HTTPS works with valid certificate.
- Public routes load under new domain.
- Article and quiz pages resolve under new domain after creation/publishing.

---

## Phase 6: First-Time App Usage

### Goal
Complete first real workflow from admin login to live public pages.

### Human + agent flow
1. Open `/admin/login` and sign in with Supabase admin user.
2. In admin settings, add tracking pixels and CTA URLs.
3. Create first advertorial at `/admin/create`.
4. Open editor, review content, and save.
5. Create quiz funnel at `/admin/quizzes`.
6. Publish and open live URLs:
- article URL `/articles/<slug>`
- quiz URL `/quiz/<slug>`

### Functional checks
- Pixel and CTA selections persist.
- Article page renders correctly.
- Quiz page loads and progresses.
- Admin list pages reflect created content.

---

## Performance And Functionality Checklist

Use the deployed URL as `BASE_URL`.

1. Regression harness:

```bash
BASE_URL=https://<your-domain-or-vercel-url> npm run test:regression
```

2. Performance budgets:

```bash
BASE_URL=https://<your-domain-or-vercel-url> npm run test:perf
```

3. Optional dynamic route checks:

```bash
REGRESSION_ARTICLE_SLUG=<article-slug> \
REGRESSION_QUIZ_SLUG=<quiz-slug> \
BASE_URL=https://<your-domain-or-vercel-url> \
npm run test:regression
```

4. Manual API sanity:
- `GET /api/articles/<slug>`
- `GET /api/quizzes/by-slug/<slug>`

5. Admin CRUD sanity:
- Articles create/edit/delete
- Pixels create/edit/delete
- CTA URLs create/edit/delete
- Quizzes create/edit/delete

Pass criteria:
- Setup and launch require no manual app code edits.
- Core flows complete without blocking errors.

---

## Troubleshooting Playbook

### Supabase migration/policy errors
Symptom:
- Missing tables or policy errors when loading app/admin pages.

Likely causes:
- Migrations not applied in order.
- Partial execution failed mid-way.

Fix sequence:
1. Re-run migrations in exact order.
2. Verify required tables.
3. Verify RLS/policies in dashboard.
4. Re-run build and regression checks.

### Missing environment variables
Symptom:
- Build/runtime errors on startup or Vercel deployment.

Likely causes:
- Missing one of required vars.
- Wrong key names.

Fix sequence:
1. Compare env set to Phase 3 list exactly.
2. Add missing keys locally and in Vercel.
3. Restart local dev server or redeploy Vercel.

### Vercel build failure
Symptom:
- `vercel --prod` fails.

Likely causes:
- Missing env var.
- dependency install/build issue.

Fix sequence:
1. Run `npm run build` locally first.
2. Fix local build blockers.
3. Verify env vars in Vercel project settings.
4. Redeploy.

### Domain verification pending
Symptom:
- Domain shows unverified or TLS not ready.

Likely causes:
- Incorrect DNS records.
- DNS propagation delay.

Fix sequence:
1. Compare DNS records with Vercel expected records.
2. Correct DNS at registrar.
3. Wait for propagation and re-check.
4. Redeploy after domain verifies.

### Auth login failure (`/admin/login`)
Symptom:
- Cannot sign in.

Likely causes:
- Admin user not created in Supabase Auth.
- Wrong Supabase URL/anon key in env.

Fix sequence:
1. Confirm user exists in Supabase Auth.
2. Reset password if needed.
3. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Retry login.

---

## Optional Recommendations (Not Required For Launch)
These are informational only and not required for this guide's launch path.

1. Security improvements:
- tighten overly broad table permissions
- add role/tenant checks in admin APIs

2. Multi-brand/domain productization:
- add explicit brand/tenant model
- map domains to brand context instead of using global settings
- isolate brand data at DB policy layer

3. Operational maturity:
- add CI checks for migrations and smoke tests
- add release checklist and rollback routine per environment

---

## How To Extend The Product

1. Schema changes:
- add new SQL migration files under `supabase/migrations`
- keep timestamped migration ordering
- validate on staging before production

2. Reproducible setup:
- keep this guide updated whenever setup steps change
- prefer scripted checks over ad-hoc manual steps

3. Branching and releases:
- feature branch per change
- run build + regression + perf checks before merge
- deploy from known stable branch

4. Pre-deploy quality gate:

```bash
npm run build
BASE_URL=https://<staging-or-prod-url> npm run test:regression
BASE_URL=https://<staging-or-prod-url> npm run test:perf
```

---

## Test Scenarios (Definition Of Done)

1. Fresh account scenario:
- New Supabase + Vercel accounts can complete setup and launch.

2. Minimal human input scenario:
- Human only provides access/secrets when prompted.
- Agent handles all technical execution.

3. Custom domain scenario:
- Third-party domain/subdomain verifies and serves app over HTTPS.

4. Functional smoke scenario:
- Admin login works.
- First article and quiz can be created and viewed publicly.

5. Performance/functionality scenario:
- Regression and perf checks pass, or produce clear actionable failures.

---

## Assumptions
1. One master guide file is sufficient.
2. End-to-end onboarding is required.
3. No required code changes for launch.
4. Recommendations are advisory only.
5. Friend uses their own Supabase and Vercel projects.
6. Friend's AI agent can run terminal commands.
7. Domain setup is included, subdomain-first by default.
