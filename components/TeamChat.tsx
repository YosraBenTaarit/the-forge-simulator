"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { TeamMember } from '@/lib/team';

interface Message {
  role: 'user' | 'team';
  text: string;
  author?: string;
}

export default function TeamChat({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'team',
      author: member.name,
      text: `Hey, I'm ${member.name}. What can I help you with? I specialize in: ${member.expertise.join(', ')}.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          memberId: member.id,
          memberName: member.name,
          expertise: member.expertise,
          personality: member.personality,
        }),
      });

      const data = await response.json();
      const teamMessage: Message = {
        role: 'team',
        author: member.name,
        text: data.response,
      };
      setMessages((prev) => [...prev, teamMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'team',
        author: member.name,
        text: 'Sorry, I\'m not available right now. Try asking someone else.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0F0F0F] border border-slate-800 rounded-lg w-full max-w-md h-[500px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{member.avatar}</span>
            <div>
              <div className="text-sm font-semibold text-slate-300">{member.name}</div>
              <div className="text-xs text-slate-500">{member.role}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-sm border border-slate-700">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 p-4 bg-slate-900/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-3 py-2 rounded transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
