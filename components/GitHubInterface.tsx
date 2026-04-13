"use client";

import { useState } from "react";
import { GitBranch, GitCommit, AlertCircle, Check, Clock, X } from "lucide-react";

interface Commit {
  id: string;
  author: string;
  message: string;
  hash: string;
  timestamp: Date;
  files: string[];
  safety: "safe" | "risky" | "critical";
}

interface PullRequest {
  id: number;
  title: string;
  author: string;
  status: "open" | "merged" | "closed";
  createdAt: Date;
  commits: Commit[];
  reviews: Array<{ reviewer: string; status: "approved" | "requested" | "changes" }>;
}

interface Incident {
  id: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
  title: string;
  startTime: Date;
  endTime?: Date;
  affectedServices: string[];
  relatedCommit?: string;
  status: "active" | "resolved" | "investigating";
}

interface GitHubInterfaceProps {
  commits?: Commit[];
  pullRequests?: PullRequest[];
  incidents?: Incident[];
  branch?: string;
  pushedCommits?: Commit[];
}

export default function GitHubInterface({
  commits = [],
  pullRequests = [],
  incidents = [],
  branch = "main",
  pushedCommits = [],
}: GitHubInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"commits" | "prs" | "incidents">("commits");
  const [localPRs, setLocalPRs] = useState<PullRequest[]>(pullRequests);
  const [showPRForm, setShowPRForm] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");

  const handleCreatePR = () => {
    const newPR: PullRequest = {
      id: 101, // Mock ID
      title: prTitle || "Fix for incident",
      author: "you@company.com",
      status: "open",
      createdAt: new Date(),
      commits: pushedCommits,
      reviews: [{ reviewer: "david", status: "requested" }]
    };
    setLocalPRs([newPR, ...localPRs]);
    setShowPRForm(false);
    setActiveTab("prs");

    // Simulate review completion after 3s
    setTimeout(() => {
      setLocalPRs(prs => prs.map(pr => 
        pr.id === 101 ? { 
          ...pr, 
          reviews: [{ reviewer: "david", status: "approved" }] 
        } : pr
      ));
    }, 3000);
  };

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case "safe":
        return "text-green-400 bg-green-900/20";
      case "risky":
        return "text-yellow-400 bg-yellow-900/20";
      case "critical":
        return "text-red-400 bg-red-900/20";
      default:
        return "text-slate-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "SEV-1":
        return "bg-red-900/30 border-red-600 text-red-300";
      case "SEV-2":
        return "bg-yellow-900/30 border-yellow-600 text-yellow-300";
      case "SEV-3":
        return "bg-blue-900/30 border-blue-600 text-blue-300";
      default:
        return "bg-slate-900/30 border-slate-600";
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-slate-400" />
          <span className="text-sm text-slate-400">{branch}</span>
        </div>
        <div className="text-xs text-slate-500">GitHub-like Repository View</div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/30 border-b border-slate-800 px-4 py-2 flex gap-4">
        <button
          onClick={() => setActiveTab("commits")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "commits"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Commits ({commits.length})
        </button>
        <button
          onClick={() => setActiveTab("prs")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "prs"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Pull Requests ({localPRs.length})
        </button>
        <button
          onClick={() => setActiveTab("incidents")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "incidents"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Incidents ({incidents.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {activeTab === "commits" && (
          <div className="space-y-3">
            {pushedCommits.length > 0 && !localPRs.find(pr => pr.author === "you@company.com") && (
              <div className="mb-4 bg-purple-900/20 border border-purple-800 rounded p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-purple-300 font-medium text-sm">You recently pushed {pushedCommits.length} branch(es)</h4>
                  <p className="text-xs text-purple-400/80 mt-1">Create a pull request for your changes to be reviewed by the Senior Engineer.</p>
                </div>
                <button
                  onClick={() => setShowPRForm(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  Create Pull Request
                </button>
              </div>
            )}
            
            {showPRForm && (
              <div className="mb-4 bg-slate-900/80 border border-purple-500/50 rounded p-4">
                <h4 className="text-white font-medium mb-3">Open a Pull Request</h4>
                <input 
                  type="text" 
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="PR Title (e.g. Fix: Mitigated database connection pool leak)"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 mb-3"
                />
                <textarea 
                  value={prDesc}
                  onChange={(e) => setPrDesc(e.target.value)}
                  placeholder="Describe your changes, the root cause, and how it was mitigated."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 h-24 mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setShowPRForm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreatePR}
                    disabled={!prTitle.trim()}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                  >
                    Submit PR
                  </button>
                </div>
              </div>
            )}

            {commits.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No commits yet</p>
            ) : (
              commits.map((commit) => (
                <div key={commit.id} className="bg-slate-900/40 border border-slate-800 rounded p-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <GitCommit size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">
                          {commit.hash.substring(0, 7)}
                        </code>
                        <span className={`text-xs px-2 py-0.5 rounded ${getSafetyColor(commit.safety)}`}>
                          {commit.safety.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 break-words">{commit.message}</p>
                      <div className="flex gap-2 mt-2 text-xs text-slate-400">
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.timestamp.toLocaleString()}</span>
                      </div>
                      {commit.files.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          <p className="text-xs text-slate-500 mb-1">Files changed:</p>
                          <div className="flex flex-wrap gap-1">
                            {commit.files.map((file, idx) => (
                              <code key={idx} className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                                {file}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "prs" && (
          <div className="space-y-3">
            {localPRs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No pull requests</p>
            ) : (
              localPRs.map((pr) => (
                <div key={pr.id} className="bg-slate-900/40 border border-slate-800 rounded p-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-200 break-words">#{pr.id} {pr.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{pr.author}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                        pr.status === "merged"
                          ? "bg-purple-900/30 text-purple-300"
                          : pr.status === "open"
                            ? "bg-green-900/30 text-green-300"
                            : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {pr.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">
                      {pr.commits.length} commit{pr.commits.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pr.reviews.map((review, idx) => (
                        <span key={idx} className={`text-xs px-2 py-0.5 rounded ${
                          review.status === "approved"
                            ? "bg-green-900/20 text-green-300"
                            : review.status === "changes"
                              ? "bg-red-900/20 text-red-300"
                              : "bg-yellow-900/20 text-yellow-300"
                        }`}>
                          {review.reviewer} {review.status === "approved" ? "✓" : review.status === "changes" ? "◆" : "⟳"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "incidents" && (
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No incidents</p>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`border rounded p-3 hover:border-opacity-70 transition-colors ${getSeverityColor(incident.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium break-words">{incident.title}</h4>
                        <p className="text-xs opacity-75 mt-1">{incident.severity}</p>
                      </div>
                    </div>
                    {incident.status === "resolved" && (
                      <Check size={16} className="flex-shrink-0 text-green-400" />
                    )}
                    {incident.status === "active" && (
                      <Clock size={16} className="flex-shrink-0 text-red-400 animate-spin" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs opacity-75">
                    <p>Started: {incident.startTime.toLocaleString()}</p>
                    {incident.endTime && <p>Resolved: {incident.endTime.toLocaleString()}</p>}
                    {incident.affectedServices.length > 0 && (
                      <p>Services: {incident.affectedServices.join(", ")}</p>
                    )}
                    {incident.relatedCommit && (
                      <p>Related: <code className="bg-slate-800/50 px-1 rounded">{incident.relatedCommit}</code></p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
