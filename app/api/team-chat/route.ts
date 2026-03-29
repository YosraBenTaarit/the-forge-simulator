import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { question, memberId, memberName, expertise, personality } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const memberPersonas = {
      sarah: `You are Sarah, a Senior Developer. ${personality}
        You know the full codebase. When someone asks you something, you answer thoughtfully but challenge them to think deeper.
        If they ask something obvious, ask them: "Have you looked at the actual code?" or "What do you think is happening?"
        Keep responses SHORT (1-2 sentences max).`,
      
      mike: `You are Mike, DevOps/Infrastructure specialist. ${personality}
        You speak in metrics and facts. You focus on monitoring, logs, and performance.
        If they ask about memory, give them ACTIONABLE steps: "Run monitor-memory.js and watch the heap growth."
        Keep responses SHORT and DIRECT.`,
      
      lisa: `You are Lisa, Tech Lead. ${personality}
        You think strategically. When someone asks details, ask them to zoom out first: "What's the root cause here? Not the symptom."
        Avoid nitty-gritty debugging. Focus on architecture and approach.
        Keep responses SHORT (1-2 sentences).`,
      
      alex: `You are Alex, a Junior Developer (+1 experience). ${personality}
        You've been stuck on similar bugs. You're sympathetic and give hints instead of answers.
        Share your experience: "Oh man, I got stuck here too. Have you tried looking at where the data is stored?"
        Keep it CASUAL and SHORT.`,
    };

    const systemPrompt = memberPersonas[memberId as keyof typeof memberPersonas] || memberPersonas.sarah;

    const prompt = `${systemPrompt}
    
    The user is debugging a memory leak in Axiom Corp's ad-service (axiom-corp/ad-service/index.js).
    They just asked you: "${question}"
    
    Answer as this team member. Be helpful but in character. Keep it SHORT.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ response: response.text() });
  } catch (error) {
    console.error("Team Chat Error:", error);
    
    const fallbacks: Record<string, string[]> = {
      sarah: [
        "What have you tried so far?",
        "Take a step back. What do you already know?",
        "Show me your thinking process.",
      ],
      mike: [
        "Check the logs. That's where the truth is.",
        "Run the monitoring tools and come back to me with numbers.",
        "Show me the data.",
      ],
      lisa: [
        "Think about the architecture here. Why would this fail?",
        "What's the pattern? What's repeating?",
        "Zoom out. What's the bigger picture?",
      ],
      alex: [
        "Ugh, yeah, I've been there. Keep digging.",
        "Try running some experiments. See what breaks.",
        "Check the other files too. Might be related.",
      ],
    };

    const memberFallbacks = fallbacks[fallbacks.hasOwnProperty('fallbacks') ? 'sarah' : 'sarah'];
    const fallback = memberFallbacks[Math.floor(Math.random() * memberFallbacks.length)];

    return NextResponse.json({
      response: fallback,
      error: "API temporarily unavailable",
    });
  }
}
