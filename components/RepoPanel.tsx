'use client';

import { useEffect, useState } from 'react';
import { Code2, ExternalLink, GitFork, Github, Star, Wrench, Zap } from 'lucide-react';
import { REPOS } from '@/lib/repos';
import { LIVE_TOOLS } from '@/lib/live-tools';

interface RepoStats {
  name: string;
  stars: number | null;
  forks: number | null;
}

export function RepoPanel({ onSuggest }: { onSuggest: (prompt: string) => void }) {
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

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-blue-500/8 via-transparent to-violet-500/8 px-4 py-3.5">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Zap className="h-3.5 w-3.5 text-blue-600" />
          Built-in Live Tools
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Free public APIs the agent can call mid-conversation. Click one to try it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {LIVE_TOOLS.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => onSuggest(tool.sample)}
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

      <div className="border-t border-slate-200/70 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Code2 className="h-3.5 w-3.5" />
          GitHub Projects
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Open-source DeFi & agent suite — click to stage a prompt; live stars load from GitHub.
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
              onClick={() => onSuggest(repo.demoPrompt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSuggest(repo.demoPrompt);
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
                <span className="text-blue-600/80 transition group-hover:text-blue-700">Try prompt →</span>
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
