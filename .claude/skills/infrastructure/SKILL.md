# /infrastructure

Opinionated infrastructure decisions — 2 questions, 2 minutes. Compresses infrastructure decision-making from weeks to seconds using platform defaults and best practices.

## Commands

- `grill` — Run 2-question infrastructure setup (2 minutes)
- `migrate` — Generate platform migration guide (Supabase + Vercel)
- `decisions` — List all auto-resolved infrastructure decisions

## The Infrastructure Compression

**Traditional approach:** 30+ infrastructure decisions → 6-8 weeks setup  
**Opinionated approach:** 2 questions → 2-3 days setup

The skill uses three compression layers:
1. **Platform defaults** — Supabase + Vercel solve 15+ decisions
2. **Best practices** — Standard patterns solve 10+ decisions  
3. **Safest assumptions** — Sensible defaults solve 5+ decisions

## The 2 Questions

### Q1: Platform Stack
- **a) Supabase + Vercel** (recommended) — Backend + frontend solved instantly
- **b) Supabase + Cloudflare Workers** — Backend + edge computing
- **c) Custom Infrastructure** — Full control, requires extended grill

### Q2: Custom Domain
- **a) Platform Domains** (fastest) — app.supabase.co, vercel.app
- **b) Custom Domain** (production) — Your domain, DNS setup required

## Auto-Resolved Decisions

Choosing **Supabase + Vercel** auto-resolves 15+ infrastructure decisions:

### Data Layer (5 decisions solved)
- ✅ Database: PostgreSQL (managed by Supabase)
- ✅ Schema: Row-Level Security (RLS) patterns
- ✅ Indexes: Auto-generated on foreign keys + pkeys
- ✅ Backups: Automated, point-in-time recovery
- ✅ Migrations: Supabase migration system

### Authentication (3 decisions solved)
- ✅ Strategy: JWT + OAuth + magic links
- ✅ Providers: Google, GitHub, email/password
- ✅ Row Security: `user_id = auth.uid()` patterns

### Storage (2 decisions solved)
- ✅ File Storage: S3-compatible (R2-backed)
- ✅ CDN: Automatic global edge delivery

### API Layer (3 decisions solved)
- ✅ Filtering: Server-side (Supabase queries)
- ✅ Pagination: Built-in cursor/offset
- ✅ Real-time: Postgres subscriptions

### Performance (2 decisions solved)
- ✅ Caching: Supabase query cache + React Query client
- ✅ Edge: Vercel edge functions (global)

### Operations (3 decisions solved)
- ✅ Hosting: Vercel (Next.js optimized)
- ✅ CI/CD: Git push → deploy (automatic)
- ✅ Monitoring: Platform dashboards

### Upgrade Paths (decisions deferred until scale)
- **Search**: Start with Supabase FTS → Algolia at 100K+ rows
- **Background Jobs**: Start with Supabase cron → Job queue at complex workflows
- **Monitoring**: Start with dashboards → External at 10K+ users

## How to use

### Run infrastructure setup

```
/infrastructure grill
```

**Example session:**

```
[AGENT]: Infrastructure setup - 2 questions, 2 minutes
         These decisions prevent 5-7 weeks of infrastructure work.

[AGENT]: Q1: Choose your platform:
         a) Supabase + Vercel (recommended, solves 15+ decisions)
         b) Supabase + Cloudflare Workers  
         c) Custom infrastructure (full grill)

[USER]: a

[AGENT]: Q2: Custom domain needed?
         a) Platform domains (fastest, app.supabase.co)
         b) Custom domain (production-ready, DNS setup)

[USER]: a for now, b when we launch

[AGENT]: Done. 15 infrastructure decisions auto-resolved.
         Migration plan: 2-3 days
         - Day 1: Supabase project + schema migration
         - Day 2: Auth + Storage setup  
         - Day 3: Vercel deploy + custom domain

[AGENT]: Ready to generate migration guide? (Run /infrastructure migrate)
```

### Generate migration guide

```
/infrastructure migrate
```

Outputs:
- Day-by-day migration plan
- Supabase schema SQL
- Environment variables template
- Deployment checklist

### List auto-resolved decisions

```
/infrastructure decisions
```

Shows all 15+ decisions with their best-practice defaults and upgrade triggers.

## Decision Philosophy

### The Safest Assumption Principle

For every infrastructure decision:

1. **Is there a platform default?** → Use it
2. **Is there an 80/20 rule?** → Use the 80% solution, upgrade at scale  
3. **Is there a safest option?** → Use it (optimize later)
4. **Only NOW ask the user** → Binary final choice

### Upgrade Triggers

Every auto-resolved decision includes a **clear upgrade trigger**:

```
DECISION: Supabase full-text search
DEFAULT: Works for 0-100K rows
UPGRADE AT: 100K+ rows OR search latency >500ms
UPGRADE TO: Algolia, Typesense, or Elasticsearch
```

This means you never make the wrong choice — you start with the safest default and upgrade when needed.

## Payoff

```
┌─────────────────────────────────────────────────────────────┐
│           TIME COMPRESSION: MVP → PRODUCTION                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Traditional (30 decisions):                                 │
│  └─ Prototype (2h) + Grill (30min) + Setup (6-8 weeks)       │
│     = 6-8 weeks to production                                │
│                                                              │
│  Platform Stack (1 decision):                                 │
│  └─ Prototype (2h) + Migration (1 week)                      │
│     = 1-2 weeks to production                                │
│                                                              │
│  Opinionated Defaults (2 questions):                          │
│  └─ Prototype (2h) + Migration (2-3 days)                     │
│     = 1 week to production                                   │
│                                                              │
│  TIME SAVED: 5-7 weeks                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## When to Use Custom Infrastructure

**Choose option (c) Custom Infrastructure only if:**

- You have **>100K users** and need specialized architecture
- You have **compliance requirements** platforms can't meet
- You need **custom data patterns** (multi-tenant, sharding)
- You have **existing infrastructure** to integrate with
- You need **cost optimization** at massive scale

**For 90% of projects**: Supabase + Vercel + opinionated defaults is the right choice.

## Related Skills

- `/tasks` — Migration tasks generated as TASK-XXX entries
- `/decisions` — Auto-resolved decisions recorded in DECISIONS.md
- `/apply` — Use to align implementation with infrastructure decisions
