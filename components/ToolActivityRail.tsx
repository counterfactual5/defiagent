'use client';

import { Activity, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
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
  args?: Record<string, unknown>;
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
  showCards?: boolean;
  onRetry?: (tool: ToolEvent) => void;
  retryingId?: string | null;
};

export function ToolActivityRail({
  phase,
  tools,
  isLoading,
  showCards = true,
  onRetry,
  retryingId,
}: Props) {
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

      {tools.map((tool) => {
        const key = tool.id || tool.name;
        const busy = retryingId === key;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-[11px]">
              <div className="flex min-w-0 items-center gap-2">
                {(tool.status === 'running' || busy) && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" />}
                {tool.status === 'done' && !busy && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                {tool.status === 'error' && !busy && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">{tool.label || tool.name}</div>
                  <div className="truncate text-slate-500">{tool.source}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-slate-400">
                  {tool.status === 'running' || busy ? '…' : tool.ms != null ? `${tool.ms}ms` : ''}
                </span>
                {tool.status === 'error' && onRetry && (
                  <button
                    type="button"
                    disabled={busy || isLoading}
                    onClick={() => onRetry(tool)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
            {showCards && tool.card && tool.status !== 'running' && !busy && <ToolResultCard card={tool.card} />}
          </div>
        );
      })}
    </div>
  );
}
