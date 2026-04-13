/**
 * FAANG-Aligned Scenario Store
 * Based on Google SRE Book practices and real production workflows
 * 
 * Key Principles:
 * 1. SLI/SLO/SLA thinking - what metrics matter?
 * 2. Error budgets - innovation vs. reliability tradeoffs
 * 3. Incident command structure - clear roles, communication
 * 4. Blameless postmortems - systemic improvements, not blame
 * 5. Real tools - incident documents, monitoring, runbooks
 */

import { comprehensiveScenarios } from "./comprehensiveScenarios";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  type: "normal" | "incident" | "postmortem";
  role: string;
  difficulty: "junior" | "mid" | "senior";
  allocatedTime: number; // minutes
  context: string;
  requirements: string[];
  evaluationCriteria: string[];
  faangFocus?: string; // What FAANG principle does this test?
  tools?: string[]; // Tools/systems you'll use (incident doc, etc.)
  initialFiles?: Record<string, string>; // Starting file tree
  expectedSolution?: {
    description: string;
    keyPatterns: string[]; // Patterns that must appear in submitted code
  };
}

interface ScenarioStore {
  scenarios: Map<string, Scenario>;
}

let store: ScenarioStore | null = null;

export function getScenarioStore(): ScenarioStore {
  if (!store) {
    store = {
      scenarios: new Map<string, Scenario>([
        // ============ BACKEND SWE SCENARIOS ============
        // Focus: SLO/code quality/incident response coordination

        [
          "backend-swe-1",
          {
            id: "backend-swe-1",
            title: "SRE Collaboration: Database Migration Review",
            type: "normal",
            role: "backend-swe",
            difficulty: "mid",
            allocatedTime: 35,
            description:
              "Partner with SRE to review & improve a critical database migration before production rollout",
            context:
              "Your SRE partner Priya has prepared a UserService migration from Postgres 11→14, scheduled for next week during low-traffic hours (2-4 AM). She needs your technical review because you own the schema. The migration involves rewriting 2 columns and needs zero downtime for our SLA of 99.95% availability. Help her identify risks before attempting the migration.",
            requirements: [
              "Identify data transformation edge cases (NULLs, duplicates, type mismatches)",
              "Design a rollback procedure that can complete < 5 minutes",
              "Create validation queries that prove data consistency post-migration",
              "Propose monitoring alerts for the migration process",
              "Document the exact SLA impact if migration fails mid-way",
            ],
            evaluationCriteria: [
              "You caught at least 2 subtle data issues that could cause silent failures",
              "Your rollback plan includes explicit steps, not just 'revert'",
              "You understood the 99.95% SLA = 21.6 min/month downtime budget",
              "You thought about monitoring the migration in real-time",
              "You communicated in terms SREs care about (TTR, data loss risk, SLA impact)",
            ],
            faangFocus: "SLO-aware engineering, operational thinking",
            tools: ["Shared incident doc", "SQL queries", "Rollback playbook"],
          } as Scenario,
        ],

        [
          "backend-swe-2",
          {
            title: "Code Review: Feature with SLO Implications",
            type: "normal",
            role: "backend-swe",
            difficulty: "mid",
            allocatedTime: 25,
            description:
              "Review a peer's PR that changes how we compute user rankings - impacts search latency SLO",
            context:
              "Tom's PR optimizes the ranking algorithm by adding a caching layer. Current SLO: p99 search latency < 100ms. His change adds 15ms of cache lookup time per query. Tom says 'it's faster overall due to fewer DB calls' but you need to verify this against our error budget. We've used 40% of our monthly error budget already.",
            requirements: [
              "Measure the actual p99 latency impact using the percentile data provided",
              "Calculate remaining error budget and whether change fits",
              "Identify the worst-case cache miss scenario (when cache is cold)",
              "Propose a gradual rollout strategy with metrics gates",
              "Define rollback criteria (if p99 hits 110ms, auto-rollback)",
            ],
            evaluationCriteria: [
              "You understood error budgets aren't averages - focused on percentiles",
              "You checked whether 40% budget usage + this change = SLA breach",
              "You proposed metrics-driven rollout, not just 'ship it'",
              "You documented the auto-rollback threshold clearly",
              "You thought about cold cache scenario (cache expires daily)",
            ],
            faangFocus: "Error budgets, percentile thinking, measured releases",
            tools: ["Metrics dashboard", "Percentile analysis", "Gradual rollout policy"],
          } as Scenario,
        ],

        [
          "backend-swe-3",
          {
            id: "backend-swe-3",
            title: "INC-8847: Be the Ops Lead During Checkout Service Outage",
            type: "incident",
            role: "backend-swe",
            difficulty: "mid",
            allocatedTime: 35,
            description:
              "You're the Ops Lead (only person making production changes) during a critical incident. Coordinate with Incident Commander and follow the response playbook.",
            context:
              "It's 3 PM Friday. Checkout is down (0% success rate, users can't complete purchases). Sarah is Incident Commander, Marcus is Comms Lead. You're Ops Lead. Your role: execute fixes based on Sarah's diagnosis. Key constraint: production changes require your approval and you're the only one touching prod. Sarah has diagnosed: recent deployment added a bad config. Options are: (1) rollback (5 min, loses feature), (2) fix config live (15 min, keeps feature). You must decide quickly, communicate clearly, and execute safely.",
            requirements: [
              "Establish incident severity level (SEV-1: full outage affecting customers)",
              "Update the shared incident document with decisions and status",
              "Conduct or attend incident commander handoff (if shift change)",
              "Make ONE clear decision: rollback vs. fix-forward",
              "Execute the fix with safety checks (canary to 5% before 100%)",
              "Communicate ETA to Comms Lead for customer update",
            ],
            evaluationCriteria: [
              "You declared SEV-1 immediately (full outage = SEV-1)",
              "Your decision was data-driven (rollback faster? or fix safer?)",
              "You used canary deployment before full rollout (not risky)",
              "You communicated ETA to Comms Lead (PR impact assessment)",
              "You preserved evidence (didn't delete logs or metrics)",
              "You didn't freelance - you followed Incident Commander's guidance",
            ],
            faangFocus:
              "Incident command structure, role clarity, communication under pressure",
            tools: [
              "Incident doc (shared Google Doc)",
              "IRC/Slack",
              "Deployment dashboard",
              "Rollback runbook",
            ],
          } as Scenario,
        ],

        [
          "backend-swe-4",
          {
            id: "backend-swe-4",
            title: "POSTMORTEM: Checkout Outage Root Cause Analysis",
            type: "postmortem",
            role: "backend-swe",
            difficulty: "mid",
            allocatedTime: 40,
            description:
              "Write a blameless postmortem analyzing why the config was deployed without validation",
            context:
              "After the 35-minute checkout outage (INC-8847), it's time to understand the systemic failure. The incident was caused by a bad config pushed without validation. No individuals made 'bad decisions' - the system allowed a mistake through. Your job: identify the process gaps and propose preventive actions. Example: 'Config validation wasn't required' → 'Add automated config linting to pre-merge checks'. Focus on systems, not people.",
            requirements: [
              "Construct timeline of events with 30-min granularity",
              "Identify contributing factors (not just root cause)",
              "Distinguish root cause (no config validation) from triggers",
              "Write impact statement: revenue lost, customer complaints, SLA impact",
              "Propose 3+ action items (bug fixes, monitoring, training) with owners",
              "Avoid any blame language - focus on process improvements",
            ],
            evaluationCriteria: [
              "Timeline is accurate and includes decision points",
              "You separated 'why this happened' from 'why we didn't catch it sooner'",
              "Action items are specific and measurable (not vague)",
              "You proposed systemic fixes: add config validation, linting, etc.",
              "Zero blame language - every statement starts with 'the system'",
              "You identified monitoring gap (why alert didn't fire faster)",
            ],
            faangFocus: "Blameless postmortems, systemic thinking, continuous improvement",
            tools: ["Shared postmortem doc", "Timeline tool", "Metrics", "Logs"],
          } as Scenario,
        ],

        // ============ DEVOPS/SRE SCENARIOS ============
        // Focus: Monitoring, SLOs, incident command, capacity planning

        [
          "sre-1",
          {
            id: "sre-1",
            title: "Define SLOs for New Payment Processing Service",
            type: "normal",
            role: "sre",
            difficulty: "senior",
            allocatedTime: 45,
            description:
              "Work with PM and backend team to define measurable SLOs for a new service launch",
            context:
              "The Purchase team is launching a new payment processor next quarter. It will handle all transaction processing for 2B users. Currently they say 'it should be reliable' and 'fast'. That's not an SLO. Your job: translate product requirements into SLIs/SLOs, establish error budgets, and explain the tradeoff between 99% vs 99.9% availability.",
            requirements: [
              "Define 3-5 SLIs that matter (latency, error rate, throughput, durability)",
              "Pick target SLO values (e.g., 99% of transactions < 500ms, error rate < 0.1%)",
              "Explain what 99% vs 99.9% vs 99.99% availability means in hours/month",
              "Calculate the error budget for each SLO (monthly allowance)",
              "Explain how error budget constrains feature releases",
              "Propose monitoring + alerting strategy for these SLOs",
            ],
            evaluationCriteria: [
              "You chose SLIs that matter to users, not just ops (latency ≠ CPU%)",
              "SLOs are aggressive enough (99.9%+) but achievable",
              "You explained percentiles: 99% of txns fast, not average txn",
              "Error budget math is correct (error budget % = 100% - SLO %)",
              "You understood tighter SLO = less feature dev velocity",
              "You proposed concrete metrics to track SLOs",
            ],
            faangFocus: "SLI/SLO/SLA fundamentals, error budgets, measurement",
            tools: ["Metrics framework", "Availability calculator", "Monitoring system"],
          } as Scenario,
        ],

        [
          "sre-2",
          {
            id: "sre-2",
            title: "Create Runbook: Database Failover Procedure",
            type: "normal",
            role: "sre",
            difficulty: "mid",
            allocatedTime: 40,
            description:
              "Document step-by-step procedure for failing over database to replica in case of primary failure",
            context:
              "Your UserService database is replicated across 3 datacenters. If US-East primary fails, you need to promote US-West replica to primary in < 5 minutes to maintain SLA. Currently, failover is manual and sometimes takes 20+ minutes. Create a runbook that an on-call engineer can follow under pressure (3 AM, stressed, limited context).",
            requirements: [
              "Write clear step-by-step instructions (numbered, not prose)",
              "Include decision trees ('if X, then do Y')",
              "Add safety checks to prevent data loss (verify replica lag < 1 sec)",
              "Include rollback steps (how to recover if failover fails)",
              "Add metrics to validate failover succeeded (query count, latency)",
              "Include escalation path (who to call if steps fail)",
            ],
            evaluationCriteria: [
              "Steps are concrete and testable, not abstract",
              "You included prerequisite checks (is replica healthy?)",
              "Rollback procedure is explicit (not 'use your judgment')",
              "You tested the runbook mentally (would it work at 3 AM?)",
              "Safety checks prevent false failovers",
              "Metrics validation proves failover actually worked",
            ],
            faangFocus: "Runbooks as insurance, clarity under pressure, repeatability",
            tools: ["Runbook template", "Monitoring dashboard", "Deployment system"],
          } as Scenario,
        ],

        [
          "sre-3",
          {
            id: "sre-3",
            title: "INC-9201: Be Incident Commander for Cascading Failure",
            type: "incident",
            role: "sre",
            difficulty: "senior",
            allocatedTime: 45,
            description:
              "Lead a multi-team incident response when database overload cascades to frontend",
            context:
              "It's Saturday 2 PM. Your monitoring shows UserService DB CPU at 95%, and traffic is spreading to other services. Checkout team is freaking out. Your job as Incident Commander: structure the response, delegate to Ops (backend SWE), Comms (PM), and Planning (DevOps). Coordinate across teams. You're holding the high-level state. Decisions: shed load? scale up? We have 3M users currently loading the platform, 1M trying to checkout.",
            requirements: [
              "Declare incident severity (SEV-1) and assess impact",
              "Establish incident document and communication channel",
              "Delegate roles: Ops lead, Comms lead, Planning lead",
              "Make strategic decision: load shedding vs scaling",
              "Coordinate between teams (don't let them step on each other)",
              "Provide ETA to stakeholders using your reasoning",
              "Manage handoff if incident extends past your shift",
            ],
            evaluationCriteria: [
              "You led without micromanaging - trusted Ops lead to make decisions",
              "Your strategic choice (load shed vs scale) was sound",
              "You prevented 'freelancing' - everyone knew their role",
              "Communication was clear and frequent (not spam, not silent)",
              "You preserved evidence (didn't delete metrics during investigation)",
              "You had explicit handoff plan if this extends > 2 hours",
            ],
            faangFocus:
              "Incident command at scale, delegation, cross-team coordination",
            tools: [
              "Incident command center (IRC)",
              "Shared incident doc",
              "Metrics/alerting",
              "Status page",
            ],
          } as Scenario,
        ],

        [
          "sre-4",
          {
            id: "sre-4",
            title: "POSTMORTEM: Cascading Failure Root Cause Analysis",
            type: "postmortem",
            role: "sre",
            difficulty: "senior",
            allocatedTime: 50,
            description:
              "Lead postmortem analysis: why did monitoring not alert sooner? Why did load spreading cascade?",
            context:
              "The 2 PM cascading failure (INC-9201) lasted 45 minutes and impacted 60K checkout transactions. Root cause was a slow query that went from 10ms to 500ms (no code change - just data growth). The slow query wasn't monitored. It cascaded because this service talks to 5 others. Your postmortem should cover: Why didn't monitoring catch the slow query? How do we auto-detect performance regressions? How do we rate-limit upstreamcallers to prevent cascade?",
            requirements: [
              "Timeline with exact times and metric changes",
              "Identify the 'slow query' that started the cascade",
              "Explain why it wasn't caught (monitoring gap, not ops gap)",
              "Use 5-whys: 'Why did it cascade?' → 'No timeout' → 'Why no timeout?' etc",
              "Propose systemic fixes: auto-detect slow queries, circuit breakers, timeouts",
              "Calculate: this cost us 35 min revenue, ~$50K",
              "Assign action items with clear owners",
            ],
            evaluationCriteria: [
              "Timeline shows exact moment pressure increased and cascade started",
              "You identified the systemic gap: monitoring didn't watch query latency",
              "5-whys went deep (not stopping at 'human error')",
              "Action items are concrete: e.g., 'add p99 latency alert for queries > X'",
              "You proposed circuit breakers/timeouts (architectural fix, not just monitoring)",
              "No blame - the system allowed this, not a person",
            ],
            faangFocus: "Root cause analysis, systemic thinking, preventing cascade",
            tools: ["Metrics history", "Query logs", "Incident timeline", "Architecture diagram"],
          } as Scenario,
        ],

        // ============ FRONTEND SCENARIOS ============
        // Focus: Real user monitoring, percentile thinking, error budgets

        [
          "frontend-1",
          {
            id: "frontend-1",
            title: "Performance Audit: Real User Monitoring Data Analysis",
            type: "normal",
            role: "frontend",
            difficulty: "mid",
            allocatedTime: 40,
            description:
              "Analyze real user monitoring data to understand where page load time is spent",
            context:
              "Product wants to know: is our checkout page slow? Customer complaints mention 'page takes forever', but SRE says Google Analytics shows median load time is 1.2s (good). You have access to real user monitoring (RUM) data broken down by percentile. You need to understand if the complaints are legitimate and where time is actually spent.",
            requirements: [
              "Compare p50 vs p95 vs p99 load times (are tail users suffering?)",
              "Break down page load: HTML parsing, CSS, JavaScript, images",
              "Identify the biggest time sink (likely JavaScript)",
              "Propose a fix targeting the p95 user (not average)",
              "Show business impact: p95 users convert 20% less",
            ],
            evaluationCriteria: [
              "You understood percentiles matter more than averages (median ≠ typical complaint)",
              "You identified p95 users are 4x slower than p50",
              "You traced slow JavaScript (not network latency)",
              "You proposed a fix that targets the bottleneck",
              "You showed conversion impact (business consequence of slow pages)",
              "You understood browser caching effects (cold vs warm)",
            ],
            faangFocus: "Real user metrics, percentile thinking, user experience",
            tools: ["RUM dashboard", "Browser DevTools", "Performance profiler"],
          } as Scenario,
        ],

        [
          "frontend-2",
          {
            id: "frontend-2",
            title: "INC-7634: Debug White Blank Page for Checkout",
            type: "incident",
            role: "frontend",
            difficulty: "junior",
            allocatedTime: 20,
            description:
              "Users report checkout page is blank (white screen). Reproduce and debug.",
            context:
              "It's afternoon. Users are reporting that the checkout page loads but shows nothing - just a white screen. You can reproduce it. Server returns HTML (200), but page stays blank. Backend SWE confirms checkout API is responding normally. This is a frontend issue. You have 20 minutes to diagnose and propose a fix. Likely causes: JavaScript error, CSS hiding all content, JSON parsing error, infinite loop.",
            requirements: [
              "Open DevTools and check browser console for JavaScript errors",
              "Check Network tab - which API calls succeeded/failed?",
              "Check HTML source - is content in the DOM or missing?",
              "Identify the root cause (e.g., JSON parse error from API)",
              "Propose a fix (add error boundary, validate API response, fallback UI)",
              "Suggest monitoring to catch this sooner next time",
            ],
            evaluationCriteria: [
              "You checked console first (fastest diagnostic)",
              "You distinguished between 'network error' and 'parsing error'",
              "You found the exact line causing the issue",
              "Your fix is defensive (validates input, has fallback)",
              "You proposed monitoring (error rate, blank page rate)",
              "You thought about user impact messaging (show error, not blank)",
            ],
            faangFocus:
              "Debugging under pressure, client-side vs server-side, monitoring gaps",
            tools: ["Browser DevTools", "Network tab", "Console", "Source map"],
          } as Scenario,
        ],

        // ============ ML ENGINEER SCENARIOS ============
        // Focus: Model monitoring, data quality, SLOs for ML

        [
          "ml-1",
          {
            id: "ml-1",
            title: "Monitor Model Drift: Recommendation Engine Performance Drop",
            type: "normal",
            role: "ml-engineer",
            difficulty: "mid",
            allocatedTime: 30,
            description:
              "Your recommendation engine is showing lower click-through rates. Diagnose if it's model drift or data shift.",
            context:
              "Recommendations CTR dropped 8% last week (from 12% to 11%). Was it model decay, user behavior change, or data shift? You need to investigate: compare model predictions on current data vs test set data. If it's data shift (e.g., more new users), that's OK. If it's model drift (model performance on same distribution), we need to retrain. You have a 1h window before product asks for a hotfix.",
            requirements: [
              "Compare prediction quality on test set vs current production data",
              "Calculate data drift metrics (feature distributions changed?)",
              "Separate model drift from data drift",
              "Propose retraining vs rollback decision",
              "Identify the root cause (e.g., 'new user cohort has different preferences')",
            ],
            evaluationCriteria: [
              "You understood the difference between data drift and model drift",
              "You checked both model metrics and data distributions",
              "You proposed concrete action (retrain or rollback) with justification",
              "You set up monitoring for future detection",
              "You communicated uncertainty (if unclear, say so)",
            ],
            faangFocus: "ML monitoring, distinguishing drift types, data-driven decisions",
            tools: ["Model metrics dashboard", "Data distribution analyzer", "Retraining pipeline"],
          } as Scenario,
        ],

        [
          "ml-2",
          {
            id: "ml-2",
            title: "INC-6543: Model Accuracy Crashed, Recommendations Are Wrong",
            type: "incident",
            role: "ml-engineer",
            difficulty: "senior",
            allocatedTime: 45,
            description:
              "Emergency: model accuracy dropped 25% in production. Users are getting bad recommendations. Rollback or fix?",
            context:
              "At 10 AM, your ML monitoring shows model accuracy at 68% (was 93% yesterday). The model was retrained last night with new data. You deployed with standard testing, but something went wrong in production with real users. You have limited context. Options: (1) quick rollback to yesterday's model (5 min), (2) debug the new data to find the issue (30+ min, doesn't stop the bleed), (3) hybrid approach. What do you do? Users are already seeing bad recommendations.",
            requirements: [
              "Immediately roll back to previous model version",
              "Document: what changed between v1 (good) and v2 (bad)?",
              "Check training data quality (missing values, corruption?)",
              "Check for data leakage in features",
              "Analyze why testing didn't catch this",
              "Propose safeguards for next release (A/B test, gradual rollout)",
            ],
            evaluationCriteria: [
              "You prioritized the quick rollback (users matter more than investigation)",
              "You preserved evidence while investigating (didn't delete logs)",
              "You identified the training data issue",
              "You proposed gradual rollout + A/B test for next attempt",
              "You set up monitoring to detect accuracy drops automatically",
              "You didn't blame the data scientist - focused on process gaps",
            ],
            faangFocus:
              "Production incidents, fast rollback vs debugging, testing gaps, monitoring",
            tools: [
              "Model registry",
              "Accuracy metrics",
              "Training data validation",
              "A/B testing framework",
            ],
          } as Scenario,
        ],

        // ============ PM SCENARIOS ============
        // Focus: Feature rollouts, error budgets, incident impact

        [
          "pm-1",
          {
            id: "pm-1",
            title: "Plan Feature Launch: Gradual Rollout with SLO Gates",
            type: "normal",
            role: "pm",
            difficulty: "mid",
            allocatedTime: 40,
            description:
              "Design a launch strategy for a new checkout flow. We've used 60% of our monthly error budget.",
            context:
              "Your team built a new checkout UX with 1-click purchase. It passed testing beautifully. But you've already used 60% of the monthly SLO budget (error budget = 1 day of downtime). Launching a feature always has risk. Design a gradual rollout strategy: 1%→10%→50%→100%. At each stage, you'll measure. If metrics go bad, you halt or rollback. Define: what metrics do you watch? What's the halt condition?",
            requirements: [
              "Define success metrics for the new checkout (conversion rate, error rate, latency)",
              "Set clear halt conditions (e.g., 'if error rate > 1%, halt')",
              "Plan rollout stages with percentages and timelines",
              "Calculate: if we launch and break, what's the SLA impact?",
              "Coordinate with SRE about monitoring and auto-rollback",
              "Plan communication to leadership (risk/reward)",
            ],
            evaluationCriteria: [
              "You understood error budget constraints (60% used = limited room)",
              "Halt conditions are specific, not vague",
              "You planned gradual rollout (not big bang)",
              "You coordinated monitoring and auto-rollback with SRE",
              "You calculated SLA impact if launch goes bad",
              "You communicated risk honestly to leadership",
            ],
            faangFocus: "Error budgets, risk-aware launches, metrics-driven decisions",
            tools: ["Feature flag platform", "Metrics dashboard", "Monitoring", "Launch checklist"],
          } as Scenario,
        ],

        [
          "pm-2",
          {
            id: "pm-2",
            title:
              "INC-5555: New Feature Caused Checkout Errors. Rollback or Fix?",
            type: "incident",
            role: "pm",
            difficulty: "mid",
            allocatedTime: 25,
            description:
              "Your feature launched 2 hours ago. Error rate jumped from 0.5% to 3%. Rollback decision needed.",
            context:
              "The new 1-click feature went live this morning. Looked good for the first hour. Then error rate spiked: 3% of checkouts now error (vs 0.5% baseline). Root cause: new feature introduced a race condition on first purchase. SRE is saying: 'We can rollback in 2 min, or debug in 30 min.' The feature is working for 97% of users. Rollback means killing the 3 hours of revenue we gained. What do you recommend?",
            requirements: [
              "Calculate: revenue impact of staying live vs rolling back",
              "Assess: is the root cause fixable quickly (< 10 min)?",
              "Understand: rolling back takes 2 min, we lose feature but save brand trust",
              "Recommend: rollback or stay live?",
              "Plan: what happens next (debug, relaunch)?",
              "Communicate decision to leadership and team",
            ],
            evaluationCriteria: [
              "You measured the revenue impact both ways (not just gut feeling)",
              "You consulted SRE on fix time before deciding",
              "You weighted customer trust against short-term revenue",
              "You made a principled decision (not panic, not stubborn)",
              "You had a concrete next-step plan",
              "You communicated clearly to leadership",
            ],
            faangFocus: "Incident decision-making, error budgets, customer trust",
            tools: ["Metrics dashboard", "Revenue calculator", "Incident doc"],
          } as Scenario,
        ],
      ]),
    };
    // Merge comprehensive scenarios into the store
    for (const [key, scenario] of comprehensiveScenarios) {
      if (!store.scenarios.has(key)) {
        store.scenarios.set(key, scenario);
      }
    }
  }
  return store;
}

export function getScenariosByRole(role: string): Scenario[] {
  const store = getScenarioStore();
  return Array.from(store.scenarios.values()).filter((s) => s.role === role);
}

export function getScenarioById(id: string): Scenario | undefined {
  const store = getScenarioStore();
  return store.scenarios.get(id);
}

export function getAllScenarios(): Scenario[] {
  const store = getScenarioStore();
  return Array.from(store.scenarios.values());
}
