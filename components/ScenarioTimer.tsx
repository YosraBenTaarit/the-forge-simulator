"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, Zap } from "lucide-react";

interface TimerProps {
  allocatedTime: number; // minutes
  startTime: number; // timestamp
  onTimeUp: () => void;
  paused?: boolean;
}

export default function ScenarioTimer({
  allocatedTime,
  startTime,
  onTimeUp,
  paused = false,
}: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [status, setStatus] = useState<"good" | "warning" | "critical">("good");

  const allocatedSeconds = allocatedTime * 60;
  const remaining = Math.max(0, allocatedSeconds - elapsed);
  const remainingMinutes = Math.floor(remaining / 60);
  const remainingSeconds = remaining % 60;

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const newElapsed = Math.floor((now - startTime) / 1000);
      setElapsed(newElapsed);

      const newPercentage = (newElapsed / allocatedSeconds) * 100;
      setPercentage(newPercentage);

      // Status indicators
      if (newPercentage < 60) {
        setStatus("good");
      } else if (newPercentage < 85) {
        setStatus("warning");
      } else {
        setStatus("critical");
      }

      // Time's up
      if (newElapsed >= allocatedSeconds) {
        onTimeUp();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, allocatedSeconds, paused, onTimeUp]);

  const elapsedMinutes = Math.floor(elapsed / 60);
  const elapsedSeconds = elapsed % 60;

  const statusConfig = {
    good: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-300",
      bar: "bg-green-500",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-300",
      bar: "bg-yellow-500",
    },
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-300",
      bar: "bg-red-500",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      {/* Title & Icon */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className={config.text} size={18} />
        <h3 className={`font-semibold ${config.text}`}>
          {remaining > 0 ? "Time Remaining" : "Time's Up"}
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.bar} transition-all`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Time Display */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <div className={`text-2xl font-bold ${config.text}`}>
            {remainingMinutes}:{remainingSeconds.toString().padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-400 mt-1">Remaining</div>
        </div>
        <div className="text-center border-l border-r border-slate-700/50">
          <div className="text-sm text-slate-400">
            {elapsedMinutes}:{elapsedSeconds.toString().padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-500 mt-1">Elapsed</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">{allocatedTime}m</div>
          <div className="text-xs text-slate-500 mt-1">Allocated</div>
        </div>
      </div>

      {/* Status Message */}
      {status === "critical" && (
        <div className="flex items-center gap-2 text-red-300 text-sm mt-2">
          <AlertCircle size={16} />
          <span>Incident SLA at risk - time is critical!</span>
        </div>
      )}
      {status === "warning" && (
        <div className="flex items-center gap-2 text-yellow-300 text-sm mt-2">
          <Zap size={16} />
          <span>Getting close to time limit</span>
        </div>
      )}
    </div>
  );
}
