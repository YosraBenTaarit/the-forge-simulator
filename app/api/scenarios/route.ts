import { getScenariosByRole, getAllScenarios, getScenarioById } from "@/lib/scenarioStore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");
  const id = searchParams.get("id");
  const type = searchParams.get("type"); // normal, incident, postmortem

  try {
    if (id) {
      // Get specific scenario
      const scenario = getScenarioById(id);
      if (!scenario) {
        return NextResponse.json(
          { error: "Scenario not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(scenario);
    }

    if (role) {
      // Get scenarios by role
      let scenarios = getScenariosByRole(role);
      
      // Filter by type if specified
      if (type) {
        scenarios = scenarios.filter((s) => s.type === type);
      }
      
      return NextResponse.json(scenarios);
    }

    // Get all scenarios
    const allScenarios = getAllScenarios();
    return NextResponse.json(allScenarios);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}
