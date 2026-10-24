# NiveshLens – Investment Risk & Scheme Comparator
> *"See what your investment hides."*

**NiveshLens** is a production-grade, mathematically rigorous web application built to help Indian retail investors compare **Fixed Deposits (FD)**, **Public Provident Fund (PPF)**, **Mutual Funds (MF)**, and **LIC Policies**.

Unlike conventional calculators that display optimistic linear projections, NiveshLens exposes hidden trade-offs:
- **Purchasing power erosion in FDs** (post-tax real return via the Fisher equation).
- **The endowment trap in LIC plans** (effective cash-flow IRR of 4.5%–6.0% vs. Buy Term + Invest Difference).
- **Commission drag in Mutual Funds** (Regular vs. Direct plan rupee cost over horizon).
- **15-year statutory illiquidity in PPF** (enforcing the ₹1.5L cap and partial withdrawal rules).
- **Deposit insurance ceilings** (DICGC ₹5 Lakh limit exposure).
- **Insurance adequacy check** (Human Life Value protection gap).

---

## Tech Stack
- **Framework**: Next.js 14+ App Router, TypeScript (Strict), Tailwind CSS
- **Design & UI**: Radix/shadcn design patterns, Lucide icons, Framer Motion, next-themes (`light`/`dark`)
- **Visualizations**: Recharts (Growth scenario projections, Risk-Return scatter plot, 6-axis Radar comparison, Exit-penalty bar chart, Historical NAV timeline)
- **Math Engine**: `decimal.js` for zero-float precision, custom Newton-Raphson IRR/XIRR solver
- **State & Data Fetching**: TanStack React Query, React Hook Form + Zod
- **Database & Cache**: Neon Serverless Postgres with Drizzle ORM; Upstash Redis / Vercel KV rate limiting with zero-config in-memory fallback
- **Testing**: Vitest for pure finance unit tests

---

## Deployment & Setup Guide (Vercel-Optimized)

Follow this streamlined zero-friction deployment flow:

1. **Push to GitHub**: Push the repository to your GitHub account.
2. **Import to Vercel**: Create a new project in [Vercel](https://vercel.com) by importing the repository.
3. **Storage: Neon**:
   - Go to the **Storage** tab in your Vercel project dashboard.
   - Click **Connect Database** → select **Neon**.
   - Vercel automatically creates and injects `DATABASE_URL`, `POSTGRES_URL`, and `POSTGRES_URL_NON_POOLING`.
   - On build, `scripts/prebuild.mjs` automatically pushes schema migrations and seeds all natural-key financial datasets!
4. **Marketplace: Supabase**:
   - Go to the **Integrations / Marketplace** tab on Vercel and connect **Supabase** (or create a project at [supabase.com](https://supabase.com)).
   - Set the site URL and callback redirect (`https://<your-project>.vercel.app/auth/callback`).
   - Vercel injects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Set Secrets in Vercel Project Settings**:
   - Under **Settings → Environment Variables**, add:
     - `ADMIN_TOKEN`: A secure random 32+ character hex string (e.g. `openssl rand -hex 32`).
     - `CRON_SECRET`: A secure random token for scheduled daily and weekly rate refreshes.
6. **Local Development**:
   - Pull down all injected Vercel variables to your local machine:
     ```powershell
     vercel env pull .env.local
     ```
7. **Redeploy**:
   - Trigger a redeploy in Vercel. Prebuild automatically runs migrations and idempotent seed upserts.

---

## Local Development (Zero-Config)

### 1. Prerequisites
- Node.js 20+ (Node 20 or 22 recommended)
- `pnpm` (or `npm`)

### 2. Installation
```powershell
# Clone the repository
git clone https://github.com/your-username/niveshlens.git
cd niveshlens

# Install dependencies
pnpm install

# (Optional) Pull Vercel environment or copy .env.example
cp .env.example .env.local
```
*Note: If no database or environment variables are provided, NiveshLens runs with zero configuration out-of-the-box using statically imported verified seed datasets (`/data/seed/*.json`).*

### 3. Running the Application
```powershell
# Development server
pnpm dev

# Run Vitest financial unit test suite
pnpm test

# Production build
pnpm build

# Start production server
pnpm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Analytical Architecture

### 1. Fisher Equation Real Return
Instead of simple subtraction, real return is strictly calculated via Irving Fisher's formula:
$$r_{real} = \frac{1 + r_{post\_tax}}{1 + i_{inflation}} - 1$$
Where:
- $r_{post\_tax}$ is derived from the investor's marginal income tax slab under New / Old regime.
- $i_{inflation}$ is the current CPI Combined Headline Inflation from MoSPI stored in `macro_rates`.

### 2. Empirical Rolling Returns (Mutual Funds)
For any mutual fund searched via `api.mfapi.in`:
- Trailing CAGRs (1Y, 3Y, 5Y, Since Inception) are computed from raw daily NAV records.
- Annualized volatility: $\sigma_{ann} = \text{std}(\text{daily returns}) \times \sqrt{250}$.
- Max Drawdown: Peak-to-trough drop percentage with dates.
- Rolling returns percentiles: 10th percentile (Pessimistic scenario), 50th percentile (Median base case), and 90th percentile (Optimistic scenario).
- **Correction #7**: If the fund's historical track record is shorter than the user's investment horizon, scenario forecasting is disabled and flagged with *"Insufficient history"* rather than inventing numbers.
- **Correction #4**: AMFI Total Expense Ratio (TER) is read from `mf_expense_ratios`. If missing, the UI explicitly displays *"TER unavailable"* and never estimates.

### 3. Strict Indian PPF Rules (Correction #8)
- Annual deposit capped at statutory ₹1,50,000 (minimum ₹500).
- Interest compounded annually on March 31st based on minimum balance between the 5th and end of each month.
- 15-year statutory lock-in.
- **Partial withdrawal** allowed only from Year 7 onwards: capped at 50% of the balance at the end of the 4th preceding year or preceding year, whichever is lower.
- **Loan facility** available between Year 3 and Year 6 (capped at 25% of balance at end of 2nd preceding year).

### 4. LIC Policy Cash Flows & True IRR (Correction #5)
- User enters their exact annual premium, basic sum assured, policy term, and premium paying term.
- Reversionary bonuses, guaranteed additions, and surrender factor schedules are loaded from DB records with official brochure URLs.
- Effective IRR is computed dynamically using an internal Newton-Raphson & bisection solver on actual cash flows. No hardcoded typical returns exist.
- **Correction #1**: GST on individual life insurance premium defaults to 0% (exempt since 22 Sep 2025 per GST Council decisions).

### 5. Insurance Adequacy & Buy Term + Invest Difference (BTIR)
- **Human Life Value (HLV)**: Compares required cover (10–15× annual income + liabilities) against existing life cover and displays the protection gap in ₹ directly on `/compare` (Correction #12).
- **BTIR**: Compares buying an endowment plan vs. purchasing pure term insurance and investing the saved annual premium into PPF or Mutual Funds over the policy term.

---

## How to Add a New Data Source

To add a new data provider or rate feed:
1. Create a typed adapter in `lib/data-sources/<source-name>.ts` with Zod schema validation, timeouts, and retries.
2. If storing in DB, update `lib/db/schema.ts` and add fallback records to `data/seed/<dataset>.json`.
3. Add the ingestion/verification logic in `app/api/cron/<job-name>/route.ts`.
4. Register the cron schedule in `vercel.json` (daily or weekly schedules).

---

## Vercel Deployment Guide

1. **Push to GitHub**:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit of NiveshLens"
   git remote add origin https://github.com/your-username/niveshlens.git
   git push -u origin main
   ```
2. **Connect on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import your GitHub repository.
   - Framework preset: **Next.js**.
3. **Add Marketplace Integrations (Optional)**:
   - In your Vercel Project Dashboard, navigate to the **Storage** tab.
   - Click **Connect Store** -> Select **Neon** (Postgres).
   - Click **Connect Store** -> Select **Upstash Redis** (for distributed rate limiting).
4. **Configure Environment Variables**:
   - Add `ADMIN_TOKEN` (your secret admin key).
   - Add `CRON_SECRET` (token matching Vercel cron headers).
   - `DATABASE_URL` will be automatically populated if Neon was connected.
5. **Deploy**:
   - Click **Deploy**. Vercel will build and launch your application globally.
   - Vercel Crons defined in `vercel.json` will automatically schedule daily and weekly data verifications.

---

## Verification & Health Check

- **Health Endpoint**: Visit `/api/health` to inspect dataset status, database mode, and last refresh timestamps.
- **Admin Console**: Visit `/admin` with your `ADMIN_TOKEN` to view all records, edit rates, simulate crons, and review audit logs.

---

## License & Disclaimers
This tool is for educational and analytical purposes only. It does not constitute SEBI-registered financial advice. Always verify with official bank schedule pages, AMFI disclosures, and insurer policy brochures before investing.
