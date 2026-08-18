'use client';

import { Activity, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import type { ToolCard } from '@/lib/tool-cards';
import { formatFetchedAt } from '@/lib/format-time';
import { ToolResultCard } from '@/components/ToolResultCard';

export type ToolEvent = {
  type: 'tool';
  id?: string;
  name: string;
  label?: string;
  source?: string;
  status: 'running' | 'done' | 'error';
  ms?: number;
  /** Wall-clock ms when the tool finished (for freshness). */
  completedAt?: number;
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
    <div className="tool-rail">
      {phase ? (
        <div className="tool-phase">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Activity className="h-3.5 w-3.5" />
          )}
          <span>{phase.label || phase.phase}</span>
        </div>
      ) : null}

      {tools.map((tool) => {
        const key = tool.id || tool.name;
        const busy = retryingId === key;
        const fresh = formatFetchedAt(tool.completedAt);
        return (
          <div key={key} className="space-y-2">
            <div className="tool-row">
              <div className="flex min-w-0 items-center gap-2">
                {(tool.status === 'running' || busy) && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--accent)]" />
                )}
                {tool.status === 'done' && !busy && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--ok)]" />
                )}
                {tool.status === 'error' && !busy && (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" />
                )}
                <div className="min-w-0">
                  <div className="tool-row__label">{tool.label || tool.name}</div>
                  <div className="tool-row__detail">
                    {[tool.source, fresh].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--faint)]">
                  {tool.status === 'running' || busy ? '…' : tool.ms != null ? `${tool.ms}ms` : ''}
                </span>
                {tool.status === 'error' && onRetry ? (
                  <button
                    type="button"
                    disabled={busy || isLoading}
                    onClick={() => onRetry(tool)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
            {showCards && tool.card && tool.status !== 'running' && !busy ? (
              <ToolResultCard card={tool.card} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
