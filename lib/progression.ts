/**
 * Scenario progression and mastery tracking
 * Tracks which scenarios user has completed and at what difficulty level
 */

export interface ProgressionStats {
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
  mastery: "junior" | "mid" | "senior" | "expert";
  canAccessMid: boolean;
  canAccessSenior: boolean;
}

export interface ScenarioCompletion {
  scenarioId: string;
  score: number;
  completedAt: Date;
  timeSpent: number; // seconds
}

/**
 * Determine if user meets progression requirements
 * - Must complete 3+ junior tasks before accessing mid
 * - Must complete 3+ mid tasks before accessing senior
 * - Always allow 1 mid and 1 senior task even without prerequisites (for exploration)
 */
export function canAccessScenario(
  difficulty: "junior" | "mid" | "senior",
  stats: ProgressionStats,
  totalTriedInDifficulty: number
): boolean {
  if (difficulty === "junior") return true;

  if (difficulty === "mid") {
    // Can access if: 3+ junior completed OR this is their 1st mid attempt
    return stats.completed.junior >= 3 || totalTriedInDifficulty < 1;
  }

  if (difficulty === "senior") {
    // Can access if: 3+ mid completed OR this is their 1st senior attempt
    return stats.completed.mid >= 3 || totalTriedInDifficulty < 1;
  }

  return false;
}

/**
 * Map completion counts to mastery level
 */
export function getMasteryLevel(stats: ProgressionStats): "junior" | "mid" | "senior" | "expert" {
  if (stats.completed.senior >= 3) return "expert";
  if (stats.completed.mid >= 3) return "senior";
  if (stats.completed.junior >= 3) return "mid";
  return "junior";
}

/**
 * Generate progression message based on stats
 */
export function getProgressionMessage(stats: ProgressionStats, difficulty: "junior" | "mid" | "senior"): string {
  const mastery = getMasteryLevel(stats);

  if (difficulty === "junior") {
    if (stats.completed.junior < 3) {
      return `${stats.completed.junior}/3 junior tasks complete. Keep building fundamentals!`;
    }
    return `Junior mastery achieved! Ready for mid-level challenges.`;
  }

  if (difficulty === "mid") {
    if (stats.completed.junior < 3) {
      return `⭐ Trying a mid-level task (preview). Complete 3 junior tasks to unlock officially.`;
    }
    if (stats.completed.mid < 3) {
      return `${stats.completed.mid}/3 mid tasks complete. Progressing well!`;
    }
    return `Mid-level mastery achieved! Ready for senior challenges.`;
  }

  if (difficulty === "senior") {
    if (stats.completed.mid < 3) {
      return `⭐ Trying a senior task (preview). Complete 3 mid tasks to unlock officially.`;
    }
    if (stats.completed.senior < 3) {
      return `${stats.completed.senior}/3 senior tasks complete. Expert level!`;
    }
    return `Expert mastery achieved! You're ready to mentor others.`;
  }

  return "";
}
