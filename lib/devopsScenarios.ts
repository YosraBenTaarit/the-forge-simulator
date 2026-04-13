export const devopsSreScenarios: Scenario[] = [
  {
    id: "devops-1-gcp-gke-multi-region",
    title: "GKE Fleet Multi-Region Failure",
    role: "Mid-level/Senior DevOps Engineer",
    description:
      "Your company uses a multi-region GKE fleet for its microservices. You are receiving alerts that the US-East region's primary cluster is failing readiness probes. Investigate the health of the nodes, traffic splitting in Cloud Service Mesh, and implement a draining/redirect strategy to US-West before cascading failures take down the database.",
    context:
      "A Professional Cloud DevOps Engineer implements processes enabling efficient software delivery while balancing reliability. Recently, a CI/CD pipeline triggered an artifact update that consumed excessive heap memory...",
    expectedOutcomes: [
      "Analyze Trace waterfalls and Spans to identify the failing pod endpoints",
      "Draft a Cloud Deploy pipeline rollback for the faulty version",
      "Update traffic splitting via Cloud Service Mesh to drain US-East traffic safely",
      "Document the SLI/SLO impact and create an error budget burn post-mortem"
    ],
    taskTypes: [
      { id: "task-1", description: "Identify root cause through Ops Agent and OpenTelemetry metrics", status: "pending" },
      { id: "task-2", description: "Drain US-East traffic configuring the mesh policies", status: "pending" },
      { id: "task-3", description: "Rollback using Cloud Deploy", status: "pending" }
    ],
    evaluationCriteria: [
      "Zero downtime during failover execution",
      "No direct manual kubectl scale downs (must use pipeline or mesh)",
      "Analysis tied directly to the correct Trace IDs"
    ],
    faangFocus: "SRE Book: Mitigating Incident Impact, Traffic Draining, Rollback Strategies",
    tools: ["Cloud Service Mesh", "GKE Fleets", "Cloud Deploy", "Logs Explorer", "PromQL"]
  },
  {
    id: "devops-2-secret-manager-injection",
    title: "CI/CD Pipeline Secret Leakage",
    role: "DevOps / SRE",
    description:
      "A developer inadvertently committed a hardcoded API token to a feature branch, and Cloud Build successfully deployed it to staging. A security scan caught it, but the pipeline does not enforce Supply-chain Levels for Software Artifacts (SLSA).",
    context:
      "Your objective is to revoke the compromised credentials, migrate the secret to Google Secret Manager, and rewrite the GitHub Actions / Cloud Build pipelines to use Workload Identity Federation so no long-lived keys are stored in the CI/CD environment.",
    expectedOutcomes: [
      "Revoke the existing exposed token",
      "Provision a new token via Secret Manager",
      "Configure Workload Identity Federation for the GitOps agent",
      "Refactor the Terraform deployment to pull secrets at runtime or build time securely"
    ],
    taskTypes: [
      { id: "task-1", description: "Revoke old token and rotate", status: "pending" },
      { id: "task-2", description: "Implement Workload Identity Federation", status: "pending" },
      { id: "task-3", description: "Update pipeline IAM permissions to least privilege", status: "pending" }
    ],
    evaluationCriteria: [
      "No secrets remain in version control or plain text environment vars",
      "Pipeline succeeds exclusively using Workload Identity Federation",
      "Software supply chain SLSA checks pass for Binary Authorization"
    ],
    faangFocus: "DevOps Roadmap: CI/CD Security, Secret Management, Zero Trust",
    tools: ["Secret Manager", "Cloud Build", "Workload Identity", "Terraform"],
    initialFiles: {
      ".github/workflows/deploy.yml": `name: Deploy Staging
on:
  push:
    branches: [ "feature/*" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Push Docker image
        run: |
          docker build -t gcr.io/my-project/api-service:latest .
          # LEAKED TOKEN BELOW!!!
          docker login -u _json_key -p '{"type": "service_account", "project_id": "my-project", "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n"}' https://gcr.io
          docker push gcr.io/my-project/api-service:latest`,
      "terraform/main.tf": `resource "google_secret_manager_secret" "api-token" {
  secret_id = "api-token-secret"
  replication {
    automatic = true
  }
}

# TODO: Add Workload Identity Pool for GitHub Actions
# TODO: Add IAM bindings for the pool`,
      "Dockerfile": `FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
# Token is hardcoded into the container image :(
ENV STRIPE_API_TOKEN="sk_live_1234567890abcdef"
CMD ["npm", "start"]`,
      "README.md": `# CI/CD Security Incident Action Plan

**Urgent Activity Required: SEV-2 Security Incident**

A developer accidentally hardcoded a Service Account key in the \`.github/workflows/deploy.yml\` script and a production Stripe API key in the \`Dockerfile\`. This implies our Git history and Docker image layers are compromised.

## Expected Next Steps
1. Scrub the hardcoded keys.
2. Refactor \`terraform/main.tf\` to create a Workload Identity Federation configuration for GitHub Actions.
3. Remove the \`docker login\` with simple keys and instead use the official GCP auth action.
4. Refactor the Dockerfile so it doesn't embed secrets in \`ENV\`.`
    },
    expectedSolution: {
      description: "Remove hardcoded secrets, use Workload Identity Federation and Secret Manager",
      keyPatterns: ["workload_identity_pool", "process.env", "secret"]
    }
  },
  {
    id: "devops-3-finops-spot-vms",
    title: "FinOps Cost Explosion in BigData processing",
    role: "Cloud DevOps Engineer",
    description:
      "The end-of-month cloud billing report shows a 300% spike in Compute Engine and Cloud Storage costs. The data engineering team created an autoscaling Pipeline that heavily uses on-demand VMs.",
    context:
      "As part of optimizing performance and cost, analyze the billing data, identify the inefficient usage patterns, and rebuild the pipeline environment to utilize Spot VMs and intelligent autoscaling limits without violating the current SLAs.",
    expectedOutcomes: [
      "Extract billing insights from BigQuery exports",
      "Change Managed Instance Group (MIG) templates to use Spot VMs",
      "Implement a graceful failure handler for Spot VM preemption",
      "Submit a Pull Request adjusting the Terraform configuration"
    ],
    taskTypes: [
      { id: "task-1", description: "Identify offending workloads contributing to the 300% spike", status: "pending" },
      { id: "task-2", description: "Update Terraform state to use preemptible/Spot instances", status: "pending" },
      { id: "task-3", description: "Write grace-period handler for the worker nodes", status: "pending" }
    ],
    evaluationCriteria: [
      "Cost is reduced by at least 60% in estimation",
      "Throughput meets SLA requirements despite spot preemption",
      "Terraform syntax is valid"
    ],
    faangFocus: "FinOps, Cost Optimization, Spot VMs, SRE Error Budgets vs Cost",
    tools: ["Terraform", "Spot VMs", "Google Cloud Billing", "MIGs"]
  }
];
