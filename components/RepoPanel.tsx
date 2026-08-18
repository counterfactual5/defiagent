'use client';

import { useEffect, useState } from 'react';
import {
  Clock3,
  Code2,
  ExternalLink,
  GitFork,
  Github,
  History,
  RotateCcw,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import { REPOS } from '@/lib/repos';
import { LIVE_TOOLS } from '@/lib/live-tools';
import { formatFetchedAt } from '@/lib/format-time';
import type { PromptHistoryItem } from '@/lib/session';
import type { ToolEvent } from '@/components/ToolActivityRail';

interface RepoStats {
  name: string;
  stars: number | null;
  forks: number | null;
}

export type WorkbenchLastTool = {
  tool: ToolEvent;
  turnId: string;
};

type Props = {
  /** One-tap: send immediately (or stage when draft exists — handled by parent). */
  onInvoke: (prompt: string, meta?: { label: string }) => void;
  compact?: boolean;
  promptHistory?: PromptHistoryItem[];
  lastTools?: WorkbenchLastTool[];
  onRetryTool?: (turnId: string, tool: ToolEvent) => void;
  retryingId?: string | null;
};

export function RepoPanel({
  onInvoke,
  compact = false,
  promptHistory = [],
  lastTools = [],
  onRetryTool,
  retryingId,
}: Props) {
  const [stats, setStats] = useState<Record<string, RepoStats>>({});

  useEffect(() => {
    fetch('/api/repos')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.repos) return;
        const map: Record<string, RepoStats> = {};
        for (const s of data.repos) map[s.name] = s;
        setStats(map);
      })
      .catch(() => {});
  }, []);

  if (compact) {
    return (
      <div className="flex h-full flex-col items-center gap-2 py-3">
        {LIVE_TOOLS.map((tool) => (
          <button
            key={tool.name}
            type="button"
            title={tool.label}
            onClick={() => onInvoke(tool.sample, { label: tool.label })}
            className="ui-icon-btn !h-10 !w-10 text-[var(--accent)]"
          >
            <Wrench className="h-4 w-4" />
          </button>
        ))}
        <div className="my-1 h-px w-6 bg-[var(--border)]" />
        {REPOS.slice(0, 4).map((repo) => (
          <button
            key={repo.name}
            type="button"
            title={repo.name}
            onClick={() => onInvoke(repo.demoPrompt, { label: repo.name })}
            className="ui-icon-btn !h-10 !w-10 text-[10px] font-bold uppercase"
          >
            {repo.name.slice(0, 2)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="rail-head">
        <div className="ui-kicker mb-1 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
          Built-in Live Tools
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--muted)]">
          Ask for a live briefing. If the composer already has a draft, the prompt is armed instead of overwritten.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {LIVE_TOOLS.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => onInvoke(tool.sample, { label: tool.label })}
            className="rail-card p-2.5 text-left"
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--text)]">{tool.label}</span>
            </div>
            <p className="text-[10px] text-[var(--muted)]">{tool.source}</p>
          </button>
        ))}
      </div>

      {(lastTools.length > 0 || promptHistory.length > 0) && (
        <div className="border-t border-[var(--border)] px-3 py-3">
          {lastTools.length > 0 && (
            <div className="mb-3">
              <div className="ui-kicker mb-2 flex items-center gap-2 px-1">
                <Clock3 className="h-3 w-3" />
                Last tool results
              </div>
              <div className="space-y-1.5">
                {lastTools.slice(0, 4).map(({ tool, turnId }) => {
                  const key = tool.id || tool.name;
                  const busy = retryingId === key;
                  const fresh = formatFetchedAt(tool.completedAt);
                  return (
                    <div
                      key={`${turnId}-${key}`}
                      className="rail-card flex items-center justify-between gap-2 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-[var(--text)]">
                          {tool.label || tool.name}
                        </div>
                        <div className="truncate text-[10px] text-[var(--muted)]">
                          {[tool.status, tool.source, fresh].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {onRetryTool && tool.status !== 'running' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRetryTool(turnId, tool)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-[var(--muted)] transition hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                        >
                          <RotateCcw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {promptHistory.length > 0 && (
            <div>
              <div className="ui-kicker mb-2 flex items-center gap-2 px-1">
                <History className="h-3 w-3" />
                Recent prompts
              </div>
              <div className="space-y-1">
                {promptHistory.slice(0, 6).map((item) => (
                  <button
                    key={`${item.at}-${item.prompt.slice(0, 24)}`}
                    type="button"
                    onClick={() => onInvoke(item.prompt, { label: item.label || 'Recent' })}
                    className="block w-full rounded-lg border border-transparent px-2.5 py-1.5 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface)]"
                  >
                    <div className="truncate text-[11px] font-medium text-[var(--text-2)]">
                      {item.label || item.prompt}
                    </div>
                    {item.label ? (
                      <div className="truncate text-[10px] text-[var(--faint)]">{item.prompt}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rail-head">
        <div className="ui-kicker mb-1 flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5" />
          GitHub Projects
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--muted)]">
          Open-source DeFi & agent suite — one click asks for a demo briefing; live stars from GitHub.
        </p>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {REPOS.map((repo) => {
          const s = stats[repo.name];
          return (
            <div
              key={repo.name}
              className="rail-card p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--text)]">{repo.name}</span>
                <span className="ui-chip">{repo.badge}</span>
              </div>
              <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">{repo.desc}</p>
              <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-[var(--faint)]">
                <button
                  type="button"
                  onClick={() => onInvoke(repo.demoPrompt, { label: repo.name })}
                  className="min-h-11 rounded-md px-1 text-left text-[var(--accent)]"
                >
                  Run now →
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[var(--muted)]">
                    <Star className="h-3 w-3" />
                    {s?.stars ?? '—'}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--muted)]">
                    <GitFork className="h-3 w-3" />
                    {s?.forks ?? '—'}
                  </span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 rounded-md px-1.5 text-[var(--muted)] hover:text-[var(--text)]"
                    aria-label={`Open ${repo.name} on GitHub`}
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>Open</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--faint)]">{repo.tag}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
