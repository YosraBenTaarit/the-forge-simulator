"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, AlertCircle, CheckCircle, FileText, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import ScenarioTimer from "@/components/ScenarioTimer";
import ScenarioResult from "@/components/ScenarioResult";

interface Scenario {
  id: string;
  title: string;
  description: string;
  type: "normal" | "incident" | "postmortem";
  role: string;
  difficulty: string;
  allocatedTime: number;
  context: string;
  requirements: string[];
  evaluationCriteria: string[];
  initialFiles?: Record<string, string>;
  expectedSolution?: {
    description: string;
    keyPatterns: string[];
  };
}

interface ScenarioScoreResult {
  scenarioId: string;
  score: number;
  bonus: number;
  totalScore: number;
  feedback: string;
  nextRecommendation: string;
}

const ForgeWorkstation = dynamic(() => import("@/components/ForgeWorkstation"), {
  loading: () => <div className="p-4 text-slate-400">Loading workstation...</div>,
});

export default function ScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBriefing, setShowBriefing] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [actualTime, setActualTime] = useState<number | null>(null);
  const [scoreResult, setScoreResult] = useState<ScenarioScoreResult | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState("");

  const scenarioId = params.id as string;

  useEffect(() => {
    fetchScenario();
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      const response = await fetch(`/api/scenarios?id=${scenarioId}`);
      const data = await response.json();
      setScenario(data);
    } catch (error) {
      console.error("Failed to fetch scenario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScenario = () => {
    setStartTime(Date.now());
    setShowBriefing(false);
  };

  const handleFinishScenario = async () => {
    if (!startTime || !scenario) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setActualTime(elapsed);

    // Submit to backend
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scenarios/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          actualTime: elapsed,
          notes: submissionNotes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScoreResult(result);
      }
    } catch (error) {
      console.error("Failed to submit scenario:", error);
      alert("Failed to submit scenario. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = async () => {
    if (!startTime || !scenario) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setActualTime(elapsed);

    // Auto-submit when time is up
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scenarios/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          actualTime: elapsed,
          notes: submissionNotes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScoreResult(result);
      }
    } catch (error) {
      console.error("Failed to submit scenario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <div className="text-slate-400">Loading scenario...</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-white mb-4">Scenario not found</h1>
          <button
            onClick={() => router.push("/scenarios")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  // Show score result
  if (scoreResult) {
    return (
      <ScenarioResult
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
        type={scenario.type}
        allocatedTime={scenario.allocatedTime}
        actualTime={actualTime || 0}
        score={scoreResult.score}
        bonus={scoreResult.bonus}
        totalScore={scoreResult.totalScore}
        feedback={scoreResult.feedback}
        nextRecommendation={scoreResult.nextRecommendation}
      />
    );
  }

  const TypeIcon = {
    normal: CheckCircle,
    incident: AlertCircle,
    postmortem: FileText,
  }[scenario.type];

  // If scenario is active (workstation is running), show full workstation with timer
  if (!showBriefing && startTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black">
        <div className="max-w-7xl mx-auto p-4">
          {/* Top Bar with Timer */}
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h2 className="text-white font-semibold mb-2">
                  {scenario.title}
                </h2>
                <p className="text-sm text-slate-400">{scenario.context}</p>
              </div>

              <ScenarioTimer
                allocatedTime={scenario.allocatedTime}
                startTime={startTime}
                onTimeUp={handleTimeUp}
              />

              <div className="flex flex-col justify-center gap-2">
                <button
                  onClick={handleFinishScenario}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Finish Scenario ✓"}
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure? Your progress will not be saved."
                      )
                    ) {
                      router.push("/scenarios");
                    }
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  Abandon
                </button>
              </div>
            </div>
          </div>

          {/* Workstation */}
          <ForgeWorkstation
            scenarioId={scenario.id}
            scenarioTitle={scenario.title}
            scenarioContext={scenario.context}
            allocatedTime={scenario.allocatedTime}
            startTime={startTime}
            requirements={scenario.requirements}
            initialFiles={scenario.initialFiles}
            expectedSolution={scenario.expectedSolution}
            onExit={() => {
              if (
                window.confirm(
                  "Are you sure? Your progress will not be saved."
                )
              ) {
                router.push("/scenarios");
              }
            }}
            onSubmit={(notes) => {
              setSubmissionNotes(notes);
              handleFinishScenario();
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  // Show briefing before scenario starts
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header with back button */}
        <button
          onClick={() => router.push("/scenarios")}
          className="mb-8 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Briefing Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-800 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {scenario.title}
                </h1>
                <p className="text-slate-400">{scenario.description}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded text-sm text-slate-300">
                  <TypeIcon size={16} />
                  {scenario.type === "normal"
                    ? "Normal Task"
                    : scenario.type === "incident"
                    ? "Incident"
                    : "Postmortem"}
                </div>
                <div
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    scenario.difficulty === "junior"
                      ? "bg-green-500/20 text-green-300"
                      : scenario.difficulty === "mid"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {scenario.difficulty.charAt(0).toUpperCase() +
                    scenario.difficulty.slice(1)}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                Allocated: {scenario.allocatedTime} minutes
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                Role: {scenario.role}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Context */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Context</h2>
              <p className="text-slate-400 leading-relaxed">{scenario.context}</p>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                Your Requirements
              </h2>
              <ul className="space-y-2">
                {scenario.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-blue-300">
                      {i + 1}
                    </div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Evaluation Criteria */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                How You'll Be Evaluated
              </h2>
              <ul className="space-y-2">
                {scenario.evaluationCriteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <Zap size={16} className="flex-shrink-0 mt-0.5 text-yellow-500" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SLA Info for Incidents */}
            {scenario.type === "incident" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-300 mb-2">
                  🚨 Incident SLA
                </h3>
                <p className="text-sm text-red-200">
                  Incidents have SLAs. To beat the clock and earn bonus points,
                  complete this within <strong>{(scenario.allocatedTime * 0.8).toFixed(0)} minutes</strong> (80% of allocated
                  time). Scoring rewards speed!
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Tips</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Read the context carefully before diving in</li>
                <li>• Check available tools and team members</li>
                <li>• Document your steps as you go</li>
                <li>• Ask questions to clarify ambiguities</li>
                {scenario.type === "incident" && (
                  <li>• Work fast - time matters for SLA compliance</li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-800 p-6 bg-slate-800/30 flex gap-4 justify-end">
            <button
              onClick={() => router.push("/scenarios")}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartScenario}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Zap size={18} />
              Start Scenario
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">💡 Think First</h3>
            <p className="text-sm text-slate-400">
              Take time to understand the problem before jumping to solutions
            </p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">🤝 Ask Questions</h3>
            <p className="text-sm text-slate-400">
              Use the team chat to get help from your colleagues
            </p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">📝 Document</h3>
            <p className="text-sm text-slate-400">
              Keep notes of your investigation and decisions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
