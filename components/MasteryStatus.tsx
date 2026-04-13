"use client";

import { AlertCircle, Lock, Sparkles } from "lucide-react";

interface MasteryStatusProps {
  role: string;
  completed: {
    junior: number;
    mid: number;
    senior: number;
  };
  total: {
    junior: number;
    mid: number;
    senior: number;
  };
}

export default function MasteryStatus({
  role,
  completed,
  total,
}: MasteryStatusProps) {
  const masteryLevel =
    completed.senior >= 3 ? "expert" : completed.mid >= 3 ? "senior" : completed.junior >= 3 ? "mid" : "junior";

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "expert":
        return "from-purple-500 to-pink-500";
      case "senior":
        return "from-orange-500 to-yellow-500";
      case "mid":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-green-500 to-emerald-500";
    }
  };

  const getMasteryTitle = (level: string) => {
    switch (level) {
      case "expert":
        return "🎓 Expert";
      case "senior":
        return "🏆 Senior";
      case "mid":
        return "📈 Mid-Level";
      default:
        return "🌱 Junior";
    }
  };

  return (
    <div className="space-y-4">
      {/* Mastery Badge */}
      <div className={`bg-gradient-to-r ${getMasteryColor(masteryLevel)} rounded-lg p-4 text-white`}>
        <div className="text-sm font-semibold opacity-75">Current Level</div>
        <div className="text-2xl font-bold">{getMasteryTitle(masteryLevel)}</div>
        <div className="text-xs opacity-75 mt-2">{role}</div>
      </div>

      {/* Progress by Difficulty */}
      <div className="grid grid-cols-3 gap-2">
        {/* Junior */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-400 mb-2">JUNIOR</div>
          <div className="text-2xl font-bold text-white">
            {completed.junior}
            <span className="text-xs text-slate-400">/{total.junior}</span>
          </div>
          {completed.junior >= 3 && <div className="text-xs text-green-400 mt-1">✓ Mastered</div>}
        </div>

        {/* Mid */}
        <div className={`rounded-lg p-3 ${completed.junior >= 3 ? "bg-slate-800" : "bg-slate-900/50"}`}>
          <div className={`text-xs font-semibold mb-2 ${completed.junior >= 3 ? "text-blue-400" : "text-slate-500"}`}>
            MID
          </div>
          <div className="text-2xl font-bold text-white">
            {completed.mid}
            <span className="text-xs text-slate-400">/{total.mid}</span>
          </div>
          {completed.junior < 3 && (
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Lock size={12} /> Locked
            </div>
          )}
          {completed.mid >= 3 && <div className="text-xs text-blue-400 mt-1">✓ Mastered</div>}
        </div>

        {/* Senior */}
        <div className={`rounded-lg p-3 ${completed.mid >= 3 ? "bg-slate-800" : "bg-slate-900/50"}`}>
          <div className={`text-xs font-semibold mb-2 ${completed.mid >= 3 ? "text-orange-400" : "text-slate-500"}`}>
            SENIOR
          </div>
          <div className="text-2xl font-bold text-white">
            {completed.senior}
            <span className="text-xs text-slate-400">/{total.senior}</span>
          </div>
          {completed.mid < 3 && (
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Lock size={12} /> Locked
            </div>
          )}
          {completed.senior >= 3 && <div className="text-xs text-orange-400 mt-1">✓ Expert</div>}
        </div>
      </div>

      {/* Progression Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <div className="flex gap-2 items-start">
          <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200">
            <p className="font-semibold mb-1">How Progression Works</p>
            <ul className="space-y-1 text-blue-300">
              <li>• Complete 3 junior tasks to unlock mid-level</li>
              <li>• Complete 3 mid tasks to unlock senior-level</li>
              <li>• Try 1 preview task per difficulty (for curiosity!)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
