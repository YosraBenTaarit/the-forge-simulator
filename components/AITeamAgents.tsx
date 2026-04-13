"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Users, ChevronDown, User } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: "IC" | "Ops" | "Comms" | "Planning" | "Engineer" | "Senior Engineer";
  expertise: string[];
  avatar: string; // Color/emoji
}

interface Message {
  memberId: string;
  memberName: string;
  role: string;
  timestamp: Date;
  message: string;
  type: "status" | "question" | "suggestion" | "update" | "review";
  channel: string; // "global" | "alice" | "bob" | "carol" | "david"
}

interface AITeamAgentProps {
  scenarioId?: string;
  incident?: {
    title: string;
    severity: string;
    status: "active" | "investigating" | "mitigating" | "resolved";
    timeline: Array<{ time: string; event: string }>;
  };
  onDecisionNeeded?: (question: string, options: string[]) => void;
  userDecisions?: Array<{ question: string; answer: string }>;
}

const teamMembers: TeamMember[] = [
  {
    id: "alice",
    name: "Alice Chen",
    role: "IC",
    expertise: ["incident-command", "communication", "decision-making"],
    avatar: "👩‍💼",
  },
  {
    id: "bob",
    name: "Bob Martinez",
    role: "Ops",
    expertise: ["deployment", "runbooks", "system-recovery"],
    avatar: "👨‍🔧",
  },
  {
    id: "carol",
    name: "Carol Johnson",
    role: "Comms",
    expertise: ["customer-communication", "status-updates", "transparency"],
    avatar: "👩‍💻",
  },
  {
    id: "david",
    name: "David Kumar",
    role: "Senior Engineer",
    expertise: ["capacity", "resource-allocation", "code-review"],
    avatar: "👨‍📊",
  },
];

// Different response patterns to avoid repetition
const responsePatterns = {
  initial: [
    "I'm seeing this too. Let me gather more context.",
    "This is critical. What's our current status?",
    "Acknowledged. I'm monitoring the situation.",
  ],
  diagnosis: [
    "The logs suggest we should look at...",
    "Based on the metrics, it appears...",
    "I'm seeing a pattern in the error logs...",
  ],
  suggestion: [
    "I recommend we...",
    "A good next step would be to...",
    "Let's try...",
  ],
  question: [
    "Do you need me to...",
    "Should we consider...",
    "What if we tried...",
  ],
  update: [
    "Status update: ...",
    "Current state: ...",
    "Latest info: ...",
  ],
};

export default function AITeamAgents({
  scenarioId,
  incident,
  onDecisionNeeded,
  userDecisions = [],
}: AITeamAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("global");
  const [currentPhase, setCurrentPhase] = useState<"detection" | "investigation" | "mitigation" | "resolution">(
    "detection"
  );
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [responseIndex, setResponseIndex] = useState<Record<string, number>>({});
  const [userInput, setUserInput] = useState("");

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChannel]);

  // Start scenario with initial team responses
  useEffect(() => {
    const title = incident?.title || "Unknown Incident";
    const severity = incident?.severity || "SEV-2";

    const initialMessages: Message[] = [
      {
        memberId: "alice",
        memberName: "Alice Chen",
        role: "IC",
        timestamp: new Date(),
        message: `Incident declared: ${title}. Severity: ${severity}. I'm assuming Incident Commander role. Everyone, sync in the incident channel.`,
        type: "status",
        channel: "global",
      },
      {
        memberId: "bob",
        memberName: "Bob Martinez",
        role: "Ops",
        timestamp: new Date(Date.now() + 2000),
        message: "Attached to incident. Monitoring dashboards. What's our decision on mitigation strategy?",
        type: "question",
        channel: "global",
      },
      {
        memberId: "carol",
        memberName: "Carol Johnson",
        role: "Comms",
        timestamp: new Date(Date.now() + 4000),
        message:
          "Comms lead here. Drafting initial status update for customers. Alice, what timeline should I communicate?",
        type: "question",
        channel: "global",
      },
    ];

    setMessages(initialMessages);
  }, [incident]);

  // Generate contextual responses as scenario progresses
  const generateTeamResponse = (
    context: string,
    phase: "detection" | "investigation" | "mitigation" | "resolution"
  ) => {
    const member = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    const patterns = responsePatterns as Record<string, string[]>;
    const phaseKey = phase === "detection" ? "initial" : phase === "investigation" ? "diagnosis" : "suggestion";
    const patternList = patterns[phaseKey] || patterns.initial;

    // Get next response index for this member to avoid repetition
    const key = `${member.id}-${phaseKey}`;
    const idx = (responseIndex[key] || 0) % patternList.length;
    setResponseIndex((prev) => ({ ...prev, [key]: idx + 1 }));

    const selectedPattern = patternList[idx];

    const contextMessages: Record<string, string[]> = {
      detection: [
        "Users are reporting slowness. Checking error logs...",
        "Monitoring shows elevated latency. Investigating root cause.",
        "Database metrics show unusual activity. Need to escalate?",
      ],
      investigation: [
        "Found potential issue in the logs. Pattern suggests...",
        "Comparing this to previous incidents... similar characteristics.",
        "Metrics point to resource exhaustion. Where?",
      ],
      mitigation: [
        "The fix is ready for deployment. Approval?",
        "I can implement a quick workaround while we diagnose deeper.",
        "Scaling up resources should help. Checking capacity...",
      ],
      resolution: [
        "Metrics returning to normal. Still monitoring.",
        "Users reporting issues resolved. Excellent work, team.",
        "We should start postmortem analysis once stable.",
      ],
    };

    const contextList = contextMessages[phase] || contextMessages.detection;
    const contextMsg = contextList[Math.floor(Math.random() * contextList.length)];

    return `${selectedPattern} ${contextMsg}`;
  };

  // Add team response to incident
  const handleTeamResponse = (decision?: string) => {
    if (messages.length < 4) return; // Let initial messages display first

    setTimeout(() => {
      const idx = Math.floor(Math.random() * 4);
      const member = teamMembers[idx];
      const newMessage: Message = {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        timestamp: new Date(),
        message: generateTeamResponse(decision || `Phase: ${currentPhase}`, currentPhase),
        type: currentPhase === "detection" ? "status" : "suggestion",
        channel: "global",
      };

      setMessages((prev) => [...prev, newMessage]);
    }, 1500);
  };

  // Simulate team activity as phase changes
  useEffect(() => {
    handleTeamResponse();
  }, [currentPhase]);

  const handleUserMessageMatch = (msg: string) => {
    const text = msg.toLowerCase();
    
    // Determine which team member should answer depending on keywords or active channel
    let responder = teamMembers[0]; // Default alice
    
    if (activeChannel !== "global") {
      responder = teamMembers.find(m => m.id === activeChannel) || teamMembers[0];
    } else {
      if (text.includes("deploy") || text.includes("database") || text.includes("server") || text.includes("log") || text.includes("metrics") || text.includes("error")) responder = teamMembers[1]; // Bob
      else if (text.includes("customer") || text.includes("tweet") || text.includes("user") || text.includes("comms")) responder = teamMembers[2]; // Carol
      else if (text.includes("capacity") || text.includes("region") || text.includes("cost") || text.includes("review") || text.includes("pr") || text.includes("code") || text.includes("github")) responder = teamMembers[3]; // David
    }

    let response = "";

    // 1. Intent: Greetings / Getting Started / Confusion
    if (text.match(/^(hi|hello|hey|yo)\b/) || text.includes("what to do") || text.includes("help") || text.includes("explain")) {
      if (responder.id === "alice") response = "Hi there. As IC, I need you to investigate the root cause. Go to the terminal, check the logs or recent commits, and find what broke the system. Let me know when you have a thesis.";
      else if (responder.id === "bob") response = "Hey. While you investigate the code, I'm keeping an eye on the infrastructure. Let me know if you need to rollback a specific deployment or check DB logs.";
      else if (responder.id === "carol") response = "Hello! Please find the issue fast; I have customers asking for an ETA on the fix.";
      else if (responder.id === "david") response = "Hi. Check the previous PRs in the Repository tab if you're stuck. Once you find the problem, push a fix and open a PR. I'll review it.";
    } 
    // 2. Intent: Code Review / PRs
    else if (text.includes("review") || text.includes("pr ") || text.includes("pull request") || text.includes("merge")) {
      if (responder.id === "david") response = "I'm ready for the review. Open the PR in the Repository tab, make sure your commit message explains the root cause, and I'll approve it if the code is correct.";
      else response = "David is the best person to review your PR. Ping him when it's ready.";
    }
    // 3. Intent: Logs / Database / Metrics / Terminal
    else if (text.includes("log") || text.includes("error") || text.includes("db") || text.includes("database") || text.includes("terminal") || text.includes("code")) {
      if (responder.id === "bob") response = "I'm seeing a spike in the error rate correlated with the last deployment. Have you checked the stack trace in the terminal yet? Use 'cat' or 'nano' on the affected files.";
      else if (responder.id === "alice") response = "Bob is looking at the overall metrics, but we need you to find the specific error in the code. What do the logs in the terminal say?";
      else response = "I'll let Ops handle the database metrics. Keep me updated on the user impact.";
    }
    // 4. Intent: Status / Updates
    else if (text.includes("status") || text.includes("update") || text.includes("timeline")) {
      if (responder.id === "carol") response = "Currently, our user success rate has dropped significantly. I'm telling customers we are 'actively investigating'. Need an ETA soon.";
      else if (responder.id === "alice") response = "Status is SEV-2, active investigation. We haven't identified the root cause yet. Keep digging.";
      else response = "Still observing degraded performance. We need a mitigation strategy quickly.";
    }
    // 5. Intent: Specific technical keywords related to DevOps / scenarios
    else if (text.includes("latency") || text.includes("timeout") || text.includes("memory") || text.includes("leak") || text.includes("cpu")) {
      if (responder.id === "bob") response = "Those symptoms usually point to a misconfiguration in the recent deployment or an exhausted connection pool. Start by checking the 'src' or 'config' files in the terminal.";
      else response = `That's concerning. Let Bob know if you need him to scale up resources while you write the patch.`;
    }
    // Default fallback (contextual by role, randomized slightly to avoid absolute repetition)
    else {
      const fbAlice = ["I'm tracking that. Please document your findings in the incident task board so we maintain visibility.", "Make sure to check the requirements list. We can't close the incident without fulfilling them.", "Understood. Keep me posted on your progress in the terminal."];
      const fbBob = ["Interesting. I'll cross-reference that with Datadog/Grafana to see if I spot an anomaly.", "I'm not seeing that in my metrics yet, but I'll trust your investigation.", "I'll prepare a rollback script just in case your fix doesn't work out."];
      const fbCarol = ["Got it. I won't communicate that externally just yet, let's wait until we are 100% sure.", "Should I update the status page with this information?", "Okay, keeping my comms draft ready."];
      const fbDavid = ["Make sure your proposed fix doesn't break other services. We need to be careful with regressions.", "Have you checked how this impacts the overall architecture?", "Remember to add your changes to git and push them so I can do a proper review."];
      
      const arr = responder.id === "bob" ? fbBob : responder.id === "carol" ? fbCarol : responder.id === "david" ? fbDavid : fbAlice;
      response = arr[Math.floor(Math.random() * arr.length)];
    }

    setMessages((prev) => [
      ...prev,
      {
        memberId: responder.id,
        memberName: responder.name,
        role: responder.role,
        timestamp: new Date(),
        message: response,
        type: "update",
        channel: activeChannel, // reply in the same channel
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        memberId: "user",
        memberName: "You",
        role: "Engineer",
        timestamp: new Date(),
        message: userInput,
        type: "update",
        channel: activeChannel, // User sends message to the active channel
      },
    ]);

    const currentInput = userInput;
    setUserInput("");

    // Simulate team thinking then replying
    setTimeout(() => {
      handleUserMessageMatch(currentInput);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          <span className="text-sm font-medium">Team Coordination</span>
          <span className="text-xs text-slate-500">({messages.length} messages)</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <>
          {/* Channels / DMs */}
          <div className="bg-slate-900/40 border-b border-slate-800 flex overflow-x-auto scbar-thin">
            <button
              onClick={() => setActiveChannel("global")}
              className={`whitespace-nowrap px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeChannel === "global"
                  ? "border-purple-500 text-purple-400 bg-purple-500/10"
                  : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              # incident-main
            </button>
            {teamMembers.map(member => (
                <button
                key={member.id}
                onClick={() => setActiveChannel(member.id)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeChannel === member.id
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {member.avatar} {member.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Phase Indicator */}
          <div className="bg-slate-900/30 border-b border-slate-800 px-4 py-2">
            <div className="flex gap-2">
              {["detection", "investigation", "mitigation", "resolution"].map((phase) => (
                <button
                  key={phase}
                  onClick={() => setCurrentPhase(phase as any)}
                  className={`text-xs px-2 py-1 rounded transition-colors capitalize ${
                    currentPhase === phase
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {messages.filter(m => m.channel === activeChannel || (activeChannel === 'global' && m.channel === 'global')).map((msg, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded p-2 hover:border-slate-700">
                <div className="flex items-start gap-2">
                  <div className="text-base flex-shrink-0">
                    {msg.memberId === "user" ? "👨‍💻" : teamMembers.find((m) => m.id === msg.memberId)?.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${msg.memberId === 'user' ? 'text-blue-400' : 'text-slate-200'}`}>
                        {msg.memberName}
                        <span className="text-slate-500 ml-1">({msg.role})</span>
                      </span>
                      <span className="text-slate-600 text-xs flex-shrink-0">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions & Input */}
          <div className="border-t border-slate-800 bg-slate-900/50 px-3 py-2 flex flex-col gap-2">
            <button
              onClick={() => {
                handleTeamResponse();
              }}
              className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors"
            >
              Get Team Update
            </button>
            <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Message the team..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button 
                type="submit"
                disabled={!userInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-1.5 rounded transition-colors flex items-center justify-center content-center"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
