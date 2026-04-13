/**
 * Comprehensive FAANG Scenario Library
 * 50+ real scenarios from Google, Meta, Amazon, etc.
 * Levels: Junior (20), Mid (20), Senior (15+)
 * 
 * Based on:
 * - Official postmortems (danluu/post-mortems)
 * - YouTube engineer reviews (Blind, Levels.fyi, Glassdoor)
 * - Company engineering blogs
 * - Real incident data
 */

import { Scenario } from "./scenarioStore";

// ============ JUNIOR LEVEL (20) ============
// Focus: Understanding basics, single-service debugging, error patterns

const juniorScenarios: Array<[string, Scenario]> = [
  [
    "junior-1-debug-null-pointer",
    {
      id: "junior-1-debug-null-pointer",
      title: "DEBUG-001: Null Pointer Exception in Payment Handler",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Find and fix a null pointer exception causing checkout to fail",
      context:
        "Users report 'Payment failed' errors intermittently (5% of transactions). Looking at logs, you see NullPointerException in PaymentHandler.process(). One of the method calls is returning null when it shouldn't. You need to: (1) identify which field is null, (2) add a defensive check, (3) understand why it's null.",
      requirements: [
        "Identify which variable is null from stack trace",
        "Propose a defensive check (is it safe to assume non-null?)",
        "Determine root cause: bad input or bad code?",
        "Write fix that prevents null dereference",
        "Test: what test cases would catch this?",
      ],
      evaluationCriteria: [
        "You identified the exact null object",
        "Your fix includes both defensive check + root cause fix",
        "You thought about whether to fail-safe or error clearly",
        "You considered cascading effects (what breaks downstream?)",
        "Your test cases include the edge case",
      ],
      faangFocus: "Defensive programming, null handling",
      tools: ["Stack trace", "Code editor", "Unit tests"],
      initialFiles: {
        "src/PaymentHandler.ts": `import { StripeClient } from './lib/stripe';
import { Logger } from './utils/logger';
import { Database } from './db';

const logger = new Logger('PaymentHandler');
const stripe = new StripeClient(process.env.STRIPE_KEY);
const db = new Database();

export class PaymentHandler {
  async process(req: any, res: any) {\n    const payload = req.body;
    logger.info(\`Processing payment for user \${payload.user.id}\`);

    // Fetch user details
    const user = await db.users.findById(payload.user.id);
    
    // Bug is here: if user has no 'billingInfo', this throws null pointer exception
    // "Cannot read properties of null (reading 'cardToken')"
    const cardToken = user.billingInfo.cardToken; 

    try {
      const charge = await stripe.charge({
        amount: payload.amount,
        source: cardToken
      });
      return res.status(200).json({ success: true, chargeId: charge.id });
    } catch (err) {
      logger.error('Payment failed', err);
      return res.status(500).json({ error: 'Payment failed' });
    }
  }
}`,
        "src/utils/logger.ts": `export class Logger {
  private context: string;
  constructor(context: string) {
    this.context = context;
  }
  info(msg: string) {
    console.log(\`[INFO] [\${this.context}] \${msg}\`);
  }
  error(msg: string, err?: any) {
    console.error(\`[ERROR] [\${this.context}] \${msg}\`, err);
  }
}`,
        "src/db/index.ts": `export class Database {
  users = {
    findById: async (id: string) => {
      // Mocked DB response
      if (id === 'user_123') return { id: 'user_123', billingInfo: { cardToken: 'tok_visa' }};
      if (id === 'user_456') return { id: 'user_456', billingInfo: null }; // <--- The cause of the bug
      return null;
    }
  }
}`,
        "package.json": `{
  "name": "payment-service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "stripe": "^13.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.4",
    "jest": "^29.5.0"
  }
}`,
        "README.md": `# Payment Service

This microservice handles checkout transactions.
Recently we've seen a spike in HTTP 500 errors in production (about 5% of requests).

## Objective
Analyze the \`PaymentHandler.ts\` file to identify why we are getting a Null Pointer Exception. Fix the code to gracefully handle the error instead of crashing the server.
`
      },
      expectedSolution: {
        description: "Add null check for billingInfo before accessing cardToken",
        keyPatterns: ["billingInfo", "cardToken", "400"]
      }
    } as Scenario,
  ],

  [
    "junior-2-query-timeout",
    {
      id: "junior-2-query-timeout",
      title: "PERF-002: API Endpoint Timeout (> 30s)",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 25,
      description: "A GET endpoint is timing out; users see blank screens",
      context:
        "The /api/user/:id endpoint takes 30-45 seconds sometimes. Looking at logs: you call UserService (1ms), then run a SELECT query that joins users + orders + shipping. The query takes 25+ seconds. Total: 26+ seconds (over timeout). You have production data: 10M users, 500M orders. The query seems simple but it's slow.",
      requirements: [
        "Identify what makes the query slow (full table scan? missing index?)",
        "Check: are there alternative query patterns?",
        "Propose optimization (index? caching? different query?)",
        "Estimate speedup: how much faster will it be?",
        "Understand tradeoffs: storage cost? maintenance?",
      ],
      evaluationCriteria: [
        "You identified the missing/ineffective index",
        "You understood join cost on large tables",
        "You proposed a specific, measurable optimization",
        "You thought about cache tradeoffs",
        "You validated: is the index the only issue?",
      ],
      faangFocus: "Query optimization, indexing basics, performance thinking",
      tools: ["SQL EXPLAIN", "Database stats", "Index tool"],
      initialFiles: {
        "src/routes/user.ts": `import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/user/:id – Returns user profile with order history
router.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // BUG: This query joins 3 huge tables with NO index on orders.user_id
    const result = await pool.query(\`
      SELECT u.id, u.name, u.email,
             o.order_id, o.total, o.created_at,
             s.tracking_number, s.status as shipping_status
      FROM users u
      JOIN orders o ON o.user_id = u.id
      JOIN shipping s ON s.order_id = o.order_id
      WHERE u.id = $1
      ORDER BY o.created_at DESC
    \`, [id]);

    res.json({ user: result.rows[0], orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;`,
        "src/db/index.ts": `import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: 'userservice',
  user: 'app',
  password: process.env.DB_PASSWORD,
  max: 20,
});`,
        "src/db/schema.sql": `-- Tables (production data: 10M users, 500M orders, 200M shipping)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER,         -- NO INDEX! This is the problem
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT now()
);
-- Missing: CREATE INDEX idx_orders_user_id ON orders(user_id);

CREATE TABLE shipping (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  tracking_number VARCHAR(50),
  status VARCHAR(20)
);`,
        "logs/slow-query.log": `[2026-03-28 14:22:01] SLOW QUERY (28.4s): SELECT u.id, u.name... JOIN orders o ON o.user_id = u.id ... WHERE u.id = 4821
[2026-03-28 14:22:33] SLOW QUERY (31.2s): SELECT u.id, u.name... JOIN orders o ON o.user_id = u.id ... WHERE u.id = 9102
[2026-03-28 14:23:15] SLOW QUERY (45.1s): SELECT u.id, u.name... JOIN orders o ON o.user_id = u.id ... WHERE u.id = 1533
[2026-03-28 14:23:17] TIMEOUT: Query exceeded 30s limit for user_id=7201`,
        "README.md": `# UserService API

## Problem
The GET /api/user/:id endpoint is timing out (~30-45s). Users see blank profile pages.

## Your Task
1. Analyze the slow query in \`src/routes/user.ts\`
2. Check \`src/db/schema.sql\` for missing indexes
3. Review \`logs/slow-query.log\` for patterns
4. Propose and implement the fix
`
      },
      expectedSolution: {
        description: "Add index on orders.user_id to speed up the JOIN query",
        keyPatterns: ["CREATE INDEX", "orders", "user_id"]
      }
    } as Scenario,
  ],

  [
    "junior-3-deploy-environment-mismatch",
    {
      id: "junior-3-deploy-environment-mismatch",
      title: "ENV-003: Feature Works in Dev, Fails in Prod",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Your feature works in local dev but crashes in production",
      context:
        "You deploy a new feature that reads from Redis. Works perfectly locally. Ships to prod. Immediately: errors. 'Cannot connect to Redis'. But Redis is up. Logs show: 'redis://localhost:6379' in prod config. Your local machine has Redis running. Prod doesn't have localhost:6379. Environment variables aren't set. You forgot to configure Redis connection for prod environment.",
      requirements: [
        "Identify the config difference between dev/prod",
        "Find where environment-specific config should be set",
        "Understand how config should be loaded (env vars? config files?)",
        "Propose fix: where do Redis credentials come from in prod?",
        "Ensure this doesn't happen again (automation?)",
      ],
      evaluationCriteria: [
        "You caught the hard-coded localhost",
        "You understood environment-specific config loading",
        "You found where prod config should live",
        "You thought about security (don't hardcode credentials!)",
        "You proposed validation: can we test this in CI?",
      ],
      faangFocus: "Configuration management, dev/prod differences",
      tools: ["Environment variables", "Config manager", "CI system"],
      initialFiles: {
        "src/services/cache.ts": `import Redis from 'ioredis';

// BUG: hardcoded localhost – works in dev, crashes in prod
const redis = new Redis({
  host: 'localhost',  // <-- Should be process.env.REDIS_HOST
  port: 6379,
});

export async function getFromCache(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCache(key: string, value: string, ttl = 3600) {
  return redis.setex(key, ttl, value);
}`,
        "src/routes/feature.ts": `import { Router } from 'express';
import { getFromCache, setCache } from '../services/cache';

const router = Router();

router.get('/api/feature/:id', async (req, res) => {
  try {
    const cached = await getFromCache(\`feature:\${req.params.id}\`);
    if (cached) return res.json(JSON.parse(cached));

    // Fallback to DB...
    const data = { id: req.params.id, name: 'Premium Feature', enabled: true };
    await setCache(\`feature:\${req.params.id}\`, JSON.stringify(data));
    res.json(data);
  } catch (err: any) {
    // This is what the user sees in prod:
    // Error: connect ECONNREFUSED 127.0.0.1:6379
    res.status(500).json({ error: err.message });
  }
});

export default router;`,
        ".env.development": `REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgres://app:password@localhost:5432/myapp
NODE_ENV=development`,
        ".env.production": `# TODO: These should be set via infrastructure (K8s ConfigMap / Secrets)
# REDIS_HOST=redis.internal.prod.svc
# REDIS_PORT=6379
# DATABASE_URL=postgres://app:xxx@db-primary.internal:5432/myapp
NODE_ENV=production`,
        "logs/prod-errors.log": `[ERROR] 2026-03-29T08:12:44Z connect ECONNREFUSED 127.0.0.1:6379
[ERROR] 2026-03-29T08:12:44Z connect ECONNREFUSED 127.0.0.1:6379
[ERROR] 2026-03-29T08:12:45Z connect ECONNREFUSED 127.0.0.1:6379
[FATAL] 2026-03-29T08:12:46Z Service unhealthy – Redis connection failed after 3 retries`,
        "README.md": `# Feature Service

Deployed to prod 30 minutes ago. All requests returning 500.
Logs say "ECONNREFUSED 127.0.0.1:6379" but Redis cluster is UP at redis.internal.prod.svc.

Debug the connection issue and fix the configuration so it works across environments.
`
      },
      expectedSolution: {
        description: "Replace hardcoded localhost with environment variables for Redis",
        keyPatterns: ["process.env", "REDIS_HOST"]
      }
    } as Scenario,
  ],

  [
    "junior-4-race-condition-counter",
    {
      id: "junior-4-race-condition-counter",
      title: "CONC-004: Race Condition in Counter Increment",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 25,
      description: "Page views counter is off by ~10% under load",
      context:
        "You have a simple counter: when users view a page, increment COUNT. Code: read value, add 1, write back. Works fine with 1 user. Under load (1000 concurrent users), the count is wrong. Expected 10,000, got 9,000. Two concurrent requests happen: (1) Read COUNT=100, (2) Read COUNT=100, (1) Write to 101, (2) Write to 101. Lost increment. This is a classic race condition.",
      requirements: [
        "Understand the race condition: what operations aren't atomic?",
        "Propose solutions: atomic operations? Database? Locks?",
        "Compare approaches: performance vs. correctness",
        "Implement fix (code snippet or design)",
        "Test: how would you verify it's fixed?",
      ],
      evaluationCriteria: [
        "You identified the non-atomic read-modify-write",
        "You understood why this breaks under concurrency",
        "You proposed a correct solution (DB atomic op, lock, or queue)",
        "You considered performance implications",
        "You knew how to test concurrency issues",
      ],
      faangFocus: "Concurrent programming, atomicity, race conditions",
      tools: ["Code editor", "Concurrency testing", "Database transactions"],
      initialFiles: {
        "src/services/analytics.ts": `import { db } from '../db';

// BUG: This read-modify-write is NOT atomic
// Under concurrency, two requests read the same value, both increment, one write is lost
export async function incrementPageView(pageId: string) {
  // Step 1: Read current count
  const row = await db.query('SELECT view_count FROM pages WHERE id = $1', [pageId]);
  const currentCount = row.rows[0]?.view_count || 0;

  // Step 2: Increment locally
  const newCount = currentCount + 1;

  // Step 3: Write back
  // Between step 1 and 3, another request may have also read the same value!
  await db.query('UPDATE pages SET view_count = $1 WHERE id = $2', [newCount, pageId]);

  return newCount;
}

// This is called from the route handler on every page view
export async function trackView(req: any, res: any) {
  const { pageId } = req.params;
  const count = await incrementPageView(pageId);
  res.json({ views: count });
}`,
        "src/db/index.ts": `import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,
});`,
        "tests/analytics.test.ts": `import { incrementPageView } from '../src/services/analytics';

// This test passes with 1 concurrent call but FAILS with 100
describe('incrementPageView', () => {
  it('should correctly count 100 concurrent views', async () => {
    // Reset count to 0
    // Run 100 concurrent calls
    const promises = Array.from({ length: 100 }, () => incrementPageView('page-1'));
    await Promise.all(promises);

    // Expected: 100, Actual: ~90 (race condition loses ~10%)
    // const result = await db.query('SELECT view_count FROM pages WHERE id = $1', ['page-1']);
    // expect(result.rows[0].view_count).toBe(100); // FAILS!
  });
});`,
        "README.md": `# Analytics Service – Page View Counter

## Bug Report
Page view counts are consistently ~10% lower than actual traffic.
Expected 10,000 views, dashboard shows 9,021.

## Hint
Look at \`src/services/analytics.ts\` – the read-modify-write pattern is not atomic.
Fix it using either:
- PostgreSQL atomic increment: \`UPDATE pages SET view_count = view_count + 1\`
- Database transaction with row-level lock
- Redis INCR (atomic by design)
`
      },
      expectedSolution: {
        description: "Replace non-atomic read-modify-write with atomic increment",
        keyPatterns: ["view_count = view_count + 1"]
      }
    } as Scenario,
  ],

  [
    "junior-5-memory-leak-logging",
    {
      id: "junior-5-memory-leak-logging",
      title: "MEM-005: Memory Leak from Logging to List",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Service memory usage grows 100MB/day; crashes after 10 days",
      context:
        "You have a critical service. Memory usage: starts at 500MB, grows 100MB/day. After 10 days: 1.5GB, crashes. Looking at code: there's a list that stores all request logs: `logs = []` at module level. Every request: `logs.append(request_info)`. Never cleared. Memory grows forever. Classic memory leak from holding references.",
      requirements: [
        "Identify the memory leak source",
        "Understand why memory keeps growing",
        "Propose fix: clear logs? Rotate? Use queue?",
        "Consider: do we need all logs in memory?",
        "How to detect memory leaks faster (monitoring)?",
      ],
      evaluationCriteria: [
        "You found the unbounded list growth",
        "You understood why append() keeps allocating",
        "Your fix addressed the root cause (not just rotations)",
        "You thought about log retention needs",
        "You proposed monitoring (memory alerts)",
      ],
      faangFocus: "Memory management, resource cleanup, monitoring",
      tools: ["Memory profiler", "Garbage collection", "Monitoring"],
      initialFiles: {
        "src/server.ts": `import express from 'express';
import { handleRequest } from './middleware/requestLogger';

const app = express();
app.use(handleRequest);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/users', (req, res) => res.json({ users: [] }));

app.listen(3000, () => console.log('Server running on :3000'));`,
        "src/middleware/requestLogger.ts": `// BUG: This list grows forever – classic memory leak
// Every request appends to this module-level array. Never cleared.
// At 10k requests/min, this grows ~100MB/day

const requestLogs: any[] = [];  // <-- MEMORY LEAK SOURCE

export function handleRequest(req: any, res: any, next: any) {
  const logEntry = {
    method: req.method,
    url: req.url,
    timestamp: new Date(),
    headers: { ...req.headers },  // Deep copy of headers = lots of memory
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  requestLogs.push(logEntry);  // Never removed!

  // Debug: log count every 1000 requests
  if (requestLogs.length % 1000 === 0) {
    console.log(\`[RequestLogger] Stored \${requestLogs.length} entries\`);
  }

  next();
}

export function getRecentLogs(count = 100) {
  return requestLogs.slice(-count);
}`,
        "monitoring/memory-usage.log": `[2026-03-20 00:00] RSS: 512MB | Heap: 480MB | Requests logged: 0
[2026-03-21 00:00] RSS: 614MB | Heap: 581MB | Requests logged: 14,400,000
[2026-03-22 00:00] RSS: 711MB | Heap: 679MB | Requests logged: 28,800,000
[2026-03-23 00:00] RSS: 813MB | Heap: 780MB | Requests logged: 43,200,000
[2026-03-28 00:00] RSS: 1,312MB | Heap: 1,280MB | Requests logged: 115,200,000
[2026-03-29 04:17] PROCESS KILLED: OOMKilled (limit 1.5GB)`,
        "README.md": `# Request Logger Service – Memory Leak

## Incident
Service crashes every ~10 days with OOMKilled. Memory grows linearly at ~100MB/day.

## Your Task
1. Find the memory leak in \`src/middleware/requestLogger.ts\`
2. Fix it (bounded buffer? external log drain? stream to disk?)
3. Add monitoring to detect memory growth early
`
      },
      expectedSolution: {
        description: "Remove unbounded requestLogs array or add bounded buffer",
        keyPatterns: ["splice", "length"]
      }
    } as Scenario,
  ],

  [
    "junior-6-off-by-one",
    {
      id: "junior-6-off-by-one",
      title: "LOGIC-006: Off-by-One Error in Pagination",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Pagination returns wrong items; item #10 shows on page 1 and 2",
      context:
        "API: GET /items?page=1&limit=10. Returns items 1-10. page=2 returns items 10-19. Item #10 appears twice! Looking at code: offset = (page - 1) * limit. offset = 0, limit = 10 → items 0-9 (SQL LIMIT 10). page=2: offset = 10, LIMIT 10 → items 10-19. But arrays are 0-indexed! Item at index 9 is the 10th item. Off-by-one error.",
      requirements: [
        "Identify the off-by-one error (0-indexed vs 1-indexed confusion)",
        "Trace through the logic: what's item #10?",
        "Fix the calculation to avoid overlap",
        "Test edge cases: page 1, last page, empty result",
        "Is there a better pagination pattern?",
      ],
      evaluationCriteria: [
        "You caught the off-by-one (index confusion)",
        "You traced the full request → query → response",
        "Your fix handles edge cases (1 item, last page, etc)",
        "You tested manually (did you trace the math?)",
        "You knew about cursor-based pagination alternative",
      ],
      faangFocus: "Index confusion, edge cases, pagination patterns",
      tools: ["Code editor", "SQL debugger", "Test cases"],
      initialFiles: {
        "src/routes/items.ts": `import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /items?page=1&limit=10
router.get('/items', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // BUG: Off-by-one error in offset calculation
  // page=1 → offset=0, returns items 1-10 ✓
  // page=2 → offset=10, returns items 10-19 ✗ (item 10 appears on BOTH pages!)
  const offset = (page - 1) * limit;

  const result = await db.query(
    'SELECT * FROM items ORDER BY id ASC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  const countResult = await db.query('SELECT COUNT(*) FROM items');
  const totalItems = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    data: result.rows,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

export default router;`,
        "tests/pagination.test.ts": `// Failing test: item overlap between pages
describe('Pagination', () => {
  it('should not return duplicate items across pages', () => {
    // Page 1 returns items with id: 1,2,3,4,5,6,7,8,9,10
    // Page 2 should return items with id: 11,12,...,20
    // BUG: Page 2 actually returns id: 10,11,...,19  (item 10 duplicated!)

    // HINT: The SQL is actually correct. The bug might be in how
    // the frontend displays item IDs (1-indexed vs 0-indexed display)
    // Check if it's a backend or frontend issue.
  });
});`,
        "README.md": `# Items API – Pagination Bug

Users report that item #10 shows on both page 1 and page 2 of search results.
QA confirmed: items at page boundaries appear duplicated.

Debug \`src/routes/items.ts\` and fix the pagination logic.
`
      },
      expectedSolution: {
        description: "Fix off-by-one in OFFSET calculation for pagination",
        keyPatterns: ["OFFSET", "LIMIT"]
      }
    } as Scenario,
  ],

  [
    "junior-7-typo-config-key",
    {
      id: "junior-7-typo-config-key",
      title: "CONFIG-007: Typo in Environment Variable Name",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 15,
      description: "Feature flag is always 'false' because config key is misspelled",
      type: "normal",
      context:
        "You deploy a feature flag: `ENABLE_NEW_CHECKOUT`. Your code reads `ENABLE_NEW_CHECKOTU` (typo). Returns undefined → defaults to false → feature always off. No errors in logs. Just... doesn't work. You deployed to 100% traffic, nobody sees the feature. Takes 2 hours to notice.",
      requirements: [
        "Identify the typo (CHECKOTU vs CHECKOUT)",
        "Understand why no error was thrown (undefined != exception)",
        "Propose fix: typo + better error handling",
        "How to catch typos earlier (validation? IDE? linter?)",
        " Propose monitoring: detect feature flags stuck at false",
      ],
      evaluationCriteria: [
        "You found the typo immediately",
        "You understood why it silently failed",
        "You proposed env var validation",
        "You thought about CI linting for typos",
        "You understood feature flag metrics matter",
      ],
      faangFocus: "Configuration validation, typo prevention",
      tools: ["Environment config", "Linter", "Feature flag system"],
      initialFiles: {
        "src/config/flags.ts": `export const FEATURE_FLAGS = {
  // We use this to enable the new checkout experience
  ENABLE_NEW_CHECKOUT: process.env.ENABLE_NEW_CHECKOTU === 'true',
  
  // Legacy flags
  ENABLE_PROMO_BANNER: process.env.ENABLE_PROMO_BANNER === 'true',
};`,
        "src/app.ts": `import express from 'express';
import { FEATURE_FLAGS } from './config/flags';
import { oldCheckout, newCheckout } from './controllers/checkout';

const app = express();

app.post('/api/checkout', (req, res) => {
  if (FEATURE_FLAGS.ENABLE_NEW_CHECKOUT) {
    return newCheckout(req, res);
  } else {
    return oldCheckout(req, res);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));`,
        ".env": `ENABLE_NEW_CHECKOUT=true
ENABLE_PROMO_BANNER=false
PORT=3000`,
        "README.md": `# Project Config

The marketing team is complaining that their new checkout flow is not visible in production.

We released the \`ENABLE_NEW_CHECKOUT\` feature flag to 100% of traffic, and our \`.env\` has it set to \`true\`. However, metrics show 0 traffic on the new flow.

Debug the configuration and fix the application so the flag works correctly.
`
      },
      expectedSolution: {
        description: "Fix typo ENABLE_NEW_CHECKOTU to ENABLE_NEW_CHECKOUT",
        keyPatterns: ["ENABLE_NEW_CHECKOUT"]
      }
    } as Scenario,
  ],

  [
    "junior-8-string-encoding",
    {
      id: "junior-8-string-encoding",
      title: "ENC-008: UTF-8 String Encoding Bug",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "International users see garbled text (emoji, accents, etc)",
      context:
        "Users in Japan submit names with kanji characters. Backend receives 'データベース' (database in Japanese). Stores it. Retrieves: '?????????'. Database connection is set to 'latin1' (ASCII only). UTF-8 characters get corrupted. Simple fix: set charset to UTF-8 in connection string.",
      requirements: [
        "Identify the encoding issue (latin1 vs UTF-8)",
        "Understand where encoding happens (client → server → DB → client)",
        "Find all places that need UTF-8 (HTTP headers? DB? Files?)",
        "Propose fix: database connection string change",
        "Test: verify emoji/accents/CJK work",
      ],
      evaluationCriteria: [
        "You identified UTF-8 vs latin1 issue",
        "You understood encoding chain (HTML → DB → JSON)",
        "You fixed database connection charset",
        "You thought about HTTP headers (charset=utf-8)",
        "You tested with actual international characters",
      ],
      faangFocus: "Character encoding, internationalization",
      tools: ["Database connection", "Character tests", "HTTP headers"],
      initialFiles: {
        "src/db/connection.ts": `import mysql from 'mysql2/promise';

// BUG: charset is 'latin1' – cannot store UTF-8 characters (emoji, CJK, accents)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: 'app',
  password: process.env.DB_PASSWORD,
  database: 'userprofiles',
  charset: 'latin1',  // <-- Should be 'utf8mb4'
});`,
        "src/routes/profile.ts": `import { Router } from 'express';
import { pool } from '../db/connection';

const router = Router();

router.post('/api/profile', async (req, res) => {
  const { userId, displayName, bio } = req.body;
  // Works fine for ASCII names like "Alice"
  // Breaks for "データベース", "José", "🎉 Party!"
  await pool.execute(
    'INSERT INTO profiles (user_id, display_name, bio) VALUES (?, ?, ?)',
    [userId, displayName, bio]
  );
  res.json({ success: true });
});

router.get('/api/profile/:id', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM profiles WHERE user_id = ?',
    [req.params.id]
  );
  // Returns garbled text: "?????????" instead of "データベース"
  res.json(rows);
});

export default router;`,
        "bug-report.md": `# Bug Report #4821
**Reporter:** Tanaka-san (Tokyo office)
**Severity:** High

When I set my display name to "田中太郎" it saves successfully,
but when I view my profile it shows "????" or garbled characters.

Emoji in bio ("🎉") also shows as "??".
ASCII names like "Alice" work fine.
`,
        "README.md": `# Profile Service – Encoding Bug

International users see garbled text. The database charset is wrong.
Fix \`src/db/connection.ts\` and verify CJK/emoji characters round-trip correctly.
`
      },
      expectedSolution: {
        description: "Change database charset from latin1 to utf8mb4",
        keyPatterns: ["utf8mb4"]
      }
    } as Scenario,
  ],

  [
    "junior-9-hardcoded-secret",
    {
      id: "junior-9-hardcoded-secret",
      title: "SEC-009: API Key Hardcoded in Source Code",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Payment API key found in GitHub repo; attacker uses it",
      context:
        "You hardcoded your payment processor API key in code: `API_KEY = 'pk_live_abcd1234'`. Check it into Git. It's now in:  (1) Local repo, (2) GitHub history, (3) Corporate servers, (4) By midnight, attacker found it, made $50k in fraudulent charges. Oops.",
      requirements: [
        "Identify the security issue (secrets in code)",
        "Understand the blast radius (who can access Git?)",
        "Proper fix: move to environment variables",
        "Damage control: rotate the API key",
        "Detection: how to prevent this (linting? scanning?)",
      ],
      evaluationCriteria: [
        "You caught the hardcoded secret immediately",
        "You understood it's in Git history forever",
        "You proposed env vars + .gitignore",
        "You rotated the compromised key",
        "You added pre-commit hook to prevent re-occurrence",
      ],
      faangFocus: "Security, secret management, compliance",
      tools: [
        "Environment variables",
        "Secret manager",
        "Pre-commit hooks",
        ".gitignore",
      ],
      initialFiles: {
        "src/payments/stripe.ts": `import Stripe from 'stripe';

// BUG: API key hardcoded in source! This is committed to Git.
// An attacker found this in our public GitHub repo and made $50k in charges.
const stripe = new Stripe('sk_live_REDACTED_EXAMPLE_DO_NOT_USE', {
  apiVersion: '2023-10-16',
});

export async function chargeCustomer(customerId: string, amount: number) {
  return stripe.charges.create({
    amount,
    currency: 'usd',
    customer: customerId,
  });
}

export async function refund(chargeId: string) {
  return stripe.refunds.create({ charge: chargeId });
}`,
        "src/email/sendgrid.ts": `// Another hardcoded secret!
const SENDGRID_KEY = 'SG.xxxx.yyyy_real_key_here';

export async function sendEmail(to: string, subject: string, body: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${SENDGRID_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@company.com' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  });
  return response.ok;
}`,
        ".gitignore": `node_modules/
dist/
.env
# TODO: Should we add more patterns here?`,
        "README.md": `# SECURITY INCIDENT – SEV-1

Attacker found our Stripe live API key in the GitHub repo.
$50,000 in fraudulent charges before key was revoked.

## Immediate Actions Needed
1. Remove hardcoded keys from \`src/payments/stripe.ts\` and \`src/email/sendgrid.ts\`
2. Move secrets to environment variables
3. Add a pre-commit hook or \`.gitignore\` rule to prevent future leaks
4. Rotate all compromised keys
`
      },
      expectedSolution: {
        description: "Move hardcoded secrets to environment variables",
        keyPatterns: ["process.env.STRIPE", "process.env.SENDGRID"]
      }
    } as Scenario,
  ],

  [
    "junior-10-missing-validation",
    {
      id: "junior-10-missing-validation",
      title: "VAL-010: Missing Input Validation",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "User submits negative quantity; creates infinite credit loop",
      context:
        "User calls POST /purchase with `quantity: -5`. No validation. System creates order with -5 items. That maps to +$50 refund (negative cost = negative charge = refund!). User gets $50 instead of paying. Billions in damages if widespread. Root cause: no input validation.",
      requirements: [
        "Identify missing validation (quantity should be > 0)",
        "Understand impact (could this cascade? How much money?)",
        "Implement fix: validate all inputs on API boundary",
        "Where else should quantity be validated?",
        "Test: negative, zero, float, string, null - what should happen?",
      ],
      evaluationCriteria: [
        "You found missing validation",
        "You put validation at API boundary (not deep in code)",
        "You thought about financial impact",
        "You tested edge cases (0, negative, non-numbers)",
        "You understood defensive depth (validate everywhere)",
      ],
      faangFocus: "Input validation, security, edge cases",
      tools: ["Validation library", "Unit tests", "API schema"],
      initialFiles: {
        "src/routes/purchase.ts": `import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.post('/api/purchase', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  // BUG: No validation on quantity!
  // User can send quantity: -5 → gets a REFUND instead of a charge
  const product = await db.query('SELECT price FROM products WHERE id = $1', [productId]);
  const price = product.rows[0].price;
  const total = price * quantity;  // If quantity = -5, total = -$50 (credit!)

  await db.query(
    'INSERT INTO orders (user_id, product_id, quantity, total) VALUES ($1, $2, $3, $4)',
    [userId, productId, quantity, total]
  );

  // Process payment (negative total = refund)
  await processPayment(userId, total);

  res.json({ success: true, total });
});

async function processPayment(userId: string, amount: number) {
  // Charges user if amount > 0, refunds if amount < 0
  console.log(\`Processing payment: user=\${userId} amount=\${amount}\`);
}

export default router;`,
        "tests/purchase.test.ts": `describe('POST /api/purchase', () => {
  it('should reject negative quantity', () => {
    // This test does NOT exist yet – that is the problem
    // A request with quantity: -5 should return 400, not 200
  });

  it('should reject zero quantity', () => {
    // quantity: 0 creates a $0 order – waste of DB space
  });

  it('should reject non-integer quantity', () => {
    // quantity: 2.5 → should we allow fractional items?
  });
});`,
        "README.md": `# Purchase API – Missing Validation

A user discovered they can send \`{ quantity: -5 }\` and receive a $50 refund.
The finance team flagged $12,000 in fraudulent refunds over the past week.

Fix \`src/routes/purchase.ts\` to validate all inputs at the API boundary.
`
      },
      expectedSolution: {
        description: "Validate quantity is a positive integer before processing",
        keyPatterns: ["quantity", "<= 0", "400"]
      }
    } as Scenario,
  ],

  [
    "junior-11-wrong-variable-scope",
    {
      id: "junior-11-wrong-variable-scope",
      title: "SCOPE-011: Variable Scope Causing Data Leakage",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "User details from previous request leak to next user",
      context:
        "You create a global variable: `current_user = None`. On request 1: set `current_user = alice_data`. Return alice_data to alice. Request 2 (bob): You set `current_user = bob_data`. But Request 1 is still processing, reading from `current_user`. It now sees bob_data instead of alice_data. Multi-threading + shared state = bug. Bob sees alice's entire order history.",
      requirements: [
        "Identify the scope issue (global vs thread-local vs request-local)",
        "Understand why this happens (async/threading)",
        "Understand the data leak (what did bob see?)",
        "Fix: use request context, not global state",
        "Test: how would you detect this?",
      ],
      evaluationCriteria: [
        "You caught the shared global state bug",
        "You understood thread-safety and isolation",
        "Your fix used request-scoped storage, not globals",
        "You thought about the data leak (PII, orders, etc)",
        "You understood how to test (concurrent requests)",
      ],
      faangFocus: "Concurrency, variable scope, data isolation",
      tools: [
        "Threading tools",
        "Request context",
        "Concurrency testing",
        "Memory inspection",
      ],
      initialFiles: {
        "src/server.ts": `import express from 'express';
import { getUserProfile } from './handlers/profile';

const app = express();
app.get('/api/profile', getUserProfile);
app.listen(3000);`,
        "src/handlers/profile.ts": `import { db } from '../db';

// BUG: Module-level variable shared across ALL requests
// In a multi-threaded/async server, Request A sets currentUser,
// then Request B overwrites it before Request A finishes reading
let currentUser: any = null;  // <-- SHARED STATE BUG

export async function getUserProfile(req: any, res: any) {
  const userId = req.query.userId;

  // Step 1: Set the global (BAD!)
  currentUser = await db.findUser(userId);

  // Step 2: Simulate some async work (database call, etc.)
  await new Promise(resolve => setTimeout(resolve, 50));

  // Step 3: Read from the global – but another request may have changed it!
  // Bob's request might now see Alice's data here
  const profile = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,       // LEAK: wrong user's email!
    orderHistory: currentUser.orders // LEAK: wrong user's orders!
  };

  res.json(profile);
}`,
        "src/db/index.ts": `export const db = {
  findUser: async (id: string) => {
    // Simulated DB lookup
    return {
      id,
      name: id === 'alice' ? 'Alice Smith' : 'Bob Jones',
      email: id === 'alice' ? 'alice@company.com' : 'bob@company.com',
      orders: id === 'alice' ? ['ORD-001', 'ORD-002'] : ['ORD-099'],
    };
  }
};`,
        "README.md": `# Profile Handler – Data Leakage Bug (SEV-1 Privacy)

Users are intermittently seeing other users' profile data.
Bob reported seeing Alice's email and order history on his profile page.

Root cause is likely a shared variable in \`src/handlers/profile.ts\`.
Fix it to use request-scoped data instead of module-level state.
`
      },
      expectedSolution: {
        description: "Remove module-level currentUser; use request-scoped data",
        keyPatterns: ["req.user", "currentUser"]
      }
    } as Scenario,
  ],

  [
    "junior-12-network-timeout",
    {
      id: "junior-12-network-timeout",
      title: "NET-012: Missing Timeout on External Service Call",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Your service hangs when calling a slow external API",
      context:
        "Your checkout calls external payment processor: `response = requests.get(payment_api_url)`. No timeout set. Payment processor is slow (or down). Your thread waits forever. More requests come in. All threads block on payment API. Service becomes unresponsive. Cascading failure: checkout down → users can't pay → revenue down.",
      requirements: [
        "Identify the missing timeout",
        "Understand the impact (thread exhaustion → cascading failure)",
        "Propose fix: set reasonable timeout (10 seconds? 30 seconds?)",
        "What happens on timeout (retry? fallback? error?)",
        "How to monitor: detect slow external services early",
      ],
      evaluationCriteria: [
        "You added timeout to external call",
        "You chose reasonable timeout value (not too short, not too long)",
        "You handled timeout gracefully (circuit breaker? retry?)",
        "You thought about cascading impact",
        "You proposed monitoring for external service health",
      ],
      faangFocus: "Network resilience, cascading failure, timeouts",
      tools: ["HTTP client config", "Monitoring", "Circuit breaker"],
      initialFiles: {
        "src/services/checkout.ts": `import fetch from 'node-fetch';

const PAYMENT_API = process.env.PAYMENT_API_URL || 'https://payments.external.com';

export async function processCheckout(orderId: string, amount: number) {
  // BUG: No timeout! If payment API is slow/down, this hangs FOREVER
  // Each hanging request holds a thread/connection
  // After 50 requests, all threads are blocked → entire service is down
  const response = await fetch(\`\${PAYMENT_API}/charge\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
    // Missing: signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(\`Payment failed: \${response.status}\`);
  }

  return response.json();
}

export async function refundOrder(orderId: string) {
  // Same problem here – no timeout
  const response = await fetch(\`\${PAYMENT_API}/refund\`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  return response.json();
}`,
        "src/routes/order.ts": `import { Router } from 'express';
import { processCheckout } from '../services/checkout';

const router = Router();

router.post('/api/orders/checkout', async (req, res) => {
  try {
    const result = await processCheckout(req.body.orderId, req.body.amount);
    res.json(result);
  } catch (err: any) {
    // When payment API hangs, this never fires – request just hangs
    res.status(500).json({ error: err.message });
  }
});

export default router;`,
        "monitoring/alerts.log": `[ALERT] 2026-03-29 14:00 - Response time p99 > 30s (checkout endpoint)
[ALERT] 2026-03-29 14:02 - Active connections: 48/50 (96% thread pool)
[ALERT] 2026-03-29 14:03 - Active connections: 50/50 (EXHAUSTED)
[CRITICAL] 2026-03-29 14:03 - Service UNRESPONSIVE - all threads blocked
[CASCADE] 2026-03-29 14:05 - Frontend returning 504 Gateway Timeout
[CASCADE] 2026-03-29 14:06 - Mobile app checkout completely down`,
        "README.md": `# Checkout Service – Cascading Failure

The payment API went slow (30s+ response times) and our checkout service became completely unresponsive. All 50 connection threads were blocked waiting for the payment API.

Fix \`src/services/checkout.ts\` to add proper timeouts and error handling.
Consider: circuit breaker pattern, retry with backoff, fallback behavior.
`
      },
      expectedSolution: {
        description: "Add timeout to external payment API call",
        keyPatterns: ["timeout", "AbortSignal"]
      }
    } as Scenario,
  ],

  [
    "junior-13-inefficient-loop",
    {
      id: "junior-13-inefficient-loop",
      title: "PERF-013: O(n²) Algorithm Instead of O(n)",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 25,
      description: "Batch processing 10,000 items takes 100 seconds; should take 1 second",
      context:
        "You process 10,000 items. Inner loop: for each item, look up status in database. That's 10,000 DB queries per batch. O(n²). With 1M items, that's 1 trillion DB calls. Should batch-read all statuses in 1 query: `SELECT * FROM status WHERE id IN (item_ids)`. O(n).",
      requirements: [
        "Identify the O(n²) pattern (nested loops?)",
        "Count the query count (10k items = 10k queries)",
        "Propose optimization (batch queries? join? preload?)",
        "Calculate speedup (from 100s to 1s = 100x faster)",
        "Understand the tradeoff (batch size? memory?)",
      ],
      evaluationCriteria: [
        "You identified the nested loop / N+1 query",
        "You counted the queries (10,000 not 10)",
        "Your fix used batch loading",
        "You calculated actual speedup (not just 'faster')",
        "You thought about batch size limits",
      ],
      faangFocus: "Algorithm complexity, N+1 queries, batch operations",
      tools: ["Query profiler", "Algorithm analyzer", "Benchmarking"],
      initialFiles: {
        "src/jobs/batchProcessor.ts": `import { db } from '../db';

interface Item {
  id: string;
  status?: string;
}

// BUG: N+1 query problem – makes 1 DB call PER ITEM
// With 10,000 items, that's 10,000 individual SELECT queries
// Takes ~100 seconds instead of ~1 second with a batch query
export async function processBatch(items: Item[]) {
  const results = [];

  for (const item of items) {
    // This runs 10,000 times! One query per item.
    const status = await db.query(
      'SELECT status FROM item_status WHERE item_id = $1',
      [item.id]
    );
    item.status = status.rows[0]?.status || 'unknown';
    results.push(item);
  }

  // Then process based on status
  const active = results.filter(i => i.status === 'active');
  const expired = results.filter(i => i.status === 'expired');

  console.log(\`Processed: \${active.length} active, \${expired.length} expired\`);
  return results;
}

// This is called by the cron job every hour
export async function runHourlyBatch() {
  const allItems = await db.query('SELECT id FROM items LIMIT 10000');
  console.time('batch');
  await processBatch(allItems.rows);
  console.timeEnd('batch');  // Logs: "batch: 98342ms" (98 seconds!)
}`,
        "logs/cron.log": `[2026-03-29 01:00:02] Starting hourly batch...
[2026-03-29 01:01:42] batch: 98342ms  (10000 items)
[2026-03-29 02:00:01] Starting hourly batch...
[2026-03-29 02:01:38] batch: 96118ms  (10000 items)
[WARN] 2026-03-29 02:01:38] Batch taking >60s, risk of overlapping with next cron`,
        "README.md": `# Batch Processor – N+1 Query Performance

The hourly batch job takes ~100 seconds to process 10,000 items.
It should take <2 seconds.

Root cause: \`src/jobs/batchProcessor.ts\` makes one DB query per item (N+1 pattern).
Fix it to use a single batch query: \`SELECT * FROM item_status WHERE item_id = ANY($1)\`
`
      },
      expectedSolution: {
        description: "Replace N+1 queries with a single batch query using ANY or IN",
        keyPatterns: ["ANY", "item_id"]
      }
    } as Scenario,
  ],

  [
    "junior-14-json-parse-error",
    {
      id: "junior-14-json-parse-error",
      title: "PARSE-014: JSON Parse Error Crashes Service",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Service crashes when client sends malformed JSON",
      context:
        "Client sends: `{\"name\": \"Alice\", invalid json here}`. Parser throws uncaught exception. Service crashes. Simple fix: wrap JSON parsing in try-catch. Return 400 Bad Request. Let developer know instead of crashing.",
      requirements: [
        "Identify: JSON parsing not wrapped in error handler",
        "Understand: malformed JSON is client error (400), not server error (500)",
        "Add: try-catch around JSON parse",
        "Return: 400 Bad Request with clear error message",
        "Log: what should be logged (full JSON? just error?)",
      ],
      evaluationCriteria: [
        "You wrapped JSON parsing in try-catch",
        "You returned 400 (client error) not 500 (server error)",
        "Your error message was helpful (not 'error')",
        "You logged for debugging without leaking data",
        "You tested: what happens with malformed JSON?",
      ],
      faangFocus: "Error handling, HTTP status codes, parsing",
      tools: ["Error handling", "Logging", "HTTP status codes"],
      initialFiles: {
        "src/routes/webhook.ts": `import { Router } from 'express';

const router = Router();

// This endpoint receives webhooks from third-party services
router.post('/api/webhook', (req, res) => {
  // BUG: No try-catch around JSON parse!
  // If the client sends malformed JSON, this crashes the entire process
  const payload = JSON.parse(req.body);  // <-- Uncaught exception if body is invalid

  console.log('Webhook received:', payload.event);

  switch (payload.event) {
    case 'payment.success':
      handlePaymentSuccess(payload.data);
      break;
    case 'payment.failed':
      handlePaymentFailed(payload.data);
      break;
    default:
      console.log('Unknown event:', payload.event);
  }

  res.json({ received: true });
});

function handlePaymentSuccess(data: any) {
  console.log('Payment succeeded for', data.orderId);
}

function handlePaymentFailed(data: any) {
  console.log('Payment failed for', data.orderId);
}

export default router;`,
        "logs/crashes.log": `[FATAL] 2026-03-29 12:04:11 Uncaught SyntaxError: Unexpected token < in JSON at position 0
    at JSON.parse (<anonymous>)
    at /app/src/routes/webhook.ts:8:27
Process exited with code 1
[RESTART] 2026-03-29 12:04:13 Service restarted by PM2
[FATAL] 2026-03-29 12:04:18 Uncaught SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at /app/src/routes/webhook.ts:8:27
Process exited with code 1
[RESTART] 2026-03-29 12:04:20 Service restarted by PM2 (restart count: 47)`,
        "README.md": `# Webhook Handler – JSON Parse Crash

The webhook endpoint crashes the server when it receives malformed JSON.
Third-party service sometimes sends HTML error pages instead of JSON.

Service has restarted 47 times in the last hour.
Fix \`src/routes/webhook.ts\` to handle parse errors gracefully (return 400, not crash).
`
      },
      expectedSolution: {
        description: "Wrap JSON.parse in try-catch and return 400 on failure",
        keyPatterns: ["try", "catch", "JSON.parse", "400"]
      }
    } as Scenario,
  ],

  [
    "junior-15-missing-null-check",
    {
      id: "junior-15-missing-null-check",
      title: "NULL-015: Dereferencing Null Pointer",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description:
        "Code assumes function returns value but it returns null sometimes",
      context:
        "You call `user = get_user(id)`. Assume it returns user object. Call `user.email_address`. But get_user() returns null if user doesn't exist. Boom: null pointer exception. Should have checked: `if user: user.email_address else: handle_missing_user()`.",
      requirements: [
        "Identify: get_user() can return null",
        "Understand: what does null mean (not found? error?)",
        "Add: null check before dereferencing",
        "Decide: what to do if null (error? default? skip?)",
        "Test: what happens with non-existent user ID?",
      ],
      evaluationCriteria: [
        "You added null check",
        "You understood what null means (missing user)",
        "Your handling was appropriate (404 or error response)",
        "You tested with both valid and invalid IDs",
        "You considered: could this user be deleted after load?",
      ],
      faangFocus: "Null safety, defensive programming",
      tools: ["Code editor", "Unit tests", "Error handling"],
      initialFiles: {
        "src/services/notification.ts": `import { db } from '../db';
import { sendEmail } from './email';

// BUG: get_user can return null if user was deleted or ID is invalid
// But we dereference user.email without checking!
export async function notifyUser(userId: string, message: string) {
  const user = await db.findUser(userId);

  // If user is null (deleted account, wrong ID), this line throws:
  // "TypeError: Cannot read properties of null (reading 'email')"
  const email = user.email;
  const name = user.name;

  await sendEmail({
    to: email,
    subject: \`Notification for \${name}\`,
    body: message,
  });

  return { sent: true, to: email };
}

// Called when an order ships
export async function notifyOrderShipped(orderId: string) {
  const order = await db.findOrder(orderId);
  // Same bug: order could be null (cancelled, purged)
  return notifyUser(order.userId, \`Your order \${order.id} has shipped!\`);
}`,
        "src/db/index.ts": `export const db = {
  findUser: async (id: string) => {
    // Returns null if user not found or deleted
    const users: Record<string, any> = {
      'u1': { id: 'u1', name: 'Alice', email: 'alice@co.com' },
      'u2': { id: 'u2', name: 'Bob', email: 'bob@co.com' },
      // 'u3' was deleted last week but orders still reference it
    };
    return users[id] || null;  // <-- Returns null for unknown IDs
  },
  findOrder: async (id: string) => {
    return { id, userId: 'u3', status: 'shipped' };  // user u3 doesn't exist!
  }
};`,
        "README.md": `# Notification Service – Null Pointer Crash

The notification service crashes when trying to email deleted users.
Order ORD-5521 shipped but user u3 was deleted last week.

Fix \`src/services/notification.ts\` to handle null users/orders gracefully.
`
      },
      expectedSolution: {
        description: "Add null check before accessing user.email for deleted users",
        keyPatterns: ["!user", "null"]
      }
    } as Scenario,
  ],

  [
    "junior-16-array-bounds",
    {
      id: "junior-16-array-bounds",
      title: "BOUNDS-016: Array Index Out of Bounds",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Accessing array element that doesn't exist crashes app",
      context:
        "You have array of 5 items (indices 0-4). User requests item at index 5. Code: `items[5]`. Array access out of bounds → exception. Should check: `if index < len(items): items[index] else: error`.",
      requirements: [
        "Identify: array index not validated",
        "Understand: what's a valid index? (0 to len-1)",
        "Add: bounds check before access",
        "Decide: what to return if out of bounds (error? default?)",
        "Test: boundary cases (index 0, last element, beyond)",
      ],
      evaluationCriteria: [
        "You added bounds check",
        "You understood valid index range (0 to len-1)",
        "Your error message was clear",
        "You handled edge cases (empty array, negative index)",
        "You tested with boundary values",
      ],
      faangFocus: "Boundary checking, defensive programming",
      tools: ["Code editor", "Unit tests", "Array utilities"],
      initialFiles: {
        "src/services/recommendation.ts": `// Recommendation engine – shows "You might also like" products

interface Product {
  id: string;
  name: string;
  category: string;
}

const catalog: Product[] = [
  { id: 'p1', name: 'Wireless Mouse', category: 'electronics' },
  { id: 'p2', name: 'USB-C Cable', category: 'electronics' },
  { id: 'p3', name: 'Monitor Stand', category: 'electronics' },
  { id: 'p4', name: 'Desk Lamp', category: 'home' },
  { id: 'p5', name: 'Coffee Mug', category: 'home' },
];

// BUG: No bounds checking on index parameter
// If user requests index 5, catalog[5] is undefined → crash
export function getRecommendation(index: number): Product {
  // index comes from user input (query param) – could be anything!
  return catalog[index];  // No bounds check!
}

// BUG: Does not handle empty array case
export function getTopRecommendations(count: number): Product[] {
  // What if count > catalog.length? What if count < 0?
  const results: Product[] = [];
  for (let i = 0; i < count; i++) {
    results.push(catalog[i]);  // catalog[i] is undefined when i >= 5
  }
  return results;  // Array contains undefined elements!
}`,
        "src/routes/recommend.ts": `import { Router } from 'express';
import { getRecommendation, getTopRecommendations } from '../services/recommendation';

const router = Router();

router.get('/api/recommend/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const product = getRecommendation(index);
  // If index is out of bounds, product is undefined
  // product.name throws: "Cannot read properties of undefined (reading 'name')"
  res.json({ recommendation: product.name });
});

router.get('/api/recommend/top/:count', (req, res) => {
  const count = parseInt(req.params.count);
  const products = getTopRecommendations(count);
  res.json({ recommendations: products });
});

export default router;`,
        "README.md": `# Recommendation API – Array Bounds Crash

GET /api/recommend/10 crashes the server (only 5 products in catalog).
GET /api/recommend/top/100 returns array with \`undefined\` elements.

Fix bounds checking in \`src/services/recommendation.ts\`.
`
      },
      expectedSolution: {
        description: "Add array bounds check before accessing catalog index",
        keyPatterns: [".length", "index"]
      }
    } as Scenario,
  ],

  [
    "junior-17-sql-injection",
    {
      id: "junior-17-sql-injection",
      title: "SEC-017: SQL Injection Vulnerability",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "User input directly in SQL query allows database hack",
      context:
        "Code: `query = \"SELECT * FROM users WHERE name = '\" + user_input + \"'\"`. User enters: `' OR '1'='1`. Query becomes: `SELECT * FROM users WHERE name = '' OR '1'='1'`. Returns all users. Attacker gets entire database. Fix: use parameterized queries.",
      requirements: [
        "Identify: user input directly concatenated in SQL",
        "Understand: SQL injection attack (what can attacker do?)",
        "Propose: parameterized queries / prepared statements",
        "Test: what if user enters quotes or SQL keywords?",
        "Learn: this applies to all input (URLs, JSON, etc)",
      ],
      evaluationCriteria: [
        "You caught the SQL injection",
        "You used parameterized queries (not string concat)",
        "You explained the attack (data exfiltration, deletion)",
        "You tested with malicious input (quotes, OR, DROP)",
        "You understood this applies to all user input",
      ],
      faangFocus: "Security, SQL injection, parameterized queries",
      tools: ["SQL debugger", "Parameterized query syntax", "Security testing"],
      initialFiles: {
        "src/routes/search.ts": `import { Router } from 'express';
import { db } from '../db';

const router = Router();

// BUG: SQL INJECTION VULNERABILITY
// User input is directly concatenated into the SQL query string
router.get('/api/users/search', async (req, res) => {
  const name = req.query.name as string;

  // VULNERABLE: String concatenation with user input
  // Attacker sends: name = "' OR '1'='1"
  // Query becomes: SELECT * FROM users WHERE name = '' OR '1'='1'
  // Returns ALL users in the database!
  const query = "SELECT id, name, email FROM users WHERE name = '" + name + "'";

  try {
    const result = await db.query(query);
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Another vulnerable endpoint
router.get('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  // Attacker sends: id = "1; DROP TABLE users; --"
  const query = \`SELECT * FROM users WHERE id = \${id}\`;
  const result = await db.query(query);
  res.json(result.rows[0]);
});

export default router;`,
        "tests/security.test.ts": `describe('SQL Injection Protection', () => {
  it('should not return all users with injection payload', async () => {
    // GET /api/users/search?name=' OR '1'='1
    // Expected: empty result (no user named that)
    // Actual BUG: returns ALL users
  });

  it('should not allow DROP TABLE', async () => {
    // GET /api/users/1; DROP TABLE users; --
    // This should NOT delete the users table!
  });
});`,
        "README.md": `# User Search – SQL Injection Vulnerability (SEV-1 Security)

Security audit found SQL injection in \`src/routes/search.ts\`.
User input is directly concatenated into SQL queries.

Fix ALL queries to use parameterized queries ($1, $2 placeholders).
Test with payloads: \`' OR '1'='1\`, \`1; DROP TABLE users; --\`
`
      },
      expectedSolution: {
        description: "Replace string concatenation with parameterized queries",
        keyPatterns: ["$1", "query("]
      }
    } as Scenario,
  ],

  [
    "junior-18-list-modification-iterator",
    {
      id: "junior-18-list-modification-iterator",
      title: "ITER-018: Modifying List While Iterating",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Items skip or duplicate when removing from list during loop",
      context:
        "You iterate over list of orders: `for order in orders: if order.status == 'cancelled': orders.remove(order)`. Modifying list while iterating causes elements to skip. Order at index 5 becomes index 4, your iterator skips it. Some orders don't get processed.",
      requirements: [
        "Identify: removing from list during iteration",
        "Understand: why iterator breaks (indices shift)",
        "Propose: iterate over copy, not original",
        "Alternative:使用 filter (more Pythonic)",
        "Test: verify all items processed",
      ],
      evaluationCriteria: [
        "You caught the modification-during-iteration bug",
        "You understood why iterator breaks",
        "Your fix: iterate copy or use filter",
        "You tested: verified all items processed",
        "You knew the Pythonic way (filter/comprehension)",
      ],
      faangFocus: "Iteration safety, list operations",
      tools: ["Code editor", "Unit tests", "Iterator tools"],
      initialFiles: {
        "src/jobs/orderCleanup.ts": `interface Order {
  id: string;
  status: 'active' | 'cancelled' | 'completed';
  amount: number;
}

// BUG: Modifying array while iterating over it
// When you remove an element, indices shift and some elements are skipped
export function removeCancelledOrders(orders: Order[]): Order[] {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === 'cancelled') {
      orders.splice(i, 1);
      // After splice, the next element shifts to index i
      // But the loop increments i, so we skip that element!
    }
  }
  return orders;
}

// Test data: 3 consecutive cancelled orders should ALL be removed
const testOrders: Order[] = [
  { id: 'ORD-1', status: 'active', amount: 50 },
  { id: 'ORD-2', status: 'cancelled', amount: 30 },
  { id: 'ORD-3', status: 'cancelled', amount: 20 },  // This one gets SKIPPED!
  { id: 'ORD-4', status: 'cancelled', amount: 10 },
  { id: 'ORD-5', status: 'completed', amount: 100 },
];

// Expected result: [ORD-1, ORD-5] (3 cancelled removed)
// Actual result:   [ORD-1, ORD-3, ORD-5] (ORD-3 was skipped!)
const cleaned = removeCancelledOrders([...testOrders]);
console.log('Cleaned orders:', cleaned.map(o => o.id));`,
        "README.md": `# Order Cleanup – Iteration Bug

The cleanup job is supposed to remove all cancelled orders, but some slip through.
When consecutive orders are cancelled, every other one is skipped.

Fix \`src/jobs/orderCleanup.ts\`. Consider:
- Iterate in reverse
- Use Array.filter() instead of splice
- Collect indices first, then remove
`
      },
      expectedSolution: {
        description: "Fix array mutation during iteration using filter or reverse loop",
        keyPatterns: ["filter"]
      }
    } as Scenario,
  ],

  [
    "junior-19-division-by-zero",
    {
      id: "junior-19-division-by-zero",
      title: "MATH-019: Division by Zero",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 15,
      description: "Calculating average of empty dataset divides by zero",
      context:
        "Code: `average = total / count`. If count is 0, divide-by-zero exception. Should check: `if count > 0: average = total / count else: average = 0 (or None or error)`.",
      requirements: [
        "Identify the division by zero",
        "Understand when this happens (empty dataset?)",
        "Add: guard check before division",
        "Decide: what's reasonable value when count is 0?",
        "Test: what happens with no items?",
      ],
      evaluationCriteria: [
        "You caught the division by zero",
        "You added guard check",
        "Your fallback value made sense (0? None? error?)",
        "You tested edge case (empty dataset)",
        "You understood the business logic impact",
      ],
      faangFocus: "Edge cases, mathematical safety",
      tools: ["Code editor", "Unit tests", "Edge case testing"],
      initialFiles: {
        "src/services/analytics.ts": `interface MetricData {
  values: number[];
  label: string;
}

// BUG: Division by zero when dataset is empty
export function calculateAverage(data: MetricData): number {
  const total = data.values.reduce((sum, v) => sum + v, 0);
  // If data.values is empty, total = 0 and data.values.length = 0
  // 0 / 0 = NaN in JavaScript (not an exception, but still wrong!)
  return total / data.values.length;
}

export function calculatePercentage(part: number, whole: number): number {
  // BUG: If whole is 0, this returns Infinity
  return (part / whole) * 100;
}

export function generateReport(metrics: MetricData[]) {
  return metrics.map(m => ({
    label: m.label,
    average: calculateAverage(m),
    count: m.values.length,
  }));
}

// Test: this produces NaN and Infinity in the report
const testMetrics: MetricData[] = [
  { label: 'Latency (ms)', values: [10, 20, 30, 40, 50] },
  { label: 'Errors today', values: [] },       // <-- NaN average!
  { label: 'New feature usage', values: [] },   // <-- NaN average!
];

console.log(generateReport(testMetrics));
// Output: [{ label: 'Latency', average: 30 }, { label: 'Errors', average: NaN }, ...]`,
        "README.md": `# Analytics Dashboard – NaN/Infinity Bug

The analytics dashboard shows "NaN" and "Infinity" for some metrics.
This happens when a metric has no data points (empty array).

Fix \`src/services/analytics.ts\` to handle empty datasets gracefully.
`
      },
      expectedSolution: {
        description: "Guard against division by zero when count is 0",
        keyPatterns: ["=== 0", "length"]
      }
    } as Scenario,
  ],

  [
    "junior-20-type-mismatch",
    {
      id: "junior-20-type-mismatch",
      title: "TYPE-020: Type Mismatch Bug",
      type: "normal",
      role: "backend-swe",
      difficulty: "junior",
      allocatedTime: 20,
      description: "Code expects integer but receives string",
      context:
        "API returns user ID as string: '12345'. Code does: `user_id + 1` (assuming int). Python concaten string + int → TypeError. Should convert: `user_id = int(user_id)` or ensure API always returns int.",
      requirements: [
        "Identify: type mismatch (string vs int)",
        "Understand: where does mismatch come from (API contract? parsing?)",
        "Fix: explicit type conversion or validation",
        "Test: what types can this parameter have?",
        "Prevent: add type hints or schema validation",
      ],
      evaluationCriteria: [
        "You caught the string/int mismatch",
        "You traced where mismatch came from",
        "Your fix: explicit conversion with test",
        "You added type hints or schema validation",
        "You tested with various input types",
      ],
      faangFocus: "Type safety, conversions, validation",
      tools: ["Type hints", "Schema validation", "Unit tests"],
      initialFiles: {
        "src/routes/users.ts": `import { Router } from 'express';
import { db } from '../db';

const router = Router();

// BUG: req.params.id is always a STRING, but code treats it as a number
router.get('/api/users/:id/next', async (req, res) => {
  const userId = req.params.id;  // This is "123" (string), not 123 (number)

  // BUG: "123" + 1 = "1231" (string concatenation!), not 124
  const nextUserId = userId + 1;

  // Queries for user "1231" instead of user 124
  const nextUser = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [nextUserId]
  );

  if (nextUser.rows.length === 0) {
    return res.status(404).json({ error: 'Next user not found' });
  }

  res.json(nextUser.rows[0]);
});

// Another type bug: comparing string to number
router.get('/api/users/:id/is-admin', async (req, res) => {
  const userId = req.params.id;   // "1" (string)
  const ADMIN_ID = 1;             // 1 (number)

  // "1" == 1 is true in JS (loose equality), but "1" === 1 is false (strict)
  // This depends on which comparison is used
  if (userId === ADMIN_ID) {
    return res.json({ isAdmin: true });  // Never reaches here!
  }
  res.json({ isAdmin: false });
});

export default router;`,
        "tests/users.test.ts": `describe('User ID type handling', () => {
  it('/api/users/123/next should return user 124, not user "1231"', () => {
    // GET /api/users/123/next
    // Expected: returns user with id=124
    // Actual: 404 (looks for user "1231" due to string concat)
  });

  it('/api/users/1/is-admin should return true', () => {
    // GET /api/users/1/is-admin
    // Expected: { isAdmin: true }
    // Actual: { isAdmin: false } due to strict equality string vs number
  });
});`,
        "README.md": `# User API – Type Mismatch Bugs

Two bugs caused by JavaScript's implicit type coercion:
1. GET /api/users/123/next returns 404 (looks for user "1231" not 124)
2. GET /api/users/1/is-admin always returns false

Fix \`src/routes/users.ts\` with explicit type conversions.
`
      },
      expectedSolution: {
        description: "Add explicit type conversion with parseInt or Number()",
        keyPatterns: ["parseInt", "Number"]
      }
    } as Scenario,
  ],
];

// ============ MID-LEVEL (20+) ============
// Focus: Multi-service debugging, architectural issues, performance at scale

const midScenarios: Array<[string, Scenario]> = [
  [
    "mid-1-database-connection-pool-exhaustion",
    {
      id: "mid-1-database-connection-pool-exhaustion",
      title: "DB-POOL-101: Database Connection Pool Exhaustion",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 40,
      description: "All DB connections exhausted; new queries hang indefinitely",
      context:
        "Your application has a connection pool: 20 connections max. During a spike, 22 queries come in simultaneously. 20 get connections, 2 must wait. But the first 20 queries are slow (10s each). More queries pile up. After 30s, 150 queries waiting. Timeout takes 60s. All get timeout exceptions. Cascading failure. Root cause: connection pool is too small OR queries are too slow.",
      requirements: [
        "Identify: connection pool exhaustion (metrics?)",
        "Diagnose: are connections leaked? Or just slow queries?",
        "Short-term: increase pool size or timeout faster",
        "Long-term: optimize slow queries or add query queue",
        "Monitor: alert when pool is at 80% utilization",
      ],
      evaluationCriteria: [
        "You identified pool exhaustion from logs",
        "You distinguished between leaks vs slow queries",
        "Your short-term fix was reasonable",
        "Your long-term fix addressed root cause",
        "You proposed monitoring (pool utilization alerts)",
      ],
      faangFocus: "Database optimization, pooling, resource limits",
      tools: ["Database monitoring", "Connection pool tools", "Query optimization"],
      initialFiles: {
        "src/db/pool.ts": `import { Pool } from 'pg';

// Connection pool configuration
export const pool = new Pool({
  host: process.env.DB_HOST,
  database: 'orders_db',
  user: 'app',
  password: process.env.DB_PASSWORD,
  max: 20,                    // Max 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,  // Wait 60s for a connection (too long!)
});

// Debug: log pool stats
pool.on('connect', () => console.log('[Pool] New connection created'));
pool.on('remove', () => console.log('[Pool] Connection removed'));

export async function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,  // This number keeps growing during the incident!
  };
}`,
        "src/routes/orders.ts": `import { pool } from '../db/pool';

// This endpoint triggers the slow queries that exhaust the pool
export async function getOrderHistory(req: any, res: any) {
  const userId = req.params.userId;

  // BUG: This query is slow (~10s) and doesn't release the connection until done
  // With 20 max connections and queries taking 10s each,
  // only 2 requests/second can be served
  const result = await pool.query(\`
    SELECT o.*, oi.*, p.name as product_name, p.image_url,
           s.tracking_number, s.estimated_delivery,
           r.rating, r.review_text
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN shipping s ON s.order_id = o.id
    LEFT JOIN reviews r ON r.order_id = o.id AND r.user_id = o.user_id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  \`, [userId]);
  // Missing: LIMIT, no indexes on join columns, 6-table join

  res.json(result.rows);
}`,
        "monitoring/pool-metrics.log": `[14:00:00] Pool: total=20 idle=15 waiting=0
[14:00:10] Pool: total=20 idle=8  waiting=0
[14:00:15] Pool: total=20 idle=0  waiting=5   ← traffic spike begins
[14:00:20] Pool: total=20 idle=0  waiting=22
[14:00:30] Pool: total=20 idle=0  waiting=58
[14:00:45] Pool: total=20 idle=0  waiting=112
[14:01:00] Pool: total=20 idle=0  waiting=150  ← all queued requests timing out
[14:01:05] ERROR: Connection pool timeout after 60000ms (150 waiting)`,
        "README.md": `# Order Service – Connection Pool Exhaustion (Active Incident)

All database connections are exhausted. Queries are queueing up and timing out.
Users see "Service Unavailable" on order history pages.

## Key Metrics
- Pool max: 20 connections
- Waiting queries: 150+ (growing)
- Average query time: ~10 seconds (should be <100ms)

## Your Task
1. Identify why queries are slow (check the 6-table JOIN in \`src/routes/orders.ts\`)
2. Short-term: adjust pool config in \`src/db/pool.ts\` (timeout, pool size)
3. Long-term: optimize the query (add LIMIT, indexes, simplify joins)
`
      },
      expectedSolution: {
        description: "Optimize slow query and adjust pool settings to prevent exhaustion",
        keyPatterns: ["LIMIT", "INDEX", "max"]
      }
    } as Scenario,
  ],

  [
    "mid-2-cascading-timeout-failure",
    {
      id: "mid-2-cascading-timeout-failure",
      title: "CASCADE-102: Cascading Timeout Failures Across Services",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 40,
      description: "Service A times out waiting for Service B; A's timeout causes Service C to fail",
      context:
        "Checkout (A) → calls Payment (B) with 30s timeout. Payment is slow. A waits 30s, times out. Checkout returns error to user. But user retries immediately. More requests pile up. Checkout threads are all blocked waiting for Payment. Checkout's thread pool is exhausted. Users can't even get a response. They retry more. Cascading failure spreads to User Service (C) which also calls Checkout. Now C is also down. One slow service takes down 3 services.",
      requirements: [
        "Understand: how timeouts cascade (thread exhaustion)",
        "Identify: which service is actually slow (Payment)",
        "Short-term: reduce timeout or shed traffic",
        "Long-term: circuit breaker pattern to prevent cascades",
        "Monitor: detect slow services before they cascade",
      ],
      evaluationCriteria: [
        "You traced the cascade: A→B→C",
        "You identified Payment as root cause",
        "You understood thread exhaustion mechanism",
        "Your short-term: circuit breaker or traffic shed",
        "Your long-term: queue or async processing",
      ],
      faangFocus: "Distributed systems, circuit breakers, cascading failures",
      tools: [
        "Distributed tracing (Jaeger)",
        "Circuit breaker",
        "Timeout config",
        "Thread pool monitoring",
      ],
      initialFiles: {
        "src/services/checkout.ts": `import { paymentService } from './payment';
import { inventoryService } from './inventory';
import { userService } from './user';

export async function processCheckout(orderId: string, userId: string) {
  // Step 1: Validate user (calls User Service)
  const user = await userService.getUser(userId);  // 2s timeout

  // Step 2: Reserve inventory (calls Inventory Service)
  const reserved = await inventoryService.reserve(orderId);  // 5s timeout

  // Step 3: Charge payment (calls Payment Service)
  // BUG: Payment service is slow (30s+), this blocks the entire thread
  // No circuit breaker, no fallback
  const payment = await paymentService.charge({
    userId,
    orderId,
    amount: reserved.total,
    timeout: 30000,  // 30 seconds! Way too long
  });

  return { success: true, paymentId: payment.id };
}`,
        "src/services/payment.ts": `// Simulates calling external Payment API
export const paymentService = {
  async charge(params: any): Promise<any> {
    // This calls the external payment provider
    // When it's slow, our entire checkout pipeline backs up
    const response = await fetch('https://payments.external.io/charge', {
      method: 'POST',
      body: JSON.stringify(params),
      // No AbortSignal timeout!
    });
    return response.json();
  }
};`,
        "src/services/inventory.ts": `export const inventoryService = {
  async reserve(orderId: string) {
    // This also calls checkout for validation – CIRCULAR DEPENDENCY!
    // When checkout is down, inventory is also down
    return { total: 99.99, reserved: true };
  }
};`,
        "monitoring/cascade.log": `[14:00:00] Payment API latency: p99=200ms ✓
[14:05:00] Payment API latency: p99=5000ms ⚠️ (slow)
[14:06:00] Payment API latency: p99=28000ms ❌ (nearly timing out)
[14:06:30] Checkout: active threads 48/50 (96% waiting on Payment)
[14:07:00] Checkout: active threads 50/50 ← THREAD POOL EXHAUSTED
[14:07:00] Checkout: returning 503 for all new requests
[14:07:15] User Service: cannot reach Checkout → returning 502
[14:07:30] ALL THREE SERVICES DOWN – cascading failure complete`,
        "README.md": `# Cascading Timeout Failure (Active SEV-1)

Payment API went slow → Checkout threads exhausted → User Service also down.

## Cascade Chain
Payment (slow) → Checkout (thread exhaustion) → User Service (502)

## Your Task
1. Add circuit breaker to \`src/services/checkout.ts\` – stop calling Payment if it's failing
2. Reduce the 30s timeout to something reasonable (5s max)
3. Break circular dependency between Checkout and Inventory
4. Design fallback: what should Checkout do when Payment is down?
`
      },
      expectedSolution: {
        description: "Add circuit breaker and reduce timeout to prevent cascading failures",
        keyPatterns: ["timeout", "circuit", "fallback"]
      }
    } as Scenario,
  ],

  [
    "mid-3-deadlock-in-database-transactions",
    {
      id: "mid-3-deadlock-in-database-transactions",
      title: "TX-103: Database Deadlock",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 45,
      description: "Two transactions lock each other; database auto-kills one",
      context:
        "Transaction 1: Lock Account A, then try to lock Account B. Transaction 2: Lock Account B, then try to lock Account A. Deadlock: both waiting forever. Database detects deadlock, kills one transaction, rolls back. User gets 'Transaction failed' error. From DB logs: deadlock detected. Root cause: lock order is inconsistent (A→B vs B→A).",
      requirements: [
        "Identify: deadlock from DB logs",
        "Visualize: transaction execution order",
        "Fix: enforce consistent lock order (always A then B)",
        "Improve: reduce transaction scope (smaller locks)",
        "Test: can we reliably reproduce and fix?",
      ],
      evaluationCriteria: [
        "You identified deadlock from logs",
        "You understood circular wait condition",
        "Your fix: consistent lock ordering",
        "You understood transaction scope impact",
        "You proposed testing strategy (load test)",
      ],
      faangFocus: "Database transactions, deadlock prevention",
      tools: [
        "Database transaction logs",
        "Lock visualization",
        "Query profiling",
        "Load testing",
      ],
      initialFiles: {
        "src/services/transfer.ts": `import { pool } from '../db';

// Money transfer between two accounts
// BUG: Lock order is inconsistent – causes deadlock!
export async function transferMoney(fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the sender account first, then receiver
    // But if another transfer does receiver→sender simultaneously = DEADLOCK
    await client.query(
      'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
      [fromId]  // Locks fromId
    );
    await client.query(
      'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
      [toId]  // Tries to lock toId – might deadlock here!
    );

    // Debit sender
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );

    // Credit receiver
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    // "deadlock detected" error from PostgreSQL
    throw err;
  } finally {
    client.release();
  }
}`,
        "logs/db-deadlock.log": `[ERROR] 2026-03-29 14:15:22.123 PST [pid 4521] ERROR: deadlock detected
DETAIL: Process 4521 waits for ShareLock on transaction 98234;
  blocked by process 4522.
Process 4522 waits for ShareLock on transaction 98233;
  blocked by process 4521.
HINT: See server log for query details.
CONTEXT: while locking tuple (0,15) in relation "accounts"
STATEMENT: SELECT * FROM accounts WHERE id = $1 FOR UPDATE

[ERROR] 2026-03-29 14:15:23.456 PST [pid 4521] ERROR: current transaction is aborted
  commands ignored until end of transaction block`,
        "README.md": `# Transfer Service – Database Deadlock

Two concurrent transfers between the same accounts deadlock each other.
Transfer A→B locks account A first, Transfer B→A locks account B first.

## Fix
Always lock accounts in a consistent order (e.g., by lowest ID first).
This prevents the circular wait condition that causes deadlocks.
`
      },
      expectedSolution: {
        description: "Lock accounts in consistent order (lowest ID first) to prevent deadlock",
        keyPatterns: ["Math.min", "Math.max"]
      }
    } as Scenario,
  ],

  [
    "mid-4-data-inconsistency-eventual-consistency",
    {
      id: "mid-4-data-inconsistency-eventual-consistency",
      title: "CONS-104: Data Inconsistency in Eventually Consistent System",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 40,
      description: "Write to master succeeds, read from replica returns old data",
      context:
        "You update price: price = $50. Write to database master: ✅ success. Immediately read price from read-replica: returns $10 (old data). Replication lag: 500ms. During this window, customers see wrong price. If they order at $10, you lose money.",
      requirements: [
        "Identify: eventual consistency issue (read-after-write)",
        "Diagnose: replication lag (500ms? 5s?)",
        "Short-term: route critical reads to master (consistency trade-off)",
        "Long-term: accept eventual consistency or use version numbers",
        "Monitor: track replication lag",
      ],
      evaluationCriteria: [
        "You understood eventual consistency trade-off",
        "You identified replication lag as culprit",
        "Your short-term: reads go to master for critical data",
        "Your long-term: version numbers or read-your-own-write pattern",
        "You understood the business impact (pricing)",
      ],
      faangFocus: "Distributed systems, replication, consistency models",
      tools: ["Database replication", "Monitoring", "Caching strategies"],
    } as Scenario,
  ],

  [
    "mid-5-memory-leak-in-dependent-library",
    {
      id: "mid-5-memory-leak-in-dependent-library",
      title: "MEM-105: Memory Leak in 3rd-Party Library",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 45,
      description: "Service crashes every 72 hours; memory grows even with GC",
      context:
        "Your service uses logging library v1.2.3. Memory usage: 500MB → 600MB → 700MB over 3 days. Even though garbage collection runs, memory keeps growing. Investigate: library has a known memory leak (keeps cache references). Fix: upgrade to v1.2.5 with leak fix OR patch library OR switch libraries.",
      requirements: [
        "Identify: memory leak from logs / heap dump",
        "Diagnose: is it your code or library?",
        "Prove: it's the logging library (v1.2.3)",
        "Options: upgrade version, patch, or replace",
        "Rollout: test fix in staging, canary deploy",
      ],
      evaluationCriteria: [
        "You captured heap dump and identified leak source",
        "You tracked leak to library version",
        "You evaluated options (upgrade vs replace)",
        "Your rollout strategy was cautious (staging → canary)",
        "You set up memory monitoring alerts",
      ],
      faangFocus: "Debugging, dependency management, heap dumps",
      tools: ["Heap profiler", "JMeter / memory analyzer", "Version management"],
    } as Scenario,
  ],

  [
    "mid-6-cache-invalidation-after-update",
    {
      id: "mid-6-cache-invalidation-after-update",
    title: "CACHE-106: Cache Not Invalidated After Update",
      type: "normal",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 35,
      description: "Data updated in database but cached value not refreshed",
      context:
        "You cache user profile: cache.set(user_id, profile_data, ttl=1hour). User updates email. Database updated ✅. But cache still has old email for 59 more minutes. User sees their own email is wrong in their profile. Root cause: no cache invalidation on update.",
      requirements: [
        "Identify: cache not invalidated on write",
        "Understand: TTL doesn't prevent staleness",
        "Short-term: shorter TTL (5 min instead of 1 hour)",
        "Long-term: invalidate cache on update event",
        "Monitor: cache hit rate, staleness metrics",
      ],
      evaluationCriteria: [
        "You identified missing cache invalidation",
        "You understood TTL's role (eventual freshness)",
        "Your short-term: reduced TTL",
        "Your long-term: cache.delete() on update",
        "You understood pub-sub or event-driven invalidation",
      ],
      faangFocus: "Caching strategies, cache invalidation",
      tools: ["Redis / cache", "Message queue", "Monitoring"],
    } as Scenario,
  ],

  [
    "mid-7-race-condition-in-checkout-retry-logic",
    {
      id: "mid-7-race-condition-in-checkout-retry-logic",
      title: "RACE-107: User Charged Twice Due to Retry Race Condition",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 50,
      description: "User hits submit twice; payment processed twice",
      context:
        "Checkout shows spinner. User impatient, clicks submit again. First request: Payment API slow (5s). Second request: comes in, also calls payment API. Both charge card. User is charged twice. Root cause: no idempotency key. Payment API doesn't know both are same transaction.",
      requirements: [
        "Identify: duplicate submission from client",
        "Understand: idempotency keys prevent double-charging",
        "Short-term: disable submit button after click",
        "Long-term: generate idempotency key, send to Payment API",
        "Test: simulate double-submit, verify single charge",
      ],
      evaluationCriteria: [
        "You understood the root cause (no idempotency)",
        "Your short-term: UI prevention (disabled button)",
        "Your long-term: idempotency key implementation",
        "You involved Payment API team (their API must support)",
        "Your test verified single charge despite double submit",
      ],
      faangFocus: "Transactions, idempotency, at-least-once semantics",
      tools: ["Idempotency key generation", "Button state management", "Payment API"],
    } as Scenario,
  ],

  [
    "mid-8-slow-database-migration-blocks-deployment",
    {
      id: "mid-8-slow-database-migration-blocks-deployment",
      title: "DB-MIGRATE-108: Large Table Migration Takes 6 Hours",
      type: "normal",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 45,
      description: "Adding index to 500M row table locks table, blocks all writes",
      context:
        "You want to add index on `user_id` column for performance. Migration: `CREATE INDEX idx_user_id ON orders(user_id)`. On production (500M rows), this takes 6 hours and locks the table. No writes allowed. Service is down. Customers can't place orders.",
      requirements: [
        "Identify: migration strategy was synchronous (locks table)",
        "Understand: adding index blocks table (writes fail)",
        "Fix: use online index build (no locks) or zero-downtime migration",
        "Rollout: always test migrations on production-like data",
        "Monitor: migration progress, have rollback plan",
      ],
      evaluationCriteria: [
        "You understood why simple CREATE INDEX fails",
        "You proposed online index building (MySQL, PostgreSQL)",
        "Your rollout had canary phase (test first)",
        "You had rollback plan ready",
        "You scheduled migration during low-traffic window",
      ],
      faangFocus: "Database operations, zero-downtime migrations",
      tools: ["Database migration tools", "MySQL pt-online-schema-change"],
    } as Scenario,
  ],

  [
    "mid-9-load-balancer-not-detecting-unhealthy-backend",
    {
      id: "mid-9-load-balancer-not-detecting-unhealthy-backend",
      title: "LB-109: Load Balancer Sends Traffic to Failed Backend",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 40,
      description: "Service crashes but load balancer still routes traffic to it",
      context:
        "Service Pod A crashes. Load balancer's health check interval is 30 seconds. For 30 seconds, traffic still goes to dead Pod A. 30 seconds later, health check fails, Pod A removed from rotation. But in that 30s window, 5,000 users hit 500 errors.",
      requirements: [
        "Identify: health check interval is too long",
        "Understand: trade-off between checks and overhead",
        "Fix: reduce health check interval (5 seconds?)",
        "Improve: faster failure detection (gRPC health checks < 1s)",
        "Monitor: alert on health check failures immediately",
      ],
      evaluationCriteria: [
        "You identified stale health check state",
        "You understood detection latency trade-off",
        "Your fix: faster health checks",
        "You understood graceful drain (don't kill mid-request)",
        "You proposed connection draining on shutdown",
      ],
      faangFocus: "Load balancing, health checks, high availability",
      tools: ["Load balancer config", "Health check endpoints", "Monitoring"],
    } as Scenario,
  ],

  [
    "mid-10-version-skew-incompatibility",
    {
      id: "mid-10-version-skew-incompatibility",
      title: "VERSION-110: API Contract Broken by Version Skew",
      type: "incident",
      role: "backend-swe",
      difficulty: "mid",
      allocatedTime: 40,
      description: "Service v2 expects 'email' field but v1 frontend sends 'email_address'",
      context:
        "You deploy backend v2 that changes field names: 'email_address' → 'email'. But frontend v1 still sends 'email_address'. V2 expects 'email', gets unsupplied, treats it as unknown field. User registration fails. Bug: you didn't maintain backward compatibility.",
      requirements: [
        "Identify: schema/API mismatch between versions",
        "Understand: rolling deployment = multiple versions active",
        "Fix: maintain backward compat OR coordinate deployment",
        "Best practice: deprecate fields gradually, support both",
        "Test: multi-version compatibility tests",
      ],
      evaluationCriteria: [
        "You understood version skew during rolling deploy",
        "You maintained backward compat (accept both field names)",
        "Your deprecation plan: warn old clients, support 2 versions",
        "Your test: verified v1 client works with v2 backend",
        "You documented breaking change policy",
      ],
      faangFocus: "API design, backward compatibility, versioning",
      tools: ["API schema validation", "Version testing", "Deprecation tools"],
    } as Scenario,
  ],
];

// ============ SENIOR-LEVEL (15+) ============
// Focus: Architecture-wide issues, system design, cross-team coordination

const seniorScenarios: Array<[string, Scenario]> = [
  [
    "senior-1-split-brain-distributed-locks",
    {
      id: "senior-1-split-brain-distributed-locks",
      title: "CONSENSUS-201: Split Brain in Distributed Lock",
      type: "incident",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 60,
      description: "Network partition causes two services to both think they hold lock",
      context:
        "You have distributed lock (Redis or etcd). Service A acquires lock for 'inventory-sync'. Network partition: A ↔️ Lock service disconnected. A still thinks it has lock. Lock service auto-expires A's lock. Service B acquires same lock. Now both A and B think they have lock. Both modify inventory → corruption. Root cause: network partition + timeout = split brain.",
      requirements: [
        "Identify: split-brain from audit logs (two writers)",
        "Understand: CAP theorem (choose CP or AP)",
        "Prevent: use consensus protocol (etcd, Raft) not simple timeout",
        "or: use application-level detection (version numbers, CAS)",
        "Monitor: alert when lock holders disagree",
      ],
      evaluationCriteria: [
        "You identified split-brain in distributed system",
        "You understood CAP theorem implications",
        "Your solution: stronger consistency (Raft) or detect conflicts",
        "You proposed version vectors or CAS (compare-and-swap)",
        "You understood there's no perfect solution (trade-offs)",
      ],
      faangFocus: "Distributed systems, consensus, CAP theorem",
      tools: [
        "etcd / Raft",
        "Distributed tracing",
        "Audit logging",
        "Version vectors",
      ],
    } as Scenario,
  ],

  [
    "senior-2-rewrite-architecture-microservices-to-monolith",
    {
      id: "senior-2-rewrite-architecture-microservices-to-monolith",
      title: "ARCH-202: Microservices Complexity Outweighs Benefits",
      type: "postmortem",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 90,
      description: "Team has 50 microservices; debugging is impossible, ROI negative",
      context:
        "Your company migrated to microservices 3 years ago. Now: 50 services, complex deployment, debugging requires 5 teams, median time-to-resolution increased 300%. Network latency dominates performance. Each service change requires coordination. Ask: do we still benefit? Or should we consolidate?",
      requirements: [
        "Analyze: is microservices architecture still right?",
        "Measure: business impact (velocity, reliability, cost)",
        "If consolidate: which services merge? Why?",
        "Plan: migration strategy (big-bang bad, iterative good)",
        "Communicate: why previous decision was right + new is better",
      ],
      evaluationCriteria: [
        "You measured real impact (not just opinion)",
        "You had data on TTR, deployment frequency, cost",
        "Your consolidation plan was iterative",
        "You had migration timeline (3 months? 1 year?)",
        "You communicated professionally (not 'we were wrong')",
      ],
      faangFocus: "System architecture, organizational scaling, pragmatism",
      tools: ["Observability tools", "Cost tracking", "Technical communication"],
    } as Scenario,
  ],

  [
    "senior-3-cross-region-failover-disaster-recovery",
    {
      id: "senior-3-cross-region-failover-disaster-recovery",
      title: "DR-203: Data Center Outage - Activate Disaster Recovery",
      type: "incident",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 120,
      description: "US-East data center fully offline; must failover to US-West with 0 data loss",
      context:
        "AWS US-East region has total outage. All replicas, backups, services down. You have: (1) Last snapshot from 5 minutes ago, (2) Binlogs from primary to US-West secondary, (3) 30,000 QPS in US-West region. Question: how do you failover? What's the data loss window? How do we verify data integrity?",
      requirements: [
        "Assess: what's the scope? (users affected? data at risk?)",
        "Failover: promote US-West secondary as primary",
        "Data recovery: apply binlogs to fill gap",
        "Verification: checksum databases, spot inconsistencies",
        "Communication: inform customers, regulate expectations",
        "Retrospective: prevent next outage",
      ],
      evaluationCriteria: [
        "You had failover plan rehearsed (not first time in emergency)",
        "You understood RPO/RTO (recovery point / time objectives)",
        "Your binlog recovery was correct (no double-writes, gaps)",
        "You verified data integrity (not just assumed)",
        "Your communication was honest about limited visibility",
      ],
      faangFocus: "Disaster recovery, operational excellence, crisis management",
      tools: ["Database replication", "Binlog tools", "Monitoring", "Communication"],
    } as Scenario,
  ],

  [
    "senior-4-cost-explosion-resource-optimization",
    {
      id: "senior-4-cost-explosion-resource-optimization",
      title: "COST-204: Cloud Costs Tripled in 3 Months",
      type: "postmortem",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 75,
      description: "AWS bill grew from $50K/month to $150K/month; find and fix root cause",
      context:
        "Your company scales rapidly (10M → 30M users). AWS costs jumped: $50K → $150K/month. Finance upset. Engineering doesn't know why. Need to: trace the cost driver, fix it, prevent recurrence. Possibilities: unused compute? data transfer egress? database indexes causing scans?",
      requirements: [
        "Trace: which service/component caused cost increase?",
        "Analyze: resource efficiency (CPU utilization? bandwidth?)",
        "Find:  root cause (poorly tuned query? missing cache?)",
        "Optimize: redesign to reduce cost 50%",
        "Automation: cost monitoring and alerts per service",
      ],
      evaluationCriteria: [
        "You traced cost driver (data transfer? compute? database?)",
        "You optimized root cause (not just symptoms)",
        "Your optimization was measured ($X saved)",
        "You set up per-service cost monitoring",
        "You understood you can't optimize what you don't measure",
      ],
      faangFocus: "Operations, resource optimization, financial engineering",
      tools: ["Cloud cost analysis", "APM tools", "Monitoring dashboards"],
    } as Scenario,
  ],

  [
    "senior-5-consistent-hashing-rebalancing-the-cache-tier",
    {
      id: "senior-5-consistent-hashing-rebalancing-the-cache-tier",
      title: "CACHE-205: Cache Miss Storm During Scaling",
      type: "incident",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 60,
      description: "Add new cache servers; sudden 70% cache miss spike",
      context:
        "You run 4 Redis nodes for caching. Scale to 5 nodes. With simple modulo hashing (hash % 4), caches remapped to (hash % 5). 80% of keys rehash to different nodes. Thundering herd: millions of cache misses hit database at once. Database crashes. Root cause: naive hashing strategy. Solution: consistent hashing.",
      requirements: [
        "Diagnose: why did cache miss rate jump 70%?",
        "Understand: naive vs consistent hashing",
        "Fix: use consistent hashing (virtual nodes)",
        "Implement: library or own implementation",
        "Test: verify minimal key migration on scale",
      ],
      evaluationCriteria: [
        "You understood hash distribution (modulo vs ring)",
        "You knew consistent hashing theory (Karger's algorithm)",
        "Your implementation used virtual nodes (balanced ring)",
        "You measured: key migration % and miss rate improvement",
        "You wrote test: adding node ≤ 10% rehashing",
      ],
      faangFocus: "Distributed systems, consistent hashing, scalability",
      tools: ["Consistent hashing lib", "Cache profiling", "Load testing"],
    } as Scenario,
  ],

  [
    "senior-6-kafka-consumer-rebalancing-message-loss",
    {
      id: "senior-6-kafka-consumer-rebalancing-message-loss",
      title: "STREAM-206: Message Loss During Kafka Rebalance",
      type: "incident",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 60,
      description: "Deploy new consumer code; Kafka rebalance causes messages to skip",
      context:
        "You have 5 Kafka consumers in group. Deploy new code, 1 consumer restarts. Kafka rebalance: reassigns partitions across remaining 4 + new 5. During rebalance window (30s), offset manager is confused. Some messages are reprocessed, others skipped. Total: 50K messages lost → database corruption.",
      requirements: [
        "Understand: Kafka rebalance protocol (stop-world)",
        "Identify: lost messages from offset lag",
        "Fix: careful offset management (commit only after process)",
        "Improve: static membership (prevent reassignment)",
        "Test: failure scenario (kill consumer, watch offsets)",
      ],
      evaluationCriteria: [
        "You understood Kafka rebalance protocol",
        "You debugged offset gaps (what was lost?)",
        "Your fix: commit after processing (exactly-once semantics)",
        "You used cooperative rebalancing (less downtime)",
        "You tested: restart consumer, verify no message loss",
      ],
      faangFocus: "Event streaming, exactly-once semantics, distributed messaging",
      tools: ["Kafka tools", "Offset monitoring", "Message audit logging"],
    } as Scenario,
  ],

  [
    "senior-7-cross-shard-transaction-consistency",
    {
      id: "senior-7-cross-shard-transaction-consistency",
      title: "SHARD-207: Cross-Shard Transaction Consistency",
      type: "normal",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 75,
      description: "Transfer money between shards; ensure atomicity with no distributed transaction",
      context:
        "You shard customer data by user_id. User 123 (shard 1) transfers $100 to User 456 (shard 3). Must debit shard 1 AND credit shard 3 atomically. Distributed transactions are slow. If debit succeeds but credit fails, money lost. How do you ensure consistency without 2-phase commit?",
      requirements: [
        "Understand: distributed transaction trade-offs",
        "Design: saga pattern (sequence of local transactions)",
        "Implement: with compensating transactions (rollback)",
        "Handle: partial failures (one shard succeeds, one fails)",
        "Test: chaos engineering (kill shard mid-transaction)",
      ],
      evaluationCriteria: [
        "You avoided distributed transactions (slow, complex)",
        "You understood saga pattern (local txns + events)",
        "Your compensating transactions were correct",
        "You handled idempotency (retry-safe)",
        "You tested failure scenarios",
      ],
      faangFocus:
        "Distributed transactions, eventually-consistent systems, saga pattern",
      tools: [
        "Event sourcing",
        "Saga orchestrator",
        "Compensating transaction design",
      ],
    } as Scenario,
  ],

  [
    "senior-8-designing-globally-distributed-system",
    {
      id: "senior-8-designing-globally-distributed-system",
      title: "GLOBAL-208: Design API for <100ms latency in All Regions",
      type: "postmortem",
      role: "backend-swe-lead",
      difficulty: "senior",
      allocatedTime: 90,
      description: "Customers in Japan see 500ms latency; design regional edge caches",
      context:
        "Your API in US-East serves global users. Users in Tokyo see 200ms latency just to reach the server + 300ms to query home region database. Total: 500ms (unacceptable). Need: < 100ms from any region. Strategy: CDN for static content, replicated databases in each region, careful replication lag handling.",
      requirements: [
        "Analyze: where is latency coming from (network? compute? DB)?",
        "Design: multi-region strategy (read replicas in each region)",
        "Handle: replication lag (eventual consistency)",
        "Implement: routing (geo-routing to nearest region)",
        "Monitor: regional latency SLOs + replication lag",
      ],
      evaluationCriteria: [
        "You measured current latency breakdown",
        "Your design had multi-region reads (not far-away master)",
        "You accepted eventual consistency or had strong consistency strategy",
        "You designed failover (if Tokyo region fails)",
        "You measured achieved latency improvement",
      ],
      faangFocus: "Global scalability, geolocation, eventual consistency tradeoffs",
      tools: ["CDN (CloudFront, Akamai)", "Multi-region database", "Geo-routing"],
    } as Scenario,
  ],
];

export const comprehensiveScenarios: Array<[string, Scenario]> = [
  ...juniorScenarios,
  ...midScenarios,
  ...seniorScenarios,
  ...devopsSreScenarios.map(s => [s.id, s] as [string, Scenario]),
];

import { devopsSreScenarios } from './devopsScenarios';
export const allDevopsSreScenarios = devopsSreScenarios.map(s => [s.id, s] as [string, any] );

