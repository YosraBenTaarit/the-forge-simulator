"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Target } from "lucide-react";

interface TaskRequirement {
  id: string;
  title: string;
  description: string;
  category: "detection" | "diagnosis" | "mitigation" | "resolution";
  priority: "high" | "medium" | "low";
  estimatedTime: number; // minutes
  completed: boolean;
  checklist?: string[]; // Sub-tasks to complete this requirement
  completedItems?: number;
}

interface TaskBoardProps {
  scenarioId?: string;
  requirements?: TaskRequirement[];
  onTaskComplete?: (taskId: string) => void;
  phase?: "detection" | "investigation" | "mitigation" | "resolution";
}

const defaultRequirements: TaskRequirement[] = [
  {
    id: "detect-1",
    title: "Identify the incident type",
    description: "Determine what's broken: API latency, errors, data corruption, or security breach?",
    category: "detection",
    priority: "high",
    estimatedTime: 5,
    completed: false,
    checklist: [
      "Check error logs for patterns",
      "Review recent deployments",
      "Look at monitoring dashboards",
      "Identify the scope (which services affected?)",
      "Declare incident severity (SEV-1/2/3)",
    ],
    completedItems: 0,
  },
  {
    id: "detect-2",
    title: "Document timeline of events",
    description:
      "When did it start? What changed? Build a timeline to understand causality.",
    category: "detection",
    priority: "high",
    estimatedTime: 10,
    completed: false,
    checklist: [
      "Note when alerts started firing",
      "Identify last successful deploy time",
      "Look for config changes or feature flags",
      "Check infrastructure changes (scaling, maintenance)",
      "Create annotated timeline in incident document",
    ],
    completedItems: 0,
  },
  {
    id: "diag-1",
    title: "Root cause analysis",
    description:
      "Find the actual root cause, not just symptoms. Use the 5 whys technique.",
    category: "diagnosis",
    priority: "high",
    estimatedTime: 20,
    completed: false,
    checklist: [
      "Review application logs for errors/warnings",
      "Check database slow query logs",
      "Analyze network packet captures if applicable",
      "Review recent code changes (git diff)",
      "Identify the actual bug/misconfiguration",
      "Verify hypothesis with data (proof!)",
    ],
    completedItems: 0,
  },
  {
    id: "diag-2",
    title: "Quantify the impact",
    description: "How many users affected? What's the revenue impact? How long can we survive?",
    category: "diagnosis",
    priority: "high",
    estimatedTime: 10,
    completed: false,
    checklist: [
      "Calculate affected user count from analytics",
      "Determine revenue loss per minute",
      "Check SLA impact and penalty exposure",
      "Note any data at risk (integrity, confidentiality)",
      "Communicate impact to exec team",
    ],
    completedItems: 0,
  },
  {
    id: "miti-1",
    title: "Implement immediate fix",
    description: "Deploy the shortest path to restore service. Speed > Perfect.",
    category: "mitigation",
    priority: "high",
    estimatedTime: 15,
    completed: false,
    checklist: [
      "Create fix in feature branch",
      "Test fix locally and in staging",
      "Get code review (optional during SEV-1)",
      "Deploy fix to production",
      "Monitor metrics to confirm recovery",
    ],
    completedItems: 0,
  },
  {
    id: "miti-2",
    title: "Optional: Deploy band-aid mitigation",
    description:
      "If fix takes >30 min, deploy temporary mitigation (circuit breaker, traffic shedding, etc.)",
    category: "mitigation",
    priority: "medium",
    estimatedTime: 10,
    completed: false,
    checklist: [
      "Identify temporary workaround (don't fix root cause yet)",
      "Deploy feature flag or config change",
      "Gradual rollout to reduce risk",
      "Monitor side effects",
      "Plan permanent fix for later",
    ],
    completedItems: 0,
  },
  {
    id: "res-1",
    title: "Verify full recovery",
    description: "Confirm all metrics are back to baseline. No lingering issues.",
    category: "resolution",
    priority: "high",
    estimatedTime: 10,
    completed: false,
    checklist: [
      "API latency back to baseline",
      "Error rate < 0.1%",
      "Database CPU < 60%",
      "All regions recovered",
      "Customer complaints stopped",
    ],
    completedItems: 0,
  },
  {
    id: "res-2",
    title: "Conduct blameless post-mortem",
    description: "Learn from incident: what went wrong, how do we prevent it?",
    category: "resolution",
    priority: "medium",
    estimatedTime: 30,
    completed: false,
    checklist: [
      "Document what happened (timeline)",
      "Explain why it happened (root cause)",
      "Identify contributing factors",
      "List action items to prevent recurrence",
      "Schedule follow-up review in 2 weeks",
    ],
    completedItems: 0,
  },
];

const categoryLabels = {
  detection: "🔍 Detection",
  diagnosis: "🔬 Diagnosis",
  mitigation: "🛠️ Mitigation",
  resolution: "✅ Resolution",
};

const categoryColors = {
  detection: "bg-blue-900/20 border-blue-700",
  diagnosis: "bg-purple-900/20 border-purple-700",
  mitigation: "bg-orange-900/20 border-orange-700",
  resolution: "bg-green-900/20 border-green-700",
};

export default function AlignedTaskBoard({
  scenarioId = "test",
  requirements = defaultRequirements,
  onTaskComplete,
  phase = "detection",
}: TaskBoardProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});

  const getTasksByCategory = (category: string) =>
    requirements.filter((t) => t.category === category);

  const isTaskRelevant = (taskCategory: string) => {
    const phaseMap = {
      detection: ["detection"],
      investigation: ["detection", "diagnosis"],
      mitigation: ["detection", "diagnosis", "mitigation"],
      resolution: ["detection", "diagnosis", "mitigation", "resolution"],
    };
    return phaseMap[phase as keyof typeof phaseMap]?.includes(taskCategory);
  };

  const updateTaskProgress = (taskId: string, completed: number) => {
    setTaskProgress((prev) => ({
      ...prev,
      [taskId]: completed,
    }));
  };

  const renderTaskCategory = (category: string) => {
    const tasks = getTasksByCategory(category);
    if (tasks.length === 0) return null;

    const relevantTasks = tasks.filter((t) => isTaskRelevant(category));
    if (relevantTasks.length === 0) return null;

    return (
      <div
        key={category}
        className={`border rounded-lg overflow-hidden ${categoryColors[category as keyof typeof categoryColors]}`}
      >
        {/* Category Header */}
        <div className="bg-slate-800/30 px-3 py-2 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-slate-200">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded">
              {relevantTasks.filter((t) => t.completed).length}/{relevantTasks.length}
            </span>
          </div>
          {isTaskRelevant(category) && (
            <p className="text-xs text-slate-400 mt-1">Complete these to progress the incident</p>
          )}
        </div>

        {/* Tasks */}
        <div className="divide-y divide-slate-700/30">
          {relevantTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-slate-800/20 ${
                task.completed ? "opacity-60" : ""
              }`}
              onClick={() =>
                setExpandedTask(expandedTask === task.id ? null : task.id)
              }
            >
              {/* Task Header */}
              <div className="flex items-start gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newCompleted = !task.completed;
                    onTaskComplete?.(task.id);
                  }}
                  className="flex-shrink-0 mt-0.5"
                >
                  {task.completed ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm text-slate-200 ${
                      task.completed ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>

                  {/* Priority + Time Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === "high"
                          ? "bg-red-900/30 text-red-300"
                          : task.priority === "medium"
                            ? "bg-yellow-900/30 text-yellow-300"
                            : "bg-green-900/30 text-green-300"
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {task.estimatedTime}min
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Checklist */}
              {expandedTask === task.id && task.checklist && (
                <div className="mt-3 ml-6 border-l border-slate-700/50 pl-3">
                  <p className="text-xs font-medium text-slate-300 mb-2">What to do:</p>
                  <div className="space-y-2">
                    {task.checklist.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          onChange={() => {
                            const current = taskProgress[task.id] ?? 0;
                            const newVal = current === task.checklist!.length ? 0 : current + 1;
                            updateTaskProgress(task.id, newVal);
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-slate-400 group-hover:text-slate-300">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="bg-slate-800 rounded h-2 overflow-hidden">
                      <div
                        className="bg-green-600 h-full transition-all"
                        style={{
                          width: `${
                            task.checklist.length > 0
                              ? ((taskProgress[task.id] ?? 0) / task.checklist.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {taskProgress[task.id] ?? 0}/{task.checklist.length} sub-tasks
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-slate-200">Task Alignment</span>
        </div>
        <p className="text-xs text-slate-400">
          These tasks are automatically pulled from the scenario requirements. Complete them to
          resolve the incident.
        </p>
      </div>

      {/* Phase Info */}
      <div className="bg-slate-800/30 px-4 py-2 border-b border-slate-800/50 text-xs">
        <span className="text-slate-400">Current Phase: </span>
        <span className="font-medium text-slate-300 uppercase">{phase}</span>
      </div>

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {renderTaskCategory("detection")}
        {renderTaskCategory("diagnosis")}
        {renderTaskCategory("mitigation")}
        {renderTaskCategory("resolution")}
      </div>

      {/* Footer */}
      <div className="bg-slate-900/50 border-t border-slate-800 px-4 py-2 text-xs text-slate-400 flex justify-between">
        <span>
          Completed:{" "}
          <span className="text-green-400 font-medium">
            {requirements.filter((t) => t.completed).length}/{requirements.length}
          </span>
        </span>
        <span>Click task to see checklist</span>
      </div>
    </div>
  );
}
