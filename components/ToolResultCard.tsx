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

function Metric({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-white/70 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 break-all text-sm font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
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
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        <div className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{formatUsd(card.tvlUsd)}</div>
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

  if (card.kind === 'swap') {
    return (
      <div className="result-card space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Metric label="Sell" value={card.tokenIn && card.amountIn ? `${card.amountIn} ${card.tokenIn}` : card.tokenIn} />
          <Metric label="Buy" value={card.tokenOut && card.amountOut ? `${card.amountOut} ${card.tokenOut}` : card.tokenOut} />
          <Metric label="Price" value={card.price} />
          <Metric label="Chain" value={card.chain} />
        </div>
        {card.note && <p className="text-[11px] leading-relaxed text-slate-500">{card.note}</p>}
        {card.deepLink && (
          <a
            href={card.deepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/10 px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-500/15"
          >
            Open in Uniswap <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  if (card.kind === 'perp') {
    return (
      <div className="result-card space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Metric label="Market" value={card.coin} />
          <Metric label="Side" value={card.side} />
          <Metric label="Size" value={card.sizeUsd} />
          <Metric label="Avg / Mid" value={card.avgPrice} />
          <Metric label="Slippage / Spread" value={card.slippage} />
          <Metric label="Depth" value={card.depth} />
        </div>
      </div>
    );
  }

  if (card.kind === 'markets') {
    return (
      <div className="result-card space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        {card.items.map((item, i) => (
          <div key={`${item.name}-${i}`} className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-2.5 py-2">
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-slate-800">{item.name}</div>
              {item.detail && <div className="truncate text-[10px] text-slate-500">{item.detail}</div>}
            </div>
            {item.odds && <div className="shrink-0 text-[12px] font-bold tabular-nums text-slate-900">{item.odds}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === 'doctor') {
    return (
      <div className="result-card space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        {card.checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2 rounded-lg bg-white/70 px-2.5 py-2 text-[12px]">
            <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${check.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{check.label}</div>
              {check.detail && <div className="text-[11px] text-slate-500">{check.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === 'wallet') {
    return (
      <div className="result-card space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</div>
        {card.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-2.5 py-2 text-[12px]">
            <span className="font-semibold text-slate-800">{item.label}</span>
            <span className="tabular-nums text-slate-600">{item.value}</span>
          </div>
        ))}
        {card.note && <p className="text-[11px] text-slate-500">{card.note}</p>}
      </div>
    );
  }

  return (
    <div className={`result-card text-[12px] ${card.ok ? 'text-slate-600' : 'border-red-200 bg-red-50/80 text-red-700'}`}>
      <div className="font-semibold text-slate-800">{card.title}</div>
      <div className="mt-1 leading-relaxed">{card.summary}</div>
      {card.link && (
        <a href={card.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-violet-600">
          Open link <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
