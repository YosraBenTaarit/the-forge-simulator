/**
 * Real FAANG Incident Scenarios
 * Based on actual postmortems from: Cloudflare, Google, Facebook, GitHub, Amazon, Discord
 * Source: danluu/post-mortems + Google SRE Book
 * 
 * These are real incidents with learnings applied to training scenarios
 */

import { Scenario } from "./scenarioStore";

export const realFAANGScenarios: Array<[string, Scenario]> = [
  // ============ CLOUDFLARE-INSPIRED SCENARIOS ============
  [
    "cloudflare-bgp-config",
    {
      id: "cloudflare-bgp-config",
      title: "INC-CLOUD-001: BGP Prefix Misconfiguration",
      description:
        "Reproduce the Cloudflare June 2022 incident: a config change disabled advertisements for critical BGP prefixes across 19 datacenters",
      type: "incident",
      role: "sre",
      difficulty: "senior",
      allocatedTime: 50,
      context:
        "It's 14:30 UTC. Network monitoring shows latency spikes across Asia-Pacific. Traffic dropped 15%. Your team disabled BGP advertisement for a set of prefixes 4 hours ago as part of 'infrastructure cleanup'. Cleanup meant ordering disabled prefixes in reverse order, but the sorting logic is wrong and disabled the wrong set. Now you're responding to customer complaints. The fix will require proper validation of BGP configs before deployment. Root cause: automated config change wasn't validated against network topology.",
      requirements: [
        "Identify the misconfigured BGP prefixes vs. what SHOULD be advertised",
        "Calculate blast radius: which regions/services are affected",
        "Propose immediate mitigation (re-enable correct prefixes)",
        "Write a runbook for 'BGP Config Deployment Validation'",
        "Design monitoring that would have caught this pre-deployment",
        "Estimate MTTR and customer impact (revenue, SLA)",
      ],
      evaluationCriteria: [
        "You understood BGP cascade: wrong prefix → packet loss → cascading timeouts",
        "You identified the config sorting bug",
        "Your validation runbook prevents this class of error",
        "You proposed automated pre-deployment topology checks",
        "You calculated impact in SLA terms, not just percentages",
        "You thought about rollback speed (critical for network configs)",
      ],
      faangFocus: "Network ops, config validation, cascading failure prevention",
      tools: ["BGP analyzer", "Config validator", "Network topology map", "Rollback procedure"],
    } as Scenario,
  ],

  [
    "facebook-backbone-config",
    {
      id: "facebook-backbone-config",
      title: "INC-FB-001: Global Backbone Router Configuration Error",
      description:
        "Recreate the Facebook October 2021 incident: a config change to backbone routers took down Facebook, Instagram, and WhatsApp globally",
      type: "incident",
      role: "sre",
      difficulty: "senior",
      allocatedTime: 55,
      context:
        'It\'s 11:39 UTC. Facebook, Instagram, and WhatsApp all go down globally. 3.5 billion users affected. Your monitoring shows: DNS lookups work. BGP routes are good. But traffic can\'t reach Origin servers. The backbone router cluster in US-EAST underwent config deployment 2 hours ago to "optimize traffic routing". Something in that config is causing all ingress to fail. You have 30 minutes before SLA breach. Traffic is queuing at global edge locations, about to overflow.',
      requirements: [
        "Identify the config parameter that broke ingress routing",
        "Understand the routing path: Edge → Backbone → Origin",
        "Propose rollback procedure with validation gates",
        "Calculate actual outage duration and recovery complexity",
        "Design a 'config deployment simulation environment' to test changes",
        "Plan a blameless postmortem: identify systemic failures, not individual errors",
      ],
      evaluationCriteria: [
        "You caught that this affects ALL services (not just one)",
        "You understood the cascading timeout behavior (clients + monitoring)",
        "Your rollback included 'verify DNS still works' checkpoint",
        "You proposed traffic shifting to alternate backbone for faster recovery",
        "You identified lack of 'dry-run' environment as root cause",
        "You understood impact in '% of global users affected' not just metrics",
      ],
      faangFocus: "Global infrastructure, cascading failure, config safety",
      tools: [
        "Global traffic map",
        "Backbone config audit",
        "Rollback controller",
        "Postmortem template",
      ],
    } as Scenario,
  ],

  // ============ GITHUB-INSPIRED SCENARIOS ============
  [
    "github-network-partition",
    {
      id: "github-network-partition",
      title: "INC-GH-001: Data Loss Risk During Database Failover",
      description:
        "Recreate the GitHub January 2016 incident: a network partition during maintenance caused MySQL master failover, but read replicas were out of sync",
      type: "incident",
      role: "sre",
      difficulty: "senior",
      allocatedTime: 50,
      context:
        'It\'s 12:30 UTC during a planned maintenance window. Network monitoring shows a 43-second partition between US-WEST and US-EAST datacenters. MySQL detects primary is unreachable and promotes read-replica to primary. BUT: due to cross-continent latency (70ms), the replica is 7 seconds behind primary (7 seconds of unconfirmed writes). If the partition lasts > 7 seconds, you\'ll have data loss (write divergence). You have 43 seconds to decide: rejoin partition (risk corruption) or accept 7 seconds of data loss. There\'s no good option.',
      requirements: [
        "Understand replication lag and write durability",
        "Calculate data loss: how many commits/updates could be lost?",
        "Design a recovery procedure that maintains data integrity",
        "Document the replication lag monitoring thresholds",
        "Propose architectural changes to prevent this (semi-synchronous replication)",
        "Create a decision tree for 'partition vs. potential data loss'",
      ],
      evaluationCriteria: [
        "You understood replication lag isn't visible in replication status",
        "You identified the cross-continent latency as root cause",
        "Your recovery skipped the 'rejoin and hope' approach",
        "You proposed semi-sync replication as permanent fix",
        "You calculated exact data loss in transactions",
        "You didn't blame the engineer (systemic issue, not human error)",
      ],
      faangFocus: "Database reliability, data loss prevention, replication lag",
      tools: ["Replication status", "Binary log analysis", "Recovery runbook", "Semi-sync setup"],
    } as Scenario,
  ],

  // ============ AMAZON S3-INSPIRED SCENARIOS ============
  [
    "amazon-s3-typo",
    {
      id: "amazon-s3-typo",
      title: "INC-AWS-001: Accidental Mass Server Termination",
      description:
        "Recreate the Amazon S3 February 2017 incident: a typo in a command removed 2x more servers than intended",
      type: "incident",
      role: "sre",
      difficulty: "mid",
      allocatedTime: 45,
      context:
        "It's 9:37 AM PST. You're debugging a minor fleet issue in S3 infrastructure. The standard playbook says: 'run retire-server.sh PROD-S3-SHARD-*'. You intend to retire a small set of servers. Instead, you type: 'retire-server.sh PROD-S3-*' and hit enter. The tool has lax input validation and removes 30 servers instead of 5. These 30 servers support critical S3 systems. Within seconds: EBS goes down. EC2 can't access storage. Everything dependent on S3 fails (AWS's own services included). Cascading failure across all of US-EAST-1.",
      requirements: [
        "Stop the automation: how do you halt a deletion script mid-way?",
        "Identify which 30 servers got deleted",
        "Understand dependencies: what services depend on those servers?",
        "Propose recovery: restore VMs from snapshots? How long?",
        "Calculate impact: how long was AWS itself down?",
        "Design tooling change: require explicit server list in commands, not wildcards",
      ],
      evaluationCriteria: [
        "You realized the deletion can't be undone instantly",
        "You identified the cascading dependency: S3 → EC2/EBS → dependent services",
        "You understood AWS's own services were affected (meta-incident)",
        "Your mitigation included 'snapshot rollback' if available",
        "You fixed the root cause: unsafe command syntax, not 'human error'",
        "You calculated total outage duration: 4 hours across many services",
      ],
      faangFocus: "Safe automation, human error prevention, cascading failure",
      tools: [
        "Server decommission tool",
        "Dependency map",
        "Snapshot manager",
        "Incident timeline",
      ],
    } as Scenario,
  ],

  // ============ GOOGLE-INSPIRED SCENARIOS ============
  [
    "google-null-pointer-cascade",
    {
      id: "google-null-pointer-cascade",
      title: "INC-GCP-001: Null Pointer Crash Loop Across All Regions",
      description:
        "Recreate the Google January 2023 incident: a policy change with blank fields caused a null pointer exception, cascading crash-loop across all Service Control regions",
      type: "incident",
      role: "sre",
      difficulty: "senior",
      allocatedTime: 55,
      context:
        "It's 23:30 US/Pacific. A routine policy change to Service Control (Google's API management system) is deployed. The change includes a blank field that wasn't validated. A null pointer dereference in the policy handler causes Service Control binaries to crash globally. But it's immediately restarted by the orchestrator. It crashes again (same error). Crash loop. Meanwhile, policy data is replicating to all regions. All of downstream Google APIs start failing: Search, Gmail, Drive, Cloud APIs. Your monitoring shows: thousands of crashes/second. Larger regions hit a 'thundering herd' problem: too many tasks trying to restart simultaneously, overloading shared infrastructure.",
      requirements: [
        "Identify the null pointer trigger (blank policy field)",
        "Understand crash-loop behavior: why keep restarting?",
        "Calculate time to detect: when do engineers notice?",
        "Propose immediate fix: either fix the policy or fix the code",
        "Design 'feature flag protection': crash shouldn't affect entire region",
        "Plan recovery from thundering herd (40+ minute recovery for large regions)",
      ],
      evaluationCriteria: [
        "You identified the validation gap (null field should be rejected)",
        "You understood crash-loop: orchestrator keeps trying",
        "You proposed code path feature flag as immediate mitigation",
        "You recognized 'thundering herd' requires staged restart, not parallel",
        "You calculated regional recovery times (2:40 for largest regions)",
        "You understood this was a 'perfect storm': validation + missing feature flag + no circuit breaker",
      ],
      faangFocus: "Resilience engineering, feature flags, graceful degradation",
      tools: [
        "Policy validator",
        "Crash dump analyzer",
        "Feature flag system",
        "Staged restart procedure",
      ],
    } as Scenario,
  ],

  // ============ DISCORD-INSPIRED SCENARIOS ============
  [
    "discord-thundering-herd",
    {
      id: "discord-thundering-herd",
      title: "INC-DISCORD-001: Cascading Failure from Thundering Herd",
      description:
        "Recreate the Discord cascading failure: a flapping service caused millions of clients to reconnect simultaneously, causing OOM in frontend services",
      type: "incident",
      role: "sre",
      difficulty: "mid",
      allocatedTime: 45,
      context:
        "It's 14:01 UTC. A Redis cluster failover causes a Discord API service to become unavailable for 8 seconds. When it comes back, 45 million clients try to reconnect at the same time (thundering herd). Each reconnection establishes a WebSocket and queues events. Frontend services designed for gradual load hit maximum queue depth and start dropping events from memory. Some clients retry, making it worse. Queue → OOM → service crash → more clients retry. Cascading failure across Discord's real-time system.",
      requirements: [
        "Identify the trigger: which component failed first?",
        "Understand thundering herd: why do all clients reconnect at once?",
        "Design backoff strategy: how to spread reconnections?",
        "Calculate queue overflow: at what point do services OOM?",
        "Propose mitigation for production: circuit breaker? Rate limiting?",
        "Design monitoring that detects 'all clients reconnecting' early",
      ],
      evaluationCriteria: [
        "You understood Redis failover → connection loss → forced reconnect",
        "You identified thundering herd: 45M clients isn't handled gracefully",
        "Your backoff used exponential jitter (not linear or fixed)",
        "You proposed max reconnection rate limiting at edge",
        "You understood the cascading nature: queue → OOM → crash → retry loop",
        "You proposed circuit breaker to fast-fail when services are saturated",
      ],
      faangFocus: "Resilience under load, thundering herd prevention, queue management",
      tools: [
        "Connection spike analyzer",
        "Queue depth monitor",
        "Backoff logic",
        "Circuit breaker framework",
      ],
    } as Scenario,
  ],

  // ============ DATABASE-INSPIRED SCENARIOS ============
  [
    "postgres-migration-lock",
    {
      id: "postgres-migration-lock",
      title: "INC-DB-001: Database Migration Deadlock Under Load",
      description:
        "Recreate variants of (GitHub, Kickstarter): a schema migration takes locks that conflict with production read queries",
      type: "incident",
      role: "sre",
      difficulty: "mid",
      allocatedTime: 40,
      context:
        "It's 14:30 UTC. You start a critical migration on a users table (10B rows). The migration is supposed to add an index non-blocking using pg_concurrently. But a reporting query from your analytics dashboard runs long-running SELECT during the migration. The migration tries to take an exclusive lock. The SELECT blocks it. But the SELECT now times out, clients retry, creating more SELECTs. The migration is now blocked by dozens of queries, and new queries keep stacking. Latency spikes. You have an SLA of 100ms p99. You're now at 5000ms p99.",
      requirements: [
        "Understand lock interactions: index creation vs. SELECT",
        "Identify the problematic long-running query",
        "Design safe schema migrations (concurrent index creation)",
        "Calculate TTR: how long until manual intervention needed?",
        "Propose solution: kill the SELECT? Wait for it? Rollback migration?",
        "Document the 'schema migration during peak hours' decision process",
      ],
      evaluationCriteria: [
        "You understood PostgreSQL locking semantics",
        "You identified that pg_concurrent_index doesn't help if SELECT takes lock first",
        "Your solution included checking for long-running queries pre-migration",
        "You proposed scheduling migrations during low-traffic windows",
        "You understood the cascade: lock → timeout → retry → more locks",
        "You documented SLA impact and recovery time explicitly",
      ],
      faangFocus: "Database safety, schema evolution, concurrency control",
      tools: [
        "Query profiler",
        "Lock monitor",
        "Migration safety checker",
        "Rollback procedure",
      ],
    } as Scenario,
  ],
];
