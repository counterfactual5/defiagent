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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-blue-600 transition hover:border-blue-300 hover:bg-white"
          >
            <Wrench className="h-4 w-4" />
          </button>
        ))}
        <div className="my-1 h-px w-6 bg-slate-200" />
        {REPOS.slice(0, 4).map((repo) => (
          <button
            key={repo.name}
            type="button"
            title={repo.name}
            onClick={() => onInvoke(repo.demoPrompt, { label: repo.name })}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-[10px] font-bold uppercase text-slate-600 transition hover:border-blue-300 hover:bg-white"
          >
            {repo.name.slice(0, 2)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-blue-500/8 via-transparent to-violet-500/8 px-4 py-3.5">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Zap className="h-3.5 w-3.5 text-blue-600" />
          Built-in Live Tools
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Click to run immediately. If the composer already has a draft, the prompt is armed as a chip instead.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {LIVE_TOOLS.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => onInvoke(tool.sample, { label: tool.label })}
            className="rounded-xl border border-slate-200/80 bg-white/60 p-2.5 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-[0_4px_14px_rgba(37,99,235,0.08)]"
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-blue-600/80" />
              <span className="text-xs font-semibold text-slate-800">{tool.label}</span>
            </div>
            <p className="text-[10px] text-slate-500">{tool.source}</p>
          </button>
        ))}
      </div>

      {(lastTools.length > 0 || promptHistory.length > 0) && (
        <div className="border-t border-slate-200/70 px-3 py-3">
          {lastTools.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-white/70 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-slate-800">
                          {tool.label || tool.name}
                        </div>
                        <div className="truncate text-[10px] text-slate-500">
                          {[tool.status, tool.source, fresh].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {onRetryTool && tool.status !== 'running' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRetryTool(turnId, tool)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
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
              <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <History className="h-3 w-3" />
                Recent prompts
              </div>
              <div className="space-y-1">
                {promptHistory.slice(0, 6).map((item) => (
                  <button
                    key={`${item.at}-${item.prompt.slice(0, 24)}`}
                    type="button"
                    onClick={() => onInvoke(item.prompt, { label: item.label || 'Recent' })}
                    className="block w-full rounded-lg border border-transparent px-2.5 py-1.5 text-left transition hover:border-slate-200 hover:bg-white"
                  >
                    <div className="truncate text-[11px] font-medium text-slate-700">
                      {item.label || item.prompt}
                    </div>
                    {item.label ? (
                      <div className="truncate text-[10px] text-slate-400">{item.prompt}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200/70 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Code2 className="h-3.5 w-3.5" />
          GitHub Projects
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Open-source DeFi & agent suite — one click sends a demo brief; live stars from GitHub.
        </p>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {REPOS.map((repo) => {
          const s = stats[repo.name];
          return (
            <div
              key={repo.name}
              role="button"
              tabIndex={0}
              onClick={() => onInvoke(repo.demoPrompt, { label: repo.name })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInvoke(repo.demoPrompt, { label: repo.name });
                }
              }}
              className="group cursor-pointer rounded-xl border border-slate-200/80 bg-white/55 p-3 transition hover:border-blue-300 hover:bg-white hover:shadow-[0_4px_14px_rgba(37,99,235,0.08)]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-slate-800">{repo.name}</span>
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  {repo.badge}
                </span>
              </div>
              <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{repo.desc}</p>
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                <span className="text-blue-600/80 transition group-hover:text-blue-700">Run now →</span>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Star className="h-3 w-3" />
                    {s?.stars ?? '—'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <GitFork className="h-3 w-3" />
                    {s?.forks ?? '—'}
                  </span>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    <Github className="h-3 w-3" />
                    <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </a>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">{repo.tag}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
