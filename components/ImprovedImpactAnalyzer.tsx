"use client";

import { useState } from "react";
import { TrendingDown, AlertTriangle, BarChart3, HelpCircle } from "lucide-react";

interface Impact {
  metric: string;
  current: number;
  baseline: number;
  unit: string;
  severity: "low" | "medium" | "high" | "critical";
  trend: "stable" | "improving" | "degrading";
  explanation: string; // What does this mean for the business?
}

interface ImpactAnalyzerProps {
  scenarioId?: string;
  impacts?: Impact[];
  totalImpact?: {
    affectedUsers: number;
    estimatedRevenueLoss: number;
    dataAtRisk: number; // bytes
    slaBreachRisk: number; // percentage
  };
}

const defaultImpacts: Impact[] = [
  {
    metric: "API Latency (p99)",
    current: 5200,
    baseline: 100,
    unit: "ms",
    severity: "critical",
    trend: "degrading",
    explanation:
      "99% of requests take > 5 seconds (should be < 100ms). Users see spinning wheels. Cart abandonment increases. Revenue impact: ~$50k/hour.",
  },
  {
    metric: "Error Rate",
    current: 15.2,
    baseline: 0.1,
    unit: "%",
    severity: "critical",
    trend: "degrading",
    explanation:
      "15% of requests fail (should be < 0.1%). Checkout fails. Users can't complete purchases. 150,000 failed transactions/hour at current scale.",
  },
  {
    metric: "Database CPU",
    current: 98,
    baseline: 40,
    unit: "%",
    severity: "high",
    trend: "stable",
    explanation:
      "CPU maxed out. Queries queue. Any spike causes cascading failure. Need to reduce load or scale up immediately.",
  },
  {
    metric: "Affected Regions",
    current: 3,
    baseline: 0,
    unit: "regions",
    severity: "high",
    trend: "degrading",
    explanation: "North America (fully down), Europe (50% degraded), Asia-Pacific (60% degraded). Global impact.",
  },
  {
    metric: "SLA Compliance",
    current: 87,
    baseline: 99.95,
    unit: "%",
    severity: "high",
    trend: "degrading",
    explanation:
      "We promised 99.95% availability. Currently at 87%. That's a breach of 12.95% = $250k in SLA penalties and customer refunds.",
  },
];

export default function ImpactAnalyzer({
  scenarioId = "test",
  impacts = defaultImpacts,
  totalImpact,
}: ImpactAnalyzerProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>("API Latency (p99)");
  const [showExplanation, setShowExplanation] = useState(true);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/30 border-red-600 text-red-300";
      case "high":
        return "bg-orange-900/30 border-orange-600 text-orange-300";
      case "medium":
        return "bg-yellow-900/30 border-yellow-600 text-yellow-300";
      case "low":
        return "bg-green-900/30 border-green-600 text-green-300";
      default:
        return "bg-slate-900/30 border-slate-600 text-slate-300";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") {
      return "📈 Improving";
    } else if (trend === "degrading") {
      return "📉 Degrading";
    } else {
      return "➡️ Stable";
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-yellow-400" />
            <span className="text-sm font-medium">Impact Analyzer</span>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors text-slate-300"
          >
            {showExplanation ? "Hide" : "Show"} Help
          </button>
        </div>

        {/* Help Text */}
        {showExplanation && (
          <div className="text-xs text-slate-400 bg-slate-800/30 p-2 rounded mt-2">
            <div className="flex gap-2">
              <HelpCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-300 mb-1">What to watch:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Critical metrics (red) need immediate action</li>
                  <li>High metrics (orange) could cascade into critical if not addressed</li>
                  <li>Compare "Current" vs "Baseline" - how much worse is it?</li>
                  <li>Understand the BUSINESS impact (revenue, users, SLA) - not just numbers</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Impact Summary */}
      {totalImpact && (
        <div className="bg-red-900/20 border-b border-red-800 px-4 py-3">
          <div className="text-xs text-red-300">
            <p className="font-medium mb-2">Current Impact (Estimated):</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Affected Users:</span>
                <p className="text-lg font-bold">
                  {(totalImpact.affectedUsers / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <span className="text-slate-400">Revenue Loss/Hour:</span>
                <p className="text-lg font-bold">${(totalImpact.estimatedRevenueLoss / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <span className="text-slate-400">Data At Risk:</span>
                <p className="text-lg font-bold">{(totalImpact.dataAtRisk / 1e9).toFixed(1)}GB</p>
              </div>
              <div>
                <span className="text-slate-400">SLA Breach Risk:</span>
                <p className="text-lg font-bold">{totalImpact.slaBreachRisk.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {impacts.map((impact, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 cursor-pointer transition-colors hover:border-opacity-100 ${getSeverityColor(
              impact.severity
            )}`}
            onClick={() =>
              setExpandedMetric(expandedMetric === impact.metric ? null : impact.metric)
            }
          >
            {/* Collapsed View */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm break-words">{impact.metric}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-base">{getTrendIcon(impact.trend)}</span>
                  <span className="opacity-75">
                    {impact.current.toFixed(1)} {impact.unit}
                  </span>
                  <span className="text-slate-500">vs baseline {impact.baseline} {impact.unit}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs font-medium">{impact.severity.toUpperCase()}</div>
                <div className="text-xs opacity-75 mt-1">
                  {(
                    ((impact.current - impact.baseline) / impact.baseline) *
                    100
                  ).toFixed(0)}
                  % change
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {expandedMetric === impact.metric && (
              <div className="mt-3 pt-3 border-t border-slate-600/30 text-xs">
                <p className="leading-relaxed mb-2">{impact.explanation}</p>

                {/* Interpretation Guide */}
                <div className="bg-slate-800/30 p-2 rounded text-slate-300">
                  <p className="font-medium mb-1">What this means:</p>
                  {impact.metric.includes("Latency") && (
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>
                        <strong>Baseline:</strong> p99 latency should be &lt; 100ms (users don't notice)
                      </li>
                      <li>
                        <strong>Current:</strong> {impact.current}ms means 1 in 100 requests takes &gt;
                        {impact.current}ms
                      </li>
                      <li>
                        <strong>Impact:</strong> Users see loading spinners, carts feel slow, pages show "Please wait"
                      </li>
                      <li>
                        <strong>Business:</strong> Cart abandon increases ~2% per 100ms. At current scale
                        ≈ $10k/hour revenue loss
                      </li>
                    </ul>
                  )}

                  {impact.metric.includes("Error Rate") && (
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>
                        <strong>Baseline:</strong> Error rate should be &lt; 0.05% (1 in 2000 errors)
                      </li>
                      <li>
                        <strong>Current:</strong> {impact.current}% means 1 in {Math.round(100 / impact.current)}{" "}
                        requests fails
                      </li>
                      <li>
                        <strong>Impact:</strong> Critical path (checkout, payment) completely broken for most
                      </li>
                      <li>
                        <strong>Business:</strong> Revenue → $0 until fixed. Users churn to competitors
                      </li>
                    </ul>
                  )}

                  {impact.metric.includes("CPU") && (
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>
                        <strong>Baseline:</strong> CPU should be &lt; 60% (headroom for spikes)
                      </li>
                      <li>
                        <strong>Current:</strong> {impact.current}% - at maximum capacity
                      </li>
                      <li>
                        <strong>Impact:</strong> Any traffic increase → cascading failure. One bad query crashes DB
                      </li>
                      <li>
                        <strong>Decision:</strong> Scale up servers OR shed traffic OR fix root cause NOW
                      </li>
                    </ul>
                  )}

                  {impact.metric.includes("SLA") && (
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>
                        <strong>Baseline:</strong> 99.95% = ~22 minutes downtime/month acceptable
                      </li>
                      <li>
                        <strong>Current:</strong> {impact.current}% = breach of {(100 - impact.current).toFixed(2)}%
                      </li>
                      <li>
                        <strong>Impact:</strong> Customers get refunds. Company reputation damage. Contracts at risk
                      </li>
                      <li>
                        <strong>Business:</strong> At enterprise F500 customers, SLA breach = $millions in penalties
                      </li>
                    </ul>
                  )}

                  {!impact.metric.includes("Latency") &&
                    !impact.metric.includes("Error Rate") &&
                    !impact.metric.includes("CPU") &&
                    !impact.metric.includes("SLA") && (
                      <p className="text-slate-400">
                        Monitor this metric carefully. Understand how it impacts users and business.
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="bg-slate-900/50 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <span>{impacts.filter((i) => i.severity === "critical").length} critical metrics</span>
        <span>Click metric to see interpretation</span>
      </div>
    </div>
  );
}
