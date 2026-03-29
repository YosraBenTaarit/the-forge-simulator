import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { command, context } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a Senior Software Engineer at Axiom Corp, mentoring a junior developer.
      They just ran this command: "${command}"
      
      Context: ${context}

      CRITICAL ISSUE: There is a memory leak in the 'ad-service' at axiom-corp/ad-service/index.js.
      The code keeps accumulating data in an array without cleaning it up.

      YOUR ROLE:
      - Be brief (1-2 sentences max).
      - Sound like a busy, experienced engineer who wants to help but is slightly impatient.
      - DO NOT give away the exact solution.
      - Give hints based on what they ran:
        * If they ran "ls", point them toward interesting files
        * If they ran "cd", acknowledge the navigation
        * If they ask about memory/processes, suggest: "Try running 'node monitor-memory.js' in the root or 'node ps.js' to see processes"
        * If they ran "node ad-service/index.js", suggest they run "node monitor-memory.js" in another terminal to watch memory grow
        * If they ran "cat" or "cat *.js", give hints about what's happening in the code
      - Suggest REAL WORKING commands: node, npm, cat, ls, cd, node -e "..."
      - In WebContainer, system tools like "top", "ps", "htop" don't exist (it's not a full OS), so suggest custom alternatives
      - If they seem lost, nudge them: "Run the service in one window and monitor-memory.js in another. Watch the heap climb."
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });
  } catch (error) {
    console.error("Mentor API Error:", error);
    
    // Fallback responses when API fails
    const fallbacks = [
      "Run the service and watch the memory grow. That's your clue.",
      "Have you checked what's actually IN the index.js file? Use cat to look.",
      "The leak is happening while the service runs. Start it and monitor it.",
      "Look at the code in ad-service/index.js. What's being stored that shouldn't be?",
    ];
    
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    return NextResponse.json({ 
      text: fallback,
      error: "API temporarily unavailable, using fallback response"
    });
  }
}
