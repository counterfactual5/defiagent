'use client';

import { ExternalLink, GitFork, Star } from 'lucide-react';
import type { ToolCard } from '@/lib/tool-cards';

function formatUsd(n?: number) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function changeClass(n?: number) {
  if (n == null || !Number.isFinite(n)) return 'text-slate-500';
  if (n > 0) return 'text-emerald-600';
  if (n < 0) return 'text-red-500';
  return 'text-slate-500';
}

export function ToolResultCard({ card }: { card: ToolCard }) {
  if (card.kind === 'price') {
    return (
      <div className="result-card grid gap-2 sm:grid-cols-2">
        {card.items.map((item) => (
          <div key={item.id} className="rounded-lg bg-white/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.id}</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{formatUsd(item.usd)}</div>
            <div className={`text-[11px] font-medium tabular-nums ${changeClass(item.change24h)}`}>
              {item.change24h == null ? '—' : `${item.change24h > 0 ? '+' : ''}${item.change24h.toFixed(2)}% 24h`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === 'tvl') {
    return (
      <div className="result-card">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
            <div className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{formatUsd(card.tvlUsd)}</div>
          </div>
        </div>
        {card.chains && card.chains.length > 0 && (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {card.chains.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-md bg-white/70 px-2.5 py-1.5 text-[11px]">
                <span className="font-medium text-slate-700">{c.name}</span>
                <span className="tabular-nums text-slate-500">{formatUsd(c.tvl)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (card.kind === 'repo') {
    return (
      <div className="result-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900">{card.title}</div>
            {card.description && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{card.description}</p>}
          </div>
          {card.url && (
            <a href={card.url} target="_blank" rel="noreferrer" className="shrink-0 text-blue-600 hover:text-violet-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{card.stars ?? '—'}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{card.forks ?? '—'}</span>
          {card.language && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{card.language}</span>}
        </div>
      </div>
    );
  }

  if (card.kind === 'gas') {
    return (
      <div className="result-card grid grid-cols-3 gap-2">
        {card.rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-white/70 px-2.5 py-2 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{row.label}</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{row.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`result-card text-[12px] ${card.ok ? 'text-slate-600' : 'border-red-200 bg-red-50/80 text-red-700'}`}>
      <div className="font-semibold text-slate-800">{card.title}</div>
      <div className="mt-1 leading-relaxed">{card.summary}</div>
    </div>
  );
}
