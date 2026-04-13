"use client";

import { useRouter } from "next/navigation";
import { Trophy, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ScenarioResultProps {
  scenarioId: string;
  scenarioTitle: string;
  type: "normal" | "incident" | "postmortem";
  allocatedTime: number;
  actualTime: number; // seconds
  score: number;
  bonus: number;
  totalScore: number;
  feedback: string;
  nextRecommendation: string;
}

export default function ScenarioResult({
  scenarioId,
  scenarioTitle,
  type,
  allocatedTime,
  actualTime,
  score,
  bonus,
  totalScore,
  feedback,
  nextRecommendation,
}: ScenarioResultProps) {
  const router = useRouter();

  const actualMinutes = actualTime / 60;
  const allocatedSeconds = allocatedTime * 60;
  const timeStatus =
    actualTime <= allocatedSeconds * 0.8
      ? "early"
      : actualTime <= allocatedSeconds
      ? "on-time"
      : "late";

  const statusColor =
    timeStatus === "early"
      ? "text-green-300"
      : timeStatus === "on-time"
      ? "text-yellow-300"
      : "text-red-300";

  // Determine medal based on score
  const getMedalEmoji = () => {
    if (totalScore >= 95) return "🥇";
    if (totalScore >= 85) return "🥈";
    if (totalScore >= 70) return "🥉";
    return "📊";
  };

  // Determine performance description
  const getPerformanceDescription = () => {
    if (totalScore >= 95) return "Outstanding Performance!";
    if (totalScore >= 85) return "Excellent Work!";
    if (totalScore >= 70) return "Good Effort";
    return "Keep Practicing";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Main Result Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-800 p-6 text-center">
            <div className="text-6xl mb-4">{getMedalEmoji()}</div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {getPerformanceDescription()}
            </h1>
            <p className="text-slate-400">{scenarioTitle}</p>
          </div>

          {/* Score Display */}
          <div className="p-8">
            {/* Main Score */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <div className="text-4xl font-bold text-blue-400 mb-1">
                  {score}
                </div>
                <div className="text-xs text-slate-400">Base Score</div>
              </div>

              {bonus > 0 && (
                <>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="text-4xl font-bold text-green-400 mb-1">
                      +{bonus}
                    </div>
                    <div className="text-xs text-slate-400">SLA Bonus</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="text-4xl font-bold text-yellow-400 mb-1">
                      {totalScore}
                    </div>
                    <div className="text-xs text-slate-400">Total Score</div>
                  </div>
                </>
              )}

              {bonus === 0 && (
                <div className="col-span-2 text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="text-4xl font-bold text-white mb-1">
                    {totalScore}
                  </div>
                  <div className="text-xs text-slate-400">Final Score</div>
                </div>
              )}
            </div>

            {/* Time Analysis */}
            <div className="mb-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock size={16} />
                Time Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Actual Time</p>
                  <p className="text-white font-semibold">
                    {actualMinutes.toFixed(1)}
                    <span className="text-slate-400 text-xs ml-1">minutes</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Allocated</p>
                  <p className="text-white font-semibold">
                    {allocatedTime}
                    <span className="text-slate-400 text-xs ml-1">minutes</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className={`font-semibold capitalize ${statusColor}`}>
                    {timeStatus === "early"
                      ? "✓ Early"
                      : timeStatus === "on-time"
                      ? "✓ On Time"
                      : "⚠ Late"}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-2">Feedback</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{feedback}</p>
            </div>

            {/* Next Steps */}
            <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp size={16} />
                Next Steps
              </h3>
              <p className="text-purple-200 text-sm">{nextRecommendation}</p>
            </div>

            {/* Scenario Type Info */}
            <div className="mb-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-2">Scenario Type</h3>
              <div className="flex items-center gap-2 text-slate-300">
                {type === "incident" && (
                  <>
                    <AlertCircle size={16} className="text-red-400" />
                    <span>
                      <strong>Incident Response</strong> — Speed is critical.
                      Beating the SLA ({(allocatedTime * 0.8).toFixed(0)}m) earns
                      bonus points.
                    </span>
                  </>
                )}
                {type === "normal" && (
                  <>
                    <CheckCircle size={16} className="text-blue-400" />
                    <span>
                      <strong>Normal Task</strong> — Balance speed and quality.
                      Focus on clean code and best practices.
                    </span>
                  </>
                )}
                {type === "postmortem" && (
                  <>
                    <Trophy size={16} className="text-yellow-400" />
                    <span>
                      <strong>Postmortem</strong> — Thoughtful analysis matters
                      most. Take time to understand root causes.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-800 p-6 bg-slate-800/30 flex gap-4 justify-between">
            <button
              onClick={() => router.push("/scenarios")}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              ← Back to Scenarios
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/scenario/${scenarioId}`)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/scenarios")}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Next Scenario →
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Score Percentile</p>
            <p className="text-2xl font-bold text-white">
              {totalScore >= 90
                ? "Top Tier"
                : totalScore >= 80
                ? "Excellent"
                : totalScore >= 70
                ? "Good"
                : "Developing"}
            </p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Role Mastery</p>
            <p className="text-2xl font-bold text-white">
              {totalScore >= 85 ? "Expert" : totalScore >= 75 ? "Advanced" : "Intermediate"}
            </p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Recommendation</p>
            <p className="text-sm text-white">
              {totalScore >= 90
                ? "Try senior difficulty"
                : totalScore >= 80
                ? "Try intermediate"
                : "Build fundamentals"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
