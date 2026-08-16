'use client';

import { Activity, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { ToolCard } from '@/lib/tool-cards';
import { ToolResultCard } from '@/components/ToolResultCard';

export type ToolEvent = {
  type: 'tool';
  id?: string;
  name: string;
  label?: string;
  source?: string;
  status: 'running' | 'done' | 'error';
  ms?: number;
  card?: ToolCard | null;
};

export type PhaseEvent = {
  type: 'phase';
  phase: string;
  label?: string;
};

type Props = {
  phase?: PhaseEvent | null;
  tools: ToolEvent[];
  isLoading: boolean;
};

export function ToolActivityRail({ phase, tools, isLoading }: Props) {
  if (!isLoading && tools.length === 0 && !phase) return null;

  return (
    <div className="mb-4 space-y-2">
      {phase && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2 text-[11px] font-medium text-blue-800">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Activity className="h-3.5 w-3.5" />
          )}
          <span>{phase.label || phase.phase}</span>
        </div>
      )}

      {tools.map((tool) => (
        <div key={tool.id || `${tool.name}-${tool.status}`} className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-[11px]">
            <div className="flex min-w-0 items-center gap-2">
              {tool.status === 'running' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" />}
              {tool.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
              {tool.status === 'error' && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-800">{tool.label || tool.name}</div>
                <div className="truncate text-slate-500">{tool.source}</div>
              </div>
            </div>
            <div className="shrink-0 font-mono text-slate-400">
              {tool.status === 'running' ? '…' : tool.ms != null ? `${tool.ms}ms` : ''}
            </div>
          </div>
          {tool.card && tool.status !== 'running' && <ToolResultCard card={tool.card} />}
        </div>
      ))}
    </div>
  );
}
