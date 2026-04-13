"use client";

import { useState } from "react";
import ImprovedForgeTerminal from "./ImprovedForgeTerminal";
import AITeamAgents from "./AITeamAgents";
import AlignedTaskBoard from "./AlignedTaskBoard";
import ImprovedImpactAnalyzer from "./ImprovedImpactAnalyzer";
import GitHubInterface from "./GitHubInterface";
import { X, ChevronRight, Menu, GitPullRequest } from "lucide-react";

interface ForgeWorkstationProps {
  scenarioId?: string;
  scenarioTitle?: string;
  scenarioContext?: string;
  allocatedTime?: number;
  startTime?: number;
  onExit?: () => void;
  requirements?: string[];
  initialFiles?: Record<string, string>;
  expectedSolution?: {
    description: string;
    keyPatterns: string[];
  };
  onSubmit?: (notes: string) => void;
  isSubmitting?: boolean;
}

export default function ForgeWorkstation({
  scenarioId = "",
  scenarioTitle = "Forge Workstation",
  scenarioContext = "",
  allocatedTime = 0,
  startTime = 0,
  onExit = () => {},
  requirements = [],
  initialFiles = {},
  expectedSolution,
  onSubmit = () => {},
  isSubmitting = false,
}: ForgeWorkstationProps = {}) {
  const [activeLeftTab, setActiveLeftTab] = useState<"terminal" | "tasks" | "impact" | "repository">("terminal");
  const [showTeamSidebar, setShowTeamSidebar] = useState(true);
  const [showSubmission, setShowSubmission] = useState(true);
  const [pushedCommits, setPushedCommits] = useState<any[]>([]);

  const handleGitPush = (commit: { message: string, files: string[] }) => {
    const newCommit = {
      id: `usr-${Date.now()}`,
      author: "you@company.com",
      message: commit.message,
      hash: Math.random().toString(16).substring(2, 9),
      timestamp: new Date(),
      files: commit.files,
      safety: "safe"
    };
    setPushedCommits(prev => [...prev, newCommit]);
    // Notify team
    // optionally we could switch to repos automatically or add a banner
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-white font-semibold">{scenarioTitle}</h2>
          {scenarioContext && <p className="text-sm text-slate-400 mt-1">{scenarioContext.substring(0, 100)}...</p>}
        </div>
        <button
          onClick={onExit}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Exit scenario"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Terminal/Workspace */}
        <div className="flex-1 border-r border-slate-800 flex flex-col">
          {activeLeftTab === "terminal" && (
            <ImprovedForgeTerminal
              scenarioId={scenarioId}
              initialFiles={initialFiles}
              expectedSolution={expectedSolution}
              requirements={requirements}
              onSubmit={(files) => {
                onSubmit(JSON.stringify(files, null, 2));
              }}
              onGitPush={handleGitPush}
            />
          )}
          {activeLeftTab === "tasks" && <AlignedTaskBoard scenarioId={scenarioId} />}
          {activeLeftTab === "impact" && <ImprovedImpactAnalyzer scenarioId={scenarioId} />}
          {activeLeftTab === "repository" && (
            <div className="h-full bg-slate-950 p-4 overflow-y-auto">
              <h3 className="text-white text-lg font-medium mb-4 flex items-center gap-2">
                <GitPullRequest size={20} className="text-purple-400" />
                Repository & Code Review
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                This is where you review commits that might have caused the incident, and submit your final Pull Request to resolve it.
              </p>
              <GitHubInterface 
                branch="main" 
                pushedCommits={pushedCommits}
                commits={[
                  ...pushedCommits,
                  {
                    id: "c1",
                    author: "alice@company.com",
                    message: "Update dependency versions",
                    hash: "a1b2c3d",
                    timestamp: new Date(Date.now() - 3600000),
                    files: ["package.json", "package-lock.json"],
                    safety: "risky"
                  },
                  {
                    id: "c2",
                    author: "bob@company.com",
                    message: "Refactor database connection pool",
                    hash: "e4f5g6h",
                    timestamp: new Date(Date.now() - 7200000),
                    files: ["src/db/connection.ts"],
                    safety: "critical"
                  }
                ]}
              />
              <div className="mt-8 bg-slate-900 border border-slate-700/50 p-6 rounded-lg">
                <h4 className="text-white font-medium mb-4">Complete Scenario</h4>
                <p className="text-sm text-slate-400 mb-4">
                  When you have fixed the issue using the terminal, you must push your commits, open a Pull Request, and get it approved by the Senior Engineer to finish.
                </p>
                <button 
                  onClick={() => onSubmit("Resolved via Pull Request creation.")}
                  disabled={isSubmitting} // Can also disable if not approved
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <GitPullRequest size={16} /> 
                  {isSubmitting ? "Merging..." : "Merge Fix & Finish Scenario"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Team */}
        {showTeamSidebar && (
          <div className="w-96 border-l border-slate-800 flex flex-col">
            <AITeamAgents scenarioId={scenarioId} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-slate-800 bg-slate-800/50 p-4 flex gap-2">
        <button
          onClick={() => setActiveLeftTab("terminal")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeLeftTab === "terminal"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => setActiveLeftTab("tasks")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeLeftTab === "tasks"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveLeftTab("impact")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeLeftTab === "impact"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Impact
        </button>
        <button
          onClick={() => setActiveLeftTab("repository")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeLeftTab === "repository"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <GitPullRequest size={16} /> Repository / PR
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowTeamSidebar(!showTeamSidebar)}
          className="px-4 py-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
        >
          {showTeamSidebar ? "Hide" : "Show"} Team
        </button>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Exit Scenario
        </button>
      </div>
    </div>
  );
}
