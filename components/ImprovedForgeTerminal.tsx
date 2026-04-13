"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Send, Download, Trash2, AlertCircle, CheckCircle, FileCode, Folder, ChevronRight, ChevronDown, Plus, X } from "lucide-react";

interface CommandResult {
  command: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

interface FileSubmission {
  filename: string;
 content: string;
  language: string;
}

interface ForgeTerminalProps {
  scenarioId?: string;
  allowedCommands?: string[];
  expectedSolution?: {
    description: string;
    keyPatterns: string[]; // What should be in the solution?
  };
  onSubmit?: (files: FileSubmission[]) => void;
  onGitPush?: (commit: { message: string; files: string[] }) => void;
  initialFiles?: Record<string, string>;
}

export default function ImprovedForgeTerminal({
  scenarioId = "test",
  allowedCommands = ["ls", "cat", "echo", "npm", "node", "python", "git", "nano"],
  expectedSolution,
  onSubmit,
  onGitPush,
  initialFiles = {},
}: ForgeTerminalProps) {
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<Map<string, string>>(new Map(Object.entries(initialFiles)));
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
  const [gitStatus, setGitStatus] = useState<"clean" | "modified" | "staged">("clean");
  const [currentDir, setCurrentDir] = useState("/workspace");
  const [submittedFiles, setSubmittedFiles] = useState<FileSubmission[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-initialize files when scenario changes
  useEffect(() => {
    setFiles(new Map(Object.entries(initialFiles)));
    setHistory([]);
    setActiveFile(null);
    setEditorContent("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    let output = "";
    let success = true;

    // Simulate command execution
    switch (command) {
      case "ls":
        output = Array.from(files.keys()).join("\n") || "(empty directory)";
        break;

      case "cat":
        if (args.length === 0) {
          output = "cat: usage: cat <filename>";
          success = false;
        } else {
          const filename = args[0];
          output = files.get(filename) || `cat: ${filename}: No such file`;
          success = !!files.get(filename);
        }
        break;

      case "echo":
        output = args.join(" ");
        break;

      case "pwd":
        output = currentDir;
        break;

      case "mkdir":
        if (args.length === 0) {
          output = "mkdir: usage: mkdir <dirname>";
          success = false;
        } else {
          output = `Created directory: ${args[0]}`;
        }
        break;

      case "touch":
        if (args.length === 0) {
          output = "touch: missing filename";
          success = false;
        } else {
          const filename = args[0];
          setFiles((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(filename)) {
              newMap.set(filename, "");
            }
            return newMap;
          });
          output = `Created: ${filename}`;
          // Also set as active file if IDE mode
          if (!activeFile) {
            setActiveFile(filename);
            setEditorContent("");
          }
        }
        break;

      case "rm":
        if (args.length === 0) {
          output = "rm: usage: rm <filename>";
          success = false;
        } else {
          const filename = args[0];
          if (files.has(filename)) {
            setFiles((prev) => {
              const newMap = new Map(prev);
              newMap.delete(filename);
              return newMap;
            });
            output = `Removed: ${filename}`;
          } else {
            output = `rm: ${filename}: No such file`;
            success = false;
          }
        }
        break;

      case "clear":
        setHistory([]);
        return;

      case "help":
        output = `Available commands:
ls           - List files
cat <file>   - Read file contents
echo <text>  - Print text
pwd          - Print working directory
mkdir <dir>  - Create directory
touch <file> - Create empty file
rm <file>    - Delete file
nano <file>  - Open file in editor (or edit <file>)
git          - git status, git add, git commit, git push
submit       - Submit solution
help         - Show this help`;
        break;

      case "nano":
      case "edit":
        if (args.length === 0) {
          output = `${command}: usage: ${command} <filename>`;
          success = false;
        } else {
          const filename = args[0];
          setGitStatus("modified");
          output = `[IDE] Opened ${filename} in editor.`;
          
          setActiveFile(filename);
          if (files.has(filename)) {
            setEditorContent(files.get(filename) || "");
          } else {
            setFiles(prev => {
              const nm = new Map(prev);
              nm.set(filename, "");
              return nm;
            });
            setEditorContent("");
          }
        }
        break;

      case "git":
        const subCmd = args[0];
        if (subCmd === "status") {
          if (gitStatus === "clean" && stagedFiles.size === 0) {
            output = "On branch main\nnothing to commit, working tree clean";
          } else if (stagedFiles.size > 0) {
            output = `On branch main\nChanges to be committed:\n${Array.from(stagedFiles).map(f => `  modified: ${f}`).join("\n")}`;
          } else {
            output = `On branch main\nChanges not staged for commit:\n${Array.from(files.keys()).map(f => `  modified: ${f}`).join("\n")}`;
          }
        } else if (subCmd === "add") {
          if (args[1] === "." || args[1] === "-A") {
            const allFiles = new Set(files.keys());
            setStagedFiles(allFiles);
            setGitStatus("staged");
            output = "";
          } else if (args[1]) {
            if (files.has(args[1])) {
              const newStaged = new Set(stagedFiles);
              newStaged.add(args[1]);
              setStagedFiles(newStaged);
              setGitStatus("staged");
              output = "";
            } else {
              output = `fatal: pathspec '${args[1]}' did not match any files`;
              success = false;
            }
          } else {
            output = "Nothing specified, nothing added.";
            success = false;
          }
        } else if (subCmd === "commit") {
          if (stagedFiles.size === 0) {
            output = "nothing to commit, working tree clean";
            success = false;
          } else {
            const msgMatch = args.join(" ").match(/-m ["'](.*?)["']/);
            const msg = msgMatch ? msgMatch[1] : "Commit changes";
            output = `[main] ${msg}\n ${stagedFiles.size} file(s) changed`;
            // Save commit state somewhere, maybe just visually.
            // Reset staging.
            setStagedFiles(new Set());
            setGitStatus("clean");
            
            // To simulate push locally
            window.sessionStorage.setItem("lastCommitMessage", msg);
            window.sessionStorage.setItem("lastCommitFiles", JSON.stringify(Array.from(stagedFiles)));
          }
        } else if (subCmd === "push") {
          const lastMsg = window.sessionStorage.getItem("lastCommitMessage");
          const lastFiles = JSON.parse(window.sessionStorage.getItem("lastCommitFiles") || "[]");
          if (lastMsg) {
            output = "Enumerating objects: 5, done.\nWriting objects: 100% (3/3), 285 bytes | 285.00 KiB/s, done.\nTo https://github.company.internal/repo\n   a1b2c3d..e4f5g6h  main -> main";
            if (onGitPush) {
              onGitPush({ message: lastMsg, files: lastFiles });
            }
            window.sessionStorage.removeItem("lastCommitMessage");
            window.sessionStorage.removeItem("lastCommitFiles");
          } else {
            output = "Everything up-to-date";
          }
        } else {
          output = "git: usage: git [status|add|commit|push]";
          success = false;
        }
        break;

      case "save":
        if (args.length < 2) {
          output = "save: usage: save <filename> <content>";
          success = false;
        } else {
          const filename = args[0];
          const content = args.slice(1).join(" ");
          setFiles((prev) => {
            const newMap = new Map(prev);
            newMap.set(filename, content);
            return newMap;
          });
          output = `Saved: ${filename}`;
        }
        break;

      case "submit":
        // Prepare submission
        const fileArray: FileSubmission[] = Array.from(files.entries()).map(
          ([name, content]) => ({
            filename: name,
            content,
            language: name.endsWith(".py")
              ? "python"
              : name.endsWith(".js")
                ? "javascript"
                : "text",
          })
        );

        if (fileArray.length === 0) {
          output = "No files to submit. Create files first!";
          success = false;
        } else {
          setSubmittedFiles(fileArray);
          output = `✓ Submitted ${fileArray.length} file(s):\n${fileArray
            .map((f) => `  - ${f.filename}`)
            .join("\n")}`;

          // Validate against expected solution
          if (expectedSolution) {
            const allContent = fileArray.map((f) => f.content).join("\n");
            const missingPatterns = expectedSolution.keyPatterns.filter(
              (pattern) => !allContent.includes(pattern)
            );

            if (missingPatterns.length === 0) {
              output += "\n✓ Solution looks good!";
              success = true;
            } else {
              output += `\n⚠ Missing patterns:\n${missingPatterns.map((p) => `  - ${p}`).join("\n")}`;
              success = false;
            }
          }

          if (onSubmit) {
            onSubmit(fileArray);
          }
        }
        break;

      default:
        if (allowedCommands.includes(command)) {
          output = `${command}: not fully implemented in demo`;
        } else {
          output = `${command}: command not found`;
          success = false;
        }
    }

    setHistory((prev) => [
      ...prev,
      {
        command: trimmed,
        output,
        timestamp: new Date(),
        success,
      },
    ]);

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      executeCommand(input);
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditorContent(newContent);
    if (activeFile) {
      setFiles(prev => {
        const m = new Map(prev);
        m.set(activeFile, newContent);
        return m;
      });
      setGitStatus("modified");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden text-[#cccccc]">
      
      {/* IDE Top Area (Explorer + Editor) */}
      <div className="flex flex-1 overflow-hidden min-h-[300px]">
        
        {/* Sidebar / File Explorer */}
        <div className="w-48 bg-[#252526] border-r border-[#333] flex flex-col">
          <div className="px-4 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto mt-2 space-y-[1px]">
            <div className="px-2 py-1 flex items-center gap-1 hover:bg-[#2a2d2e] cursor-pointer">
              <ChevronDown size={14} className="text-slate-400"/>
              <Folder size={14} className="text-blue-400" />
              <span className="text-sm font-medium text-slate-200">WORKSPACE</span>
            </div>
            {Array.from(files.keys()).map((filename) => (
              <div
                key={filename}
                onClick={() => {
                  setActiveFile(filename);
                  setEditorContent(files.get(filename) || "");
                }}
                className={`pl-8 pr-2 py-1 flex items-center gap-2 cursor-pointer text-sm transition-colors ${
                  activeFile === filename 
                    ? "bg-[#37373d] text-white" 
                    : "hover:bg-[#2a2d2e] text-slate-300"
                }`}
              >
                <FileCode size={14} className={filename.endsWith('.ts') || filename.endsWith('.json') || filename.endsWith('.js') ? "text-yellow-400" : "text-blue-400"} />
                <span className="truncate">{filename}</span>
              </div>
            ))}
            {files.size === 0 && (
              <div className="pl-8 pr-2 py-2 text-xs text-slate-500 italic">
                (empty folder)
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
          {/* Editor Tabs */}
          <div className="flex bg-[#2d2d2d] h-9 border-b border-[#1e1e1e] overflow-x-auto scbar-thin">
            {activeFile ? (
              <div className="flex items-center gap-2 bg-[#1e1e1e] px-4 py-1.5 border-t-2 border-t-purple-500 text-sm text-white min-w-[120px]">
                <FileCode size={14} className="text-yellow-400" />
                <span>{activeFile}</span>
                <div className="flex-1"></div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFile(null);
                    setEditorContent("");
                  }} 
                  className="hover:bg-[#333] p-0.5 rounded ml-2"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center px-4 text-xs text-slate-500 italic">No file open</div>
            )}
          </div>

          {/* Editor Content Area */}
          <div className="flex-1 relative">
            {activeFile ? (
              <textarea
                value={editorContent}
                onChange={handleEditorChange}
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed p-4 resize-none outline-none"
                spellCheck={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Terminal size={48} className="mx-auto text-[#333] mb-4" />
                  <p className="text-slate-500">Select a file from the explorer</p>
                  <p className="text-xs text-slate-600 mt-2">or use 'nano &lt;file&gt;' in terminal</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Area (Bottom Split) */}
      <div className="h-64 border-t border-[#333] flex flex-col bg-[#1e1e1e]">
        {/* Terminal Header */}
        <div className="flex bg-[#1e1e1e] border-b border-[#333]">
          <div className="px-4 py-1.5 border-b-2 border-green-500 text-xs font-semibold text-white uppercase tracking-wider">
            Terminal
          </div>
          <div className="flex-1 lg:flex items-center px-3 gap-3 hidden border-l border-[#333] ml-2">
            {expectedSolution && (
               <span className="text-xs text-blue-400 flex items-center gap-1">
                 <AlertCircle size={12}/> Scenario Context Active
               </span>
            )}
            {submittedFiles.length > 0 && (
               <span className="text-xs text-green-400 flex items-center gap-1">
                 <CheckCircle size={12}/> Ready to complete
               </span>
            )}
          </div>
          <div className="ml-auto pr-2 flex items-center">
            <button
              onClick={() => {
                setHistory([]);
              }}
              className="p-1.5 hover:bg-[#333] rounded transition-colors text-slate-400 hover:text-white"
              title="Clear terminal"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-sm text-[#cccccc] space-y-1"
        >
          {history.length === 0 ? (
            <div className="text-[#808080] text-xs">
              <p>Forge Workstation Integrated Terminal</p>
              <p>Type 'help' for available commands</p>
            </div>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-green-400">
                  <span className="text-blue-400">user@forge</span>:<span className="text-[#cccccc]">{currentDir}</span>$ {entry.command}
                </div>
                <div
                  className={`ml-1 whitespace-pre-wrap ${
                    entry.success ? "text-[#cccccc]" : "text-red-400"
                  }`}
                >
                  {entry.output}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Terminal Input */}
        <div className="px-3 pb-3 flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm flex-shrink-0">
            <span className="text-blue-400">user@forge</span>:<span className="text-[#cccccc]">{currentDir}</span>$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#cccccc] placeholder-[#808080] outline-none font-mono text-sm"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
