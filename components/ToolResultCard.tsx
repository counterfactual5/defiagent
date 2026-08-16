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
    <div className="result-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

type Props = {
  card: ToolCard;
  /** Drop outer border when nested inside Finding. */
  flush?: boolean;
};

export function ToolResultCard({ card, flush = false }: Props) {
  const shell = flush ? 'result-card result-card--flush' : 'result-card';

  if (card.kind === 'price') {
    return (
      <div className={`${shell} result-card--grid`}>
        {card.items.map((item) => (
          <div key={item.id} className="result-metric">
            <dt>{item.id}</dt>
            <dd className="result-metric__hero">{formatUsd(item.usd)}</dd>
            <div className={`result-metric__meta ${changeClass(item.change24h)}`}>
              {item.change24h == null ? '—' : `${item.change24h > 0 ? '+' : ''}${item.change24h.toFixed(2)}% 24h`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === 'tvl') {
    return (
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card__hero">{formatUsd(card.tvlUsd)}</div>
        {card.chains && card.chains.length > 0 ? (
          <div className="result-card__list">
            {card.chains.map((c) => (
              <div key={c.name} className="result-card__row">
                <span>{c.name}</span>
                <span className="tabular-nums text-slate-500">{formatUsd(c.tvl)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (card.kind === 'repo') {
    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="result-card__title">{card.title}</div>
            {card.description ? <p className="result-card__note">{card.description}</p> : null}
          </div>
          {card.url ? (
            <a href={card.url} target="_blank" rel="noreferrer" className="result-card__icon-link" aria-label="Open repository">
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
        <div className="result-card__meta-row">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{card.stars ?? '—'}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{card.forks ?? '—'}</span>
          {card.language ? <span className="result-card__tag">{card.language}</span> : null}
        </div>
      </div>
    );
  }

  if (card.kind === 'gas') {
    return (
      <div className={`${shell} result-card--cols-3`}>
        {card.rows.map((row) => (
          <div key={row.label} className="result-metric result-metric--center">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === 'swap') {
    return (
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card--grid">
          <Metric label="Sell" value={card.tokenIn && card.amountIn ? `${card.amountIn} ${card.tokenIn}` : card.tokenIn} />
          <Metric label="Buy" value={card.tokenOut && card.amountOut ? `${card.amountOut} ${card.tokenOut}` : card.tokenOut} />
          <Metric label="Price" value={card.price} />
          <Metric label="Chain" value={card.chain} />
        </div>
        {card.note ? <p className="result-card__note">{card.note}</p> : null}
        {card.deepLink ? (
          <a href={card.deepLink} target="_blank" rel="noreferrer" className="result-card__cta">
            Open in Uniswap <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    );
  }

  if (card.kind === 'perp') {
    return (
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card--grid">
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
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card__list">
          {card.items.map((item, i) => (
            <div key={`${item.name}-${i}`} className="result-card__row">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-slate-800">{item.name}</div>
                {item.detail ? <div className="truncate text-[10px] text-slate-500">{item.detail}</div> : null}
              </div>
              {item.odds ? <div className="shrink-0 text-[12px] font-bold tabular-nums text-slate-900">{item.odds}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === 'doctor') {
    return (
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card__list">
          {card.checks.map((check) => (
            <div key={check.label} className="result-card__check">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${check.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-slate-800">{check.label}</div>
                {check.detail ? <div className="text-[11px] text-slate-500">{check.detail}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === 'wallet') {
    return (
      <div className={shell}>
        <div className="result-card__kicker">{card.title}</div>
        <div className="result-card__list">
          {card.items.map((item) => (
            <div key={item.label} className="result-card__row">
              <span className="font-semibold text-slate-800">{item.label}</span>
              <span className="tabular-nums text-slate-600">{item.value}</span>
            </div>
          ))}
        </div>
        {card.note ? <p className="result-card__note">{card.note}</p> : null}
      </div>
    );
  }

  return (
    <div className={`${shell} ${card.ok ? '' : 'result-card--error'}`}>
      <div className="result-card__title">{card.title}</div>
      <p className="result-card__note mt-1">{card.summary}</p>
      {card.link ? (
        <a href={card.link} target="_blank" rel="noreferrer" className="result-card__cta mt-2">
          Open link <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}
