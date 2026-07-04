# Student Companion Berlin

A grounded assistant for international students navigating official setup tasks in Berlin (Anmeldung, residence permit, blocked account, health insurance, bank account, tax ID, university enrollment). Answers come only from a verified static knowledge base — never invented.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Google Gemini 2.5 Flash** via REST (free tier, server-side only)
- No database, no auth — knowledge lives in `data/processes.json`

## Prerequisites

- Node.js 18+
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup

```bash
# 1. Install dependencies
cd student-companion-berlin
npm install

# 2. Configure your API key
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_key_here

# 3. Start the dev server
npm run dev
# Open http://localhost:3000
```

## Smoke test (retrieval ordering)

Prints the topologically-sorted process list for a non-EU student without starting the server:

```bash
node scripts/test-retrieval.mjs
```

Expected output (8 processes, Anmeldung first, university enrollment last):

```
1. anmeldung
2. blocked_account
3. student_visa         (after: blocked_account)
4. residence_permit_student (after: anmeldung, student_visa)
5. health_insurance_student (after: anmeldung)
6. bank_account         (after: anmeldung)
7. tax_id               (after: anmeldung)
8. university_enrollment (after: health_insurance_student)
```

## Type check

```bash
npx tsc --noEmit
```

## Production build

```bash
npm run build
```

## Architecture

```
app/
  layout.tsx        — root layout (metadata)
  page.tsx          — client UI: profile selects, question box, answer renderer
  globals.css       — dark-mode design system
  api/ask/route.ts  — POST handler; calls Gemini server-side, returns answer + sources
data/
  processes.json    — sole source of truth (8 processes, Berlin only)
lib/
  knowledge.ts      — typed loader + topological sort by prerequisites
  prompt.ts         — system prompt (hard grounding rules) + context serialiser
scripts/
  test-retrieval.mjs — standalone Node smoke test
```

## Design constraints

- **Berlin only.** No other cities.
- **Grounded answers only.** The LLM is instructed (and provided context) only from `processes.json`. It must say it has no information if a question cannot be answered from the data.
- **Every answer shows** the official source links, the verified date, and the disclaimer "This is general guidance, not legal or immigration advice."
- **API key is server-side only** — never exposed to the browser.
