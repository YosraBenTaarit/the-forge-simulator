"use client";

import { currentTask } from '@/lib/tasks';
import { AlertCircle, CheckCircle, Clock, Users, TrendingDown } from 'lucide-react';

export default function TaskBoard() {
  const statusColors = {
    'todo': 'bg-slate-900/50 border-slate-700',
    'in-progress': 'bg-blue-900/50 border-blue-700',
    'in-review': 'bg-yellow-900/50 border-yellow-700',
    'done': 'bg-green-900/50 border-green-700',
  };

  const priorityColors = {
    'p0': 'bg-red-500/20 text-red-400 border border-red-500/50',
    'p1': 'bg-orange-500/20 text-orange-400 border border-orange-500/50',
    'p2': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    'p3': 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Task</h3>
        
        <div className={`rounded-lg border-2 p-4 ${statusColors[currentTask.status as keyof typeof statusColors]}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-orange-400">{currentTask.id}</span>
                <span className={`text-xs px-2 py-1 rounded ${priorityColors[currentTask.priority]}`}>
                  {currentTask.priority.toUpperCase()}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-200">{currentTask.title}</h2>
            </div>
            {currentTask.priority === 'p0' && (
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {currentTask.description}
          </p>

          {/* Impact Section */}
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-4">
            <div className="flex gap-2 text-xs text-red-400 mb-2">
              <TrendingDown size={14} />
              <span className="font-semibold">BUSINESS IMPACT</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>• <span className="font-semibold">Affected Users:</span> {currentTask.affectedUsers}</div>
              <div>• <span className="font-semibold">Revenue Loss:</span> {currentTask.artifacts.estimatedImpact}</div>
              <div>• <span className="font-semibold">Severity:</span> {currentTask.impact}</div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Requirements</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              {currentTask.requirements.map((req, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Acceptance Criteria */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Acceptance Criteria</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              {currentTask.acceptanceCriteria.map((ac, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  {ac}
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/50 text-xs">
            <div>
              <span className="text-slate-500">Story Points:</span>
              <span className="text-slate-300 ml-2">{currentTask.storyPoints}</span>
            </div>
            <div>
              <span className="text-slate-500">Assignee:</span>
              <span className="text-slate-300 ml-2">{currentTask.assignee}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <span className="text-blue-400 ml-2 capitalize">{currentTask.status.replace('-', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-500">Due:</span>
              <span className="text-slate-300 ml-2">{currentTask.dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
