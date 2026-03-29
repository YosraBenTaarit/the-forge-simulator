"use client";

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { TeamMember, teamMembers } from '@/lib/team';
import TeamChat from './TeamChat';

export default function TeamPanel() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <>
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Team Members</h3>
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`w-full text-left p-2 rounded border transition-all cursor-pointer hover:bg-blue-500/20 ${
                member.status === 'available'
                  ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                  : member.status === 'busy'
                  ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
                  : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{member.avatar}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-300">{member.name}</div>
                  <div className="text-[10px] text-slate-500">{member.role}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  member.status === 'available' ? 'bg-green-500' : member.status === 'busy' ? 'bg-yellow-500' : 'bg-slate-600'
                }`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMember && (
        <TeamChat member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}
