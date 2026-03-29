"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, LayoutDashboard, MessageSquare, AlertCircle, ShieldCheck, Zap, Briefcase, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import ForgeTerminal from '@/components/ForgeTerminal';
import TeamPanel from '@/components/TeamPanel';
import TaskBoard from '@/components/TaskBoard';
import ImpactAnalyzer from '@/components/ImpactAnalyzer';
import CodeSubmission from '@/components/CodeSubmission';

export default function ForgeWorkstation() {
  const [mentorSpeech, setMentorSpeech] = useState("Waiting for your first move...");
  const [isLoading, setIsLoading] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(true);
  const [rightTab, setRightTab] = useState<'team' | 'impact' | 'code'>('team');

  useEffect(() => {
    const handleMessage = (e: any) => {
      setMentorSpeech(e.detail);
      setIsLoading(false);
    };
    const handleLoading = () => {
      setIsLoading(true);
    };
    
    window.addEventListener('mentor-message', handleMessage);
    window.addEventListener('mentor-loading', handleLoading);
    return () => {
      window.removeEventListener('mentor-message', handleMessage);
      window.removeEventListener('mentor-loading', handleLoading);
    };
  }, []);
  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-slate-300 font-sans overflow-hidden">
      {/* TOP SECTION: TASK/INCIDENT (PROMINENT) */}
      <div className={`border-b border-slate-800 bg-[#0F0F0F] transition-all duration-300 ${taskExpanded ? 'flex-1' : 'h-16'} overflow-hidden`}>
        <div className="p-4 h-full flex flex-col">
          {/* Header with collapse button */}
          <button
            onClick={() => setTaskExpanded(!taskExpanded)}
            className="flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-orange-500" />
              <h2 className="text-sm font-bold text-slate-200">INCIDENT BOARD - INC-4029</h2>
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded">P0 CRITICAL</span>
            </div>
            <div className="text-slate-500">
              {taskExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {/* Task content - only visible when expanded */}
          {taskExpanded && (
            <div className="flex-1 overflow-y-auto pr-2">
              <TaskBoard />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Terminal + Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Terminal (60%) */}
        <div className="flex-1 border-r border-slate-800 flex flex-col">
          <header className="h-12 border-b border-slate-800 bg-[#0F0F0F] flex items-center px-4 justify-between">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1 text-green-500">
                <Terminal size={14} /> workstation-terminal
              </span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded font-bold uppercase tracking-wider">
              Debug Tools
            </button>
          </header>

          {/* THE ACTUAL TERMINAL */}
          <div className="flex-1 bg-black overflow-hidden">
            <ForgeTerminal />
          </div>
        </div>

        {/* RIGHT: Team + Tools (40%) */}
        <aside className="w-80 border-l border-slate-800 bg-[#0F0F0F] flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => setRightTab('team')}
              className={`flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
                rightTab === 'team'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <MessageSquare size={12} /> Team
            </button>
            <button
              onClick={() => setRightTab('impact')}
              className={`flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
                rightTab === 'impact'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <LayoutDashboard size={12} /> Impact
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
                rightTab === 'code'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <GitBranch size={12} /> Code
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightTab === 'team' && <TeamPanel />}
            {rightTab === 'impact' && <ImpactAnalyzer />}
            {rightTab === 'code' && <CodeSubmission />}
          </div>

          {/* Mentor Box - Always visible at bottom */}
          <div className="border-t border-slate-800 p-3 bg-slate-900/30">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Senior Mentorship</h4>
            <div
              className={`text-xs leading-relaxed p-3 rounded border-2 transition-all duration-300 ${
                isLoading
                  ? 'bg-blue-500/10 border-blue-500/40 animate-pulse'
                  : 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-blue-500/20 hover:border-blue-500/40 animate-glow-pulse'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-blue-400 animate-spin" />
                  <span className="text-slate-300">Thinking...</span>
                </div>
              ) : (
                <p className="text-slate-300">"{mentorSpeech}"</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}