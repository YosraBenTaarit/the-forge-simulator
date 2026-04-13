// Scoring system with SLA-based rewards
// Different task types have different SLA expectations

export interface ScenarioScore {
  scenarioId: string;
  userId: string;
  allocatedTime: number; // minutes
  actualTime: number; // seconds elapsed
  completed: boolean;
  type: "normal" | "incident" | "postmortem";
  score: number; // 0-100
  bonus: number; // extra points for beating SLA
  feedback: string;
  completedAt: Date;
}

export interface ScoreResult {
  score: number;
  bonus: number;
  totalScore: number;
  timeStatus: "early" | "on-time" | "late";
  feedback: string;
  nextRecommendation: string;
}

/**
 * Calculate score based on time taken vs allocated time
 * Rewards speed especially for incidents (which have SLAs)
 */
export function calculateScore(
  type: "normal" | "incident" | "postmortem",
  allocatedTimeMinutes: number,
  actualTimeSeconds: number
): ScoreResult {
  const allocatedSeconds = allocatedTimeMinutes * 60;
  const actualMinutes = actualTimeSeconds / 60;

  let score = 0;
  let bonus = 0;
  let timeStatus: "early" | "on-time" | "late" = "on-time";
  let feedback = "";
  let nextRecommendation = "";

  if (type === "incident") {
    // Incidents are urgent - SLA-based scoring
    // Reward: complete before SLA (80% of allocated time) = full points + bonus
    const slaThreshold = allocatedSeconds * 0.8; // 80% is target SLA

    if (actualTimeSeconds <= slaThreshold) {
      // Beat SLA
      timeStatus = "early";
      score = 100;
      bonus = Math.round((slaThreshold - actualTimeSeconds) / 6); // ~1 point per 6 seconds saved
      feedback = `Excellent! You resolved the incident in ${actualMinutes.toFixed(1)} minutes, well within the SLA.`;
    } else if (actualTimeSeconds <= allocatedSeconds) {
      // Within allocated time but missed SLA bonus
      timeStatus = "on-time";
      score = Math.round((allocatedSeconds / actualTimeSeconds) * 75); // 75-100 range
      feedback = `Good job. You resolved it in ${actualMinutes.toFixed(1)} minutes, though SLA was ${(slaThreshold / 60).toFixed(1)}m.`;
    } else {
      // Exceeded allocated time
      timeStatus = "late";
      score = Math.max(40, Math.round((allocatedSeconds / actualTimeSeconds) * 60)); // 40-60 range
      const overage = (actualTimeSeconds - allocatedSeconds) / 60;
      feedback = `Incident took ${overage.toFixed(1)} minutes longer than expected. Users were impacted.`;
    }

    nextRecommendation =
      score >= 90
        ? "Try the senior-level incident next"
        : "Practice delegation and faster diagnosis";
  } else if (type === "normal") {
    // Normal tasks: less time pressure, focus on quality
    const targetTime = allocatedSeconds * 0.9; // 90% is good target

    if (actualTimeSeconds <= targetTime) {
      timeStatus = "early";
      score = 100;
      feedback = `Efficient! Completed in ${actualMinutes.toFixed(1)} minutes.`;
    } else if (actualTimeSeconds <= allocatedSeconds) {
      timeStatus = "on-time";
      score = Math.round((allocatedSeconds / actualTimeSeconds) * 85);
      feedback = `On time. Code review and quality matter most here.`;
    } else {
      timeStatus = "late";
      score = Math.round((allocatedSeconds / actualTimeSeconds) * 60);
      feedback = `Took longer than expected. Time management opportunity.`;
    }

    nextRecommendation =
      score >= 85 ? "Ready for mid-level tasks" : "Practice your domain skills";
  } else {
    // Postmortems: thoughtfulness over speed
    // Postmortems are reflective - less time pressure
    const targetTime = allocatedSeconds * 1.2; // 120% is OK for thoughtful analysis

    if (actualTimeSeconds <= allocatedSeconds) {
      timeStatus = "early";
      score = 100;
      feedback = `Thorough and fast postmortem. Great analysis.`;
    } else if (actualTimeSeconds <= targetTime) {
      timeStatus = "on-time";
      score = 90;
      feedback = `Good analysis. Postmortems benefit from reflection time.`;
    } else {
      timeStatus = "late";
      score = 75;
      feedback = `Detailed postmortem. Consider shipping the initial fix faster next time.`;
    }

    nextRecommendation =
      score >= 85
        ? "You're ready to lead incident postmortems"
        : "Practice root cause analysis techniques";
  }

  const totalScore = score + bonus;

  return {
    score,
    bonus,
    totalScore,
    timeStatus,
    feedback,
    nextRecommendation,
  };
}

/**
 * Get SLA info for a scenario type
 */
export function getSLAInfo(type: "normal" | "incident" | "postmortem") {
  const slaMap = {
    incident: {
      slaDescription: "Beat the clock - resolve within 80% of allocated time",
      icon: "🚨",
      emphasis: "Speed is critical",
    },
    normal: {
      slaDescription: "Complete efficiently while maintaining quality",
      icon: "⚙️",
      emphasis: "Balance speed & quality",
    },
    postmortem: {
      slaDescription: "Thorough analysis - take time to think",
      icon: "📋",
      emphasis: "Quality & learning",
    },
  };

  return slaMap[type];
}
