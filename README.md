# ROOTS AI Platform
ROOTS AI Platform is a Next.js application for the controlled ROOTS assessment, deterministic scoring, report generation, legal content, and AI-governance boundaries.

## Current implementation
- Canonical C-01 assessment question bank and C-02 scoring engine.
- Controlled report generation with provenance, metrics, rules, and PDF support.
- Authentication and Supabase server/client integration.
- Legal pages for privacy, terms, and cookies.
- AI provider, schema, provenance, projection, and governance-boundary modules.
- M2 security evidence and M3 decision/evidence packages.

## Requirements
- Node.js 20 or newer
- npm
- Supabase environment variables when running authenticated/database features
## Setup
```bash
npm install
npm run dev
```

Create `.env.local` for local secrets. Environment files are intentionally ignored and must never be committed.

## Validation commands
```bash
npm test
npm run test:vitest
npm run build
npm run check:parity
npm run check:a11y
npm run evidence:ai
```

Database checks require a configured Supabase environment:

```bash
npm run db:verify
npm run db:probes
```

## Documentation and evidence
- `ROOTS-AI_M2_Closure_Update.md` — M2 closure status and evidence notes.
- `M2_OPEN_ITEMS.md` — outstanding M1/M2 items requiring resolution or confirmation.
- `ROOTS-AI_M2_Strict_Implementation_Blueprint.md` — implementation constraints and baseline.
- `ROOTS-AI_M3_Decision_Log.md` — M3 decisions, open questions, and verification status.
- `m2/` — M2 completion package, security tests, and generated evidence.
- `.m3pkg/` — M3 report-review and acceptance evidence.
- `supabase/migrations/` — database schema and row-level security migrations.

The supplied PDF, DOCX, XLSX, and ZIP source packages in the repository are controlled reference materials. Do not modify or replace them without recording the source/version change in the relevant decision or closure document.

## Safety and governance
This product is an educational, questionnaire-derived system. It is not a diagnostic tool and does not provide medical advice. Report wording and score semantics must remain aligned with the controlled source packages and the documented AI boundary rules.
