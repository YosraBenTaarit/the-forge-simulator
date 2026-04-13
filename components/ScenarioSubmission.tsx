"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Send, AlertCircle } from "lucide-react";

interface ScenarioSubmissionProps {
  scenarioId: string;
  requirements: string[];
  onSubmit: (notes: string) => void;
  isSubmitting?: boolean;
}

export default function ScenarioSubmission({
  scenarioId,
  requirements,
  onSubmit,
  isSubmitting = false,
}: ScenarioSubmissionProps) {
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");

  const toggleItem = (index: number) => {
    const newSet = new Set(completedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCompletedItems(newSet);
  };

  const allItemsCompleted = completedItems.size === requirements.length;
  const completionPercentage = Math.round((completedItems.size / requirements.length) * 100);

  const handleSubmit = () => {
    if (allItemsCompleted || notes.trim().length > 0) {
      onSubmit(notes);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 border-l border-slate-700">
      {/* Header */}
      <div className="border-b border-slate-700 p-4">
        <h3 className="text-white font-semibold mb-2">Submit Requirements</h3>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{completedItems.size} of {requirements.length} completed</p>
      </div>

      {/* Requirements Checklist */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {requirements.map((req, idx) => {
          const isChecked = completedItems.has(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex-shrink-0 mt-0.5">
                {isChecked ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-slate-500" />
                )}
              </div>
              <p className={`text-sm ${isChecked ? "text-slate-300 line-through" : "text-slate-300"}`}>
                {req}
              </p>
            </button>
          );
        })}
      </div>

      {/* Notes Section */}
      <div className="border-t border-slate-700 p-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-400">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe your approach, decisions, or any challenges..."
          className="w-full h-24 bg-slate-700 border border-slate-600 rounded p-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!allItemsCompleted && notes.trim().length === 0)}
          className={`w-full py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isSubmitting || (!allItemsCompleted && notes.trim().length === 0)
              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Send size={16} />
          {isSubmitting ? "Submitting..." : "Submit Scenario"}
        </button>

        {/* Submission Requirements */}
        {!allItemsCompleted && notes.trim().length === 0 && (
          <div className="flex gap-2 p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
            <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">
              Complete all requirements OR write notes explaining your approach
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
