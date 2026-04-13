#!/usr/bin/env node

/**
 * Database seeding script for The Forge Simulator
 * Adds demo user and scenario data for testing
 */

import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create demo user
  const demoPassword = await bcrypt.hash("demo1234", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@forge.dev" },
    update: {},
    create: {
      email: "demo@forge.dev",
      name: "Demo User",
      password: demoPassword,
      role: "none",
    },
  });
  console.log(`✓ Demo user: ${demoUser.email}`);

  // Seed scenarios
  const scenarios = [
    {
      id: "inc-4029",
      title: "Memory Leak in Ad-Service",
      description: "Fix a critical memory leak causing service crashes",
      category: "backend-swe",
      difficulty: "junior",
      timeLimit: 240,
      storyPoints: 5,
      problemStatement:
        "The ad-service is consuming unlimited memory and crashing after ~1 hour, blocking 10% of users from checkout",
      requirements: JSON.stringify([
        "Identify source of memory accumulation",
        "Implement cleanup mechanism",
        "Verify memory stays <512MB",
        "Add monitoring",
      ]),
      acceptanceCriteria: JSON.stringify([
        "Service runs 1+ hour without crash",
        "Heap memory stable (<512MB)",
        "Code reviewed and approved",
        "Tests validate fix",
      ]),
      affectedUsers: "North America, ~150K users, checkout blocked",
      estimatedImpact: "$50K/hour",
      severity: "CRITICAL",
    },
  ];

  for (const scenario of scenarios) {
    const created = await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {},
      create: scenario,
    });
    console.log(`✓ Scenario: ${created.title}`);
  }

  console.log("\n✅ Database seeded successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
