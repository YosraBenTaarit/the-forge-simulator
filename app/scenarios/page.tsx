"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@/components/SignOut";
import { useSession } from "next-auth/react";
import { Clock, AlertCircle, FileText, CheckCircle } from "lucide-react";

interface Scenario {
  id: string;
  title: string;
  description: string;
  type: "normal" | "incident" | "postmortem";
  role: "backend-swe" | "devops" | "frontend" | "ml-engineer" | "pm" | "sre";
  difficulty: "junior" | "mid" | "senior";
  allocatedTime: number;
}

const ROLE_LABELS = {
  "backend-swe": "Backend SWE",
  devops: "DevOps",
  frontend: "Frontend",
  "ml-engineer": "ML Engineer",
  pm: "Product Manager",
  sre: "SRE",
};

const ROLE_ICONS = {
  "backend-swe": "⚙️",
  devops: "🚀",
  frontend: "🎨",
  "ml-engineer": "🧠",
  pm: "📊",
  sre: "🛡️",
};

const TYPE_LABELS = {
  normal: "Normal Task",
  incident: "Incident",
  postmortem: "Postmortem",
};

const TYPE_ICONS = {
  normal: CheckCircle,
  incident: AlertCircle,
  postmortem: FileText,
};

const DIFFICULTY_COLORS = {
  junior: "bg-green-500/20 text-green-300 border-green-500/30",
  mid: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  senior: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function ScenariosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, [selectedRole, selectedType]);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole) params.append("role", selectedRole);
      if (selectedType) params.append("type", selectedType);

      const response = await fetch(`/api/scenarios?${params}`);
      const data = await response.json();
      setScenarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch scenarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScenario = (scenarioId: string) => {
    router.push(`/scenario/${scenarioId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">The Forge</h1>
            <p className="text-sm text-slate-500">Learn Real-World Incident Response</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-white">{session?.user?.name || session?.user?.email}</p>
            </div>
            <SignOut />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Intro */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Choose Your Scenario</h2>
          <p className="text-slate-400 text-lg mb-2">
            Learn by solving real-world problems that engineers face every day
          </p>
          <p className="text-slate-500 text-sm">
            Each scenario covers the full cycle: normal work → incident response → postmortem analysis
          </p>
        </div>

        {/* Role Filter */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(ROLE_LABELS).map(([roleId, label]) => (
              <button
                key={roleId}
                onClick={() => setSelectedRole(selectedRole === roleId ? null : roleId)}
                className={`p-4 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedRole === roleId
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="text-2xl mb-2">{ROLE_ICONS[roleId as keyof typeof ROLE_ICONS]}</div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Filter by Task Type</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(TYPE_LABELS).map(([typeId, label]) => {
              const Icon = TYPE_ICONS[typeId as keyof typeof TYPE_ICONS];
              return (
                <button
                  key={typeId}
                  onClick={() => setSelectedType(selectedType === typeId ? null : typeId)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 text-sm font-medium ${
                    selectedType === typeId
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenarios List */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-6">
            {selectedRole
              ? `${ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]} Scenarios`
              : "All Available Scenarios"}
          </h3>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-slate-400">Loading scenarios...</div>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="text-slate-400">
                {selectedRole
                  ? "No scenarios for this role and filter combination"
                  : "Select a role to see scenarios"}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {scenarios.map((scenario) => {
                const TypeIcon = TYPE_ICONS[scenario.type] || CheckCircle;
                const difficulty = scenario.difficulty || "mid";
                const allocatedTime = scenario.allocatedTime || 30;
                return (
                  <div
                    key={scenario.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all hover:bg-slate-900/80"
                  >
                    <div className="flex justify-between items-start gap-6 mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white mb-1">
                          {scenario.title}
                        </h4>
                        <p className="text-slate-400 text-sm">{scenario.description}</p>
                      </div>
                      <button
                        onClick={() => handleStartScenario(scenario.id)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        Start →
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 items-center text-xs">
                      {/* Type */}
                      <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 rounded text-slate-300">
                        <TypeIcon size={14} />
                        {TYPE_LABELS[scenario.type] || "Task"}
                      </div>

                      {/* Difficulty */}
                      <div
                        className={`px-3 py-1 rounded border font-medium ${
                          DIFFICULTY_COLORS[difficulty]
                        }`}
                      >
                        {difficulty.charAt(0).toUpperCase() +
                          difficulty.slice(1)}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 rounded text-slate-300">
                        <Clock size={14} />
                        {allocatedTime} min
                      </div>

                      {/* Role (if not pre-filtered) */}
                      {!selectedRole && (
                        <div className="ml-auto text-slate-400">
                          {ROLE_LABELS[scenario.role as keyof typeof ROLE_LABELS]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">How Scenarios Work</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-300">
            <div>
              <p className="font-medium text-white mb-1">Normal Tasks</p>
              <p>
                Real day-to-day work: implementing features, debugging, optimization, code review
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Incidents</p>
              <p>
                Production emergencies: diagnose issues quickly, respond under pressure, stabilize
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Postmortems</p>
              <p>
                Learning & documentation: analyze root causes, write clear reports, prevent recurrence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
