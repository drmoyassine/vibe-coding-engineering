// /infrastructure workflow — opinionated infrastructure decisions in 2 questions, 2 minutes
// Compresses infrastructure decision-making using platform defaults + best practices + safest assumptions
//
// 3-phase structure:
//   Phase 1: Grill (2 binary questions with platform defaults)
//   Phase 2: Record (create VEF decisions from auto-resolved infrastructure)
//   Phase 3: Plan (generate migration guide and implementation tasks)
//
// Invoke via Skill with args: { write: false } for dry-run, { write: true } to commit

export const meta = {
  name: 'infrastructure-grill',
  description: 'Opinionated infrastructure decisions — 2 questions, 2 minutes using platform defaults and best practices',
  phases: [
    { title: 'Grill', detail: '2 binary questions with platform defaults' },
    { title: 'Record', detail: 'create VEF decisions from auto-resolved infrastructure' },
    { title: 'Plan', detail: 'generate migration guide and implementation tasks' },
  ],
}

// --- Args ---
log(`args received: ${JSON.stringify(args)}`)

const flags = (args && typeof args === 'object') ? args : {}
const writeRequested = flags.write === true

log(`Effective flags: writeRequested=${writeRequested}`)

// --- Platform stacks and auto-resolved decisions ---

const PLATFORMS = {
  'supabase-vercel': {
    name: 'Supabase + Vercel',
    description: 'Backend + frontend solved, 15+ decisions auto-resolved',
    tradeoffs: '+Fastest setup, +Best practices, +Zero infra maintenance',
    autoResolved: 15,
    decisions: [
      // Data layer (5 decisions)
      { id: 'DEC-005', category: 'data', title: 'Database: PostgreSQL managed by Supabase', decision: 'Use Supabase PostgreSQL with auto-generated indexes on foreign keys and primary keys', rationale: 'Zero maintenance, automated backups, point-in-time recovery, RLS built-in', consequences: 'Managed service, no DB ops overhead, auto-scaling included' },
      { id: 'DEC-006', category: 'data', title: 'Schema: Row-Level Security patterns', decision: 'Use RLS policy pattern: user_id = auth.uid() for all user-scoped data', rationale: 'Security enforced at DB level, no application-side checks needed', consequences: 'Automatic multi-tenancy security, requires RLS policy setup' },
      { id: 'DEC-007', category: 'data', title: 'Backups: Automated point-in-time recovery', decision: 'Use Supabase automated backups with 30-day retention', rationale: 'Zero configuration, instant PITR, no backup maintenance', consequences: 'Included in Pro plan, no backup ops needed' },
      { id: 'DEC-008', category: 'data', title: 'Migrations: Supabase migration system', decision: 'Use Supabase migration system for schema changes', rationale: 'Version-controlled migrations, rollback support, zero-downtime deployments', consequences: 'Manual migration files, requires migration discipline' },
      { id: 'DEC-009', category: 'data', title: 'Indexes: Auto-generated + manual for hot paths', decision: 'Start with auto-generated indexes, add manual indexes only for identified slow queries', rationale: '80% of queries work with auto indexes, optimize only the 20% hot paths', consequences: 'Some queries may need index optimization, monitor query performance' },

      // Authentication (3 decisions)
      { id: 'DEC-010', category: 'security', title: 'Auth: JWT + OAuth + magic links', decision: 'Use Supabase Auth with JWT tokens, OAuth providers (Google, GitHub), and magic email links', rationale: 'Industry-standard auth flow, zero token storage, social login built-in', consequences: 'No password DB, no token refresh logic, managed auth flow' },
      { id: 'DEC-011', category: 'security', title: 'Auth providers: Google, GitHub, email/password', decision: 'Enable Google OAuth, GitHub OAuth, and email/password auth by default', rationale: 'Covers 90% of user preferences, social login reduces friction', consequences: 'No custom OAuth flows, provider dashboard manages config' },
      { id: 'DEC-012', category: 'security', title: 'Row security: user_id = auth.uid() pattern', decision: 'Use RLS policy user_id = auth.uid() for all user-scoped tables', rationale: 'Database-level security, no application-side checks, automatic multi-tenancy', consequences: 'RLS policy setup required, no app-level auth checks on data' },

      // Storage (2 decisions)
      { id: 'DEC-013', category: 'services', title: 'File storage: S3-compatible (R2-backed)', decision: 'Use Supabase Storage with R2 backend for all file uploads', rationale: 'S3-compatible API, no egress fees, automatic CDN delivery', consequences: 'Included in Pro plan, no storage ops needed' },
      { id: 'DEC-014', category: 'services', title: 'CDN: Automatic global edge delivery', decision: 'Use Supabase Storage automatic CDN for all static assets', rationale: 'Global edge delivery, zero configuration, automatic cache invalidation', consequences: 'No CDN config, automatic cache headers, global performance' },

      // API layer (3 decisions)
      { id: 'DEC-015', category: 'api', title: 'API filtering: Server-side Supabase queries', decision: 'Implement server-side filtering in Supabase queries with pagination', rationale: 'Reduces bandwidth (10KB vs 500KB per request), enables pagination, scales to 100K+ concurrent', consequences: 'More complex API implementation, requires pagination logic' },
      { id: 'DEC-016', category: 'api', title: 'Pagination: Built-in cursor/offset', decision: 'Use Supabase built-in pagination with cursor or offset', rationale: 'Standard pagination pattern, automatic limit/offset handling, efficient for large datasets', consequences: 'No custom pagination logic, follows Supabase best practices' },
      { id: 'DEC-017', category: 'api', title: 'Real-time: Postgres subscriptions', decision: 'Use Supabase real-time subscriptions for live updates', rationale: 'Built-in WebSocket support, automatic connection management, zero config', consequences: 'No WebSocket server needed, automatic reconnection handling' },

      // Performance (2 decisions)
      { id: 'DEC-018', category: 'scale', title: 'Caching: Supabase query cache + React Query', decision: 'Use Supabase query cache for DB queries + React Query for client state', rationale: 'Automatic query caching, intelligent invalidation, stale-while-revalidate patterns', consequences: 'No cache server needed, React Query handles client caching' },
      { id: 'DEC-019', category: 'scale', title: 'Edge: Vercel edge functions', decision: 'Use Vercel edge functions for global compute', rationale: 'Global edge deployment, automatic scaling, zero cold starts', consequences: 'No server management, automatic geographic distribution' },

      // Operations (3 decisions)
      { id: 'DEC-020', category: 'deployment', title: 'Hosting: Vercel (Next.js optimized)', decision: 'Use Vercel for Next.js hosting with automatic optimization', rationale: 'Zero-config deployment, automatic builds, preview deployments', consequences: 'Vendor lock-in to Vercel, requires Vercel account' },
      { id: 'DEC-021', category: 'deployment', title: 'CI/CD: Git push → deploy (automatic)', decision: 'Use Vercel automatic CI/CD on git push', rationale: 'Zero config CI/CD, automatic previews, one-click rollbacks', consequences: 'No GitHub Actions config, Vercel manages build pipeline' },
      { id: 'DEC-022', category: 'services', title: 'Monitoring: Platform dashboards', decision: 'Start with Supabase and Vercel built-in dashboards', rationale: 'Zero setup monitoring, adequate for 0-10K users, upgrade only at scale', consequences: 'No external monitoring setup, upgrade to Sentry/DataDog at 10K+ users' },
    ],
    migrationDays: 3,
    estimatedDays: '2-3 days',
  },
  'supabase-cf': {
    name: 'Supabase + Cloudflare Workers',
    description: 'Backend + edge computing, global CDN',
    tradeoffs: '+Global edge, +Workers KV/D1, -More complex routing',
    autoResolved: 14,
    decisions: 'Similar to Supabase+Vercel but with Cloudflare Workers edge compute',
    migrationDays: 4,
    estimatedDays: '3-4 days',
  },
  'custom': {
    name: 'Custom Infrastructure',
    description: 'Full control, requires extended grill session',
    tradeoffs: '+Maximum control, -Weeks of setup time',
    autoResolved: 0,
    decisions: 'Requires full infrastructure grill across 8 dimensions',
    migrationDays: 42,
    estimatedDays: '6-8 weeks',
  },
}

const UPGRADE_PATHS = [
  { decision: 'Search: Supabase full-text search', trigger: '100K+ rows OR search latency >500ms', upgradeTo: 'Algolia, Typesense, or Elasticsearch' },
  { decision: 'Background jobs: Supabase cron', trigger: 'Complex workflows OR retry logic needed', upgradeTo: 'Temporal, Bull, or Sidekiq' },
  { decision: 'Monitoring: Platform dashboards', trigger: '10K+ users OR custom tracking needs', upgradeTo: 'Sentry, DataDog, or New Relic' },
  { decision: 'Caching: Query cache + React Query', trigger: 'Custom invalidation OR cache warming needs', upgradeTo: 'Redis with custom cache strategy' },
]

// ================================================================================
// PHASE 1 — Grill (2 binary questions with platform defaults)
// ================================================================================

phase('Grill')

log('Starting opinionated infrastructure grill...')

const GRILL_SCHEMA = {
  type: 'object',
  properties: {
    platform: {
      type: 'string',
      enum: ['supabase-vercel', 'supabase-cf', 'custom'],
      description: 'Chosen platform stack',
    },
    customDomain: {
      type: 'string',
      enum: ['platform', 'custom', 'platform-then-custom'],
      description: 'Domain strategy',
    },
    summary: { type: 'string', description: 'Summary of choices' },
  },
  required: ['platform', 'customDomain', 'summary'],
}

const grillResult = await agent(
  `You are the INFRASTRUCTURE GRILL agent. Conduct a 2-question, 2-minute session.

  INSTRUCTIONS:
  1. Present Q1: Platform stack choice with clear a/b/c options
  2. Wait for user response
  3. Present Q2: Custom domain choice with clear options
  4. Wait for user response
  5. Provide summary of choices and what was auto-resolved

  Q1 OPTIONS:
    a) Supabase + Vercel (recommended)
       - Backend + frontend solved instantly
       - 15+ infrastructure decisions auto-resolved
       - Migration: 2-3 days

    b) Supabase + Cloudflare Workers
       - Backend + edge computing
       - 14+ infrastructure decisions auto-resolved
       - Migration: 3-4 days

    c) Custom Infrastructure
       - Full control over every decision
       - Requires extended grill session (30+ questions)
       - Migration: 6-8 weeks

  Q2 OPTIONS:
    a) Platform domains (fastest)
       - app.supabase.co, vercel.app
       - Zero DNS setup

    b) Custom domain (production-ready)
       - Your domain name
       - DNS setup required

    c) Platform now, custom later
       - Start with platform domains
       - Migrate to custom domain when launching

  AFTER BOTH QUESTIONS:
  - List the infrastructure decisions that were auto-resolved
  - Provide migration timeline
  - Ask if user wants to generate migration guide

  Return structured answers with platform, customDomain, and summary.`,
  {
    label: 'grill',
    phase: 'Grill',
    schema: GRILL_SCHEMA,
  }
)

if (!grillResult) {
  throw new Error('Grill session failed - no result returned')
}

log(`Platform chosen: ${grillResult.platform}`)
log(`Domain strategy: ${grillResult.customDomain}`)

// ================================================================================
// PHASE 2 — Record (create VEF decisions from auto-resolved infrastructure)
// ================================================================================

phase('Record')

const DECISION_SCHEMA = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string' },
          context: { type: 'string' },
          decision: { type: 'string' },
          rationale: { type: 'string' },
          consequences: { type: 'string' },
          category: { type: 'string' },
          upgradeTrigger: { type: 'string', description: 'When to upgrade from this default' },
          upgradeTo: { type: 'string', description: 'What to upgrade to' },
        },
        required: ['id', 'title', 'status', 'context', 'decision', 'rationale', 'consequences', 'category'],
      },
    },
    upgradePaths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Decisions deferred until scale with upgrade triggers',
    },
    summary: { type: 'string' },
    autoResolvedCount: { type: 'number' },
  },
  required: ['decisions', 'upgradePaths', 'summary', 'autoResolvedCount'],
}

const platform = PLATFORMS[grillResult.platform]

log(`Recording ${platform.autoResolved} auto-resolved decisions...`)

const decisionData = platform.decisions === 'Similar to Supabase+Vercel but with Cloudflare Workers edge compute'
  ? PLATFORMS['supabase-vercel'].decisions.map(d => ({
      ...d,
      id: d.id.replace('DEC-', 'DEC-'), // Keep same IDs for consistency
      consequences: d.consequences.replace('Vercel', 'Cloudflare Workers'),
    }))
  : platform.decisions

const decisionResults = await agent(
  `You are the DECISION RECORDER. Generate VEF decisions for auto-resolved infrastructure.

  PLATFORM: ${platform.name}
  DECISIONS TO RECORD:
  ${typeof platform.decisions === 'string' ? platform.decisions : JSON.stringify(platform.decisions, null, 2)}

  UPGRADE PATHS (decisions deferred until scale):
  ${JSON.stringify(UPGRADE_PATHS, null, 2)}

  INSTRUCTIONS:
  1. Convert platform decisions into VEF decision format
  2. Include upgradeTrigger and upgradeTo for deferred decisions
  3. Group decisions by category (scale, data, api, security, services, deployment)
  4. Maintain sequential DEC IDs (start from DEC-005)
  5. Include context explaining why this default is safest for 80% of projects
  6. Note what triggers an upgrade from this default

  Return structured decisions ready for VEF recording.`,
  {
    label: 'record-decisions',
    phase: 'Record',
    schema: DECISION_SCHEMA,
  }
)

if (!decisionResults) {
  throw new Error('Decision recording failed - no result returned')
}

log(`Generated ${decisionResults.decisions.length} infrastructure decisions`)
log(`Identified ${decisionResults.upgradePaths.length} upgrade paths`)

// ================================================================================
// PHASE 3 — Plan (generate migration guide and implementation tasks)
// ================================================================================

phase('Plan')

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    migrationGuide: {
      type: 'object',
      properties: {
        totalDays: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'number' },
              title: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
              outcomes: { type: 'array', items: { type: 'string' } },
            },
            required: ['day', 'title', 'tasks', 'outcomes'],
          },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string' },
          estimatedHours: { type: 'number' },
          dependencies: { type: 'array', items: { type: 'string' } },
          related_decisions: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'description', 'status', 'priority', 'estimatedHours'],
      },
    },
    architectureUpdates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          content: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['section', 'content', 'reason'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['migrationGuide', 'tasks', 'architectureUpdates', 'summary'],
}

log('Generating migration guide and implementation tasks...')

const planResults = await agent(
  `You are the MIGRATION PLANNER. Generate day-by-day migration and tasks.

  PLATFORM: ${platform.name}
  TIME ESTIMATE: ${platform.estimatedDays}

  DECISIONS:
  ${JSON.stringify(decisionResults.decisions.slice(0, 5), null, 2)}

  INSTRUCTIONS:
  1. Generate day-by-day migration guide (${platform.estimatedDays})
  2. Each day should have 3-5 specific tasks with clear outcomes
  3. Generate TASK-XXX entries for each infrastructure component
  4. Assign sequential IDs (start from TASK-020)
  5. Estimate hours realistically (account for learning curve)
  6. Note dependencies (e.g., "requires DEC-005", "blocks TASK-005")
  7. Generate ARCHITECTURE.md updates for production patterns

  Return structured migration guide and tasks.`,
  {
    label: 'plan-migration',
    phase: 'Plan',
    schema: PLAN_SCHEMA,
  }
)

if (!planResults) {
  throw new Error('Migration planning failed - no result returned')
}

log(`Generated migration guide: ${planResults.migrationGuide.totalDays} days`)
log(`Generated ${planResults.tasks.length} implementation tasks`)
log(`Generated ${planResults.architectureUpdates.length} architecture updates`)

// ================================================================================
// Final Result
// ================================================================================

const result = {
  writeRequested,
  platform: grillResult.platform,
  customDomain: grillResult.customDomain,
  autoResolvedDecisions: platform.autoResolved,
  decisionsGenerated: decisionResults.decisions.length,
  upgradePaths: decisionResults.upgradePaths.length,
  tasksGenerated: planResults.tasks.length,
  architectureUpdates: planResults.architectureUpdates.length,
  migrationDays: planResults.migrationGuide.totalDays,
  grillResult,
  decisions: decisionResults.decisions,
  upgradePaths: decisionResults.upgradePaths,
  migrationGuide: planResults.migrationGuide,
  tasks: planResults.tasks,
  architectureUpdates: planResults.architectureUpdates,
  summary: planResults.summary,
  acceptance: {
    accepted: false,
    writeRequested,
    reason: writeRequested
      ? 'Ready to write decisions and tasks through VEF CLI'
      : 'Dry run complete. Review results before running with --write',
  },
}

log(`\n=== /infrastructure COMPLETE ===`)
log(`Platform: ${platform.name}`)
log(`Domain: ${grillResult.customDomain}`)
log(`Decisions auto-resolved: ${result.autoResolvedDecisions}`)
log(`Decisions generated: ${result.decisionsGenerated}`)
log(`Upgrade paths identified: ${result.upgradePaths}`)
log(`Tasks generated: ${result.tasksGenerated}`)
log(`Migration timeline: ${result.migrationDays} days`)

return result
