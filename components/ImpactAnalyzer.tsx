"use client";

import { dependencies } from '@/lib/tasks';
import { AlertTriangle, Activity } from 'lucide-react';

export default function ImpactAnalyzer() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'degraded':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'healthy':
        return 'bg-green-500/20 border-green-500 text-green-400';
      default:
        return 'bg-slate-500/20 border-slate-500 text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Service Dependencies</h3>
        
        {/* Simple dependency view */}
        <div className="space-y-2">
          {dependencies.map((service) => (
            <div
              key={service.name}
              className={`border-2 p-3 rounded text-xs ${getStatusColor(service.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold">{service.name}</div>
                <div className="flex items-center gap-1">
                  <Activity size={12} />
                  <span>{service.status}</span>
                </div>
              </div>

              {/* Dependencies */}
              {service.depends.length > 0 && (
                <div className="text-[10px] text-slate-400 mb-1">
                  Depends on: <span className="text-slate-300">{service.depends.join(', ')}</span>
                </div>
              )}

              {/* Dependents */}
              {service.dependents.length > 0 && (
                <div className="text-[10px] text-slate-400 mb-2">
                  Used by: <span className="text-slate-300">{service.dependents.join(', ')}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-500">
                Owned by: {service.owner}
              </div>

              {/* Impact Info */}
              {service.status === 'CRITICAL' && (
                <div className="mt-2 pt-2 border-t border-red-500/30 flex gap-1 text-red-400">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <span>If this fails → checkout blocked, revenue impact</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Impact Summary */}
        <div className="mt-4 bg-slate-900/50 border border-slate-800 rounded p-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Impact Blast Radius</h4>
          <div className="text-xs text-slate-300 space-y-1">
            <div>
              <span className="text-red-400 font-semibold">CRITICAL:</span> If ad-service is down:
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Checkout-service → Users can't complete purchases</li>
                <li>• Analytics → Real-time analytics blocked</li>
                <li>• Revenue impact: ~$50K/hour</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
