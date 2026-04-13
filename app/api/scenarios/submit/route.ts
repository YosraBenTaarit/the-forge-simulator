import { calculateScore } from "@/lib/scoring";
import { getScenarioById } from "@/lib/scenarioStore";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { scenarioId, actualTime, notes } = body;

    if (!scenarioId || actualTime === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get scenario
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    // Calculate score
    const scoreResult = calculateScore(
      scenario.type,
      scenario.allocatedTime,
      actualTime
    );

    // In future, this would save to database
    // For now, return the result
    const result = {
      scenarioId,
      userId: session.user.email,
      allocatedTime: scenario.allocatedTime,
      actualTime,
      completed: true,
      type: scenario.type,
      score: scoreResult.score,
      bonus: scoreResult.bonus,
      totalScore: scoreResult.totalScore,
      feedback: scoreResult.feedback,
      nextRecommendation: scoreResult.nextRecommendation,
      completedAt: new Date(),
      notes: notes || "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to submit scenario:", error);
    return NextResponse.json(
      { error: "Failed to submit scenario" },
      { status: 500 }
    );
  }
}
