/** Compact card payloads derived from tool JSON for the chat UI. */

export type ToolCard =
  | {
      kind: 'price';
      title: string;
      items: { id: string; usd?: number; change24h?: number }[];
    }
  | {
      kind: 'tvl';
      title: string;
      tvlUsd?: number;
      chains?: { name: string; tvl: number }[];
    }
  | {
      kind: 'repo';
      title: string;
      stars?: number;
      forks?: number;
      language?: string;
      url?: string;
      description?: string;
    }
  | {
      kind: 'gas';
      title: string;
      rows: { label: string; value: string }[];
    }
  | {
      kind: 'swap';
      title: string;
      tokenIn?: string;
      tokenOut?: string;
      amountIn?: string;
      amountOut?: string;
      price?: string;
      chain?: string;
      deepLink?: string;
      note?: string;
    }
  | {
      kind: 'perp';
      title: string;
      coin?: string;
      side?: string;
      sizeUsd?: string;
      avgPrice?: string;
      slippage?: string;
      depth?: string;
    }
  | {
      kind: 'markets';
      title: string;
      items: { name: string; detail?: string; odds?: string }[];
    }
  | {
      kind: 'doctor';
      title: string;
      checks: { label: string; ok: boolean; detail?: string }[];
    }
  | {
      kind: 'wallet';
      title: string;
      items: { label: string; value: string }[];
      note?: string;
    }
  | {
      kind: 'generic';
      title: string;
      summary: string;
      ok: boolean;
      link?: string;
    };

function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function pick(obj: any, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
    const parts = key.split('.');
    let cur: any = obj;
    let ok = true;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object' || !(p in cur)) {
        ok = false;
        break;
      }
      cur = cur[p];
    }
    if (ok && cur != null && cur !== '') return cur;
  }
  return undefined;
}

function asList(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}

export function buildToolCard(name: string, raw: string): ToolCard | null {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'generic', title: name, summary: raw.slice(0, 180), ok: false };
  }

  if (parsed?.error) {
    return {
      kind: 'generic',
      title: name,
      summary: String(parsed.error).slice(0, 200),
      ok: false,
    };
  }

  const data = parsed?.data ?? parsed;

  if (name === 'get_token_price' && parsed?.data && typeof parsed.data === 'object') {
    const items = Object.entries(parsed.data as Record<string, any>).map(([id, row]) => ({
      id,
      usd: num(row?.usd),
      change24h: num(row?.usd_24h_change),
    }));
    return { kind: 'price', title: 'Token Price', items };
  }

  if (name === 'get_defi_tvl') {
    const chainTvls = parsed?.chainTvls && typeof parsed.chainTvls === 'object'
      ? Object.entries(parsed.chainTvls as Record<string, number>)
          .map(([cname, tvl]) => ({ name: cname, tvl: Number(tvl) || 0 }))
          .filter((c) => c.tvl > 0)
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 6)
      : undefined;
    return {
      kind: 'tvl',
      title: `${parsed?.protocol || 'Protocol'} TVL`,
      tvlUsd: num(parsed?.tvlUsd) ?? num(parsed?.data?.tvl),
      chains: chainTvls,
    };
  }

  if (name === 'get_github_repo') {
    return {
      kind: 'repo',
      title: parsed?.name || 'GitHub Repo',
      stars: num(parsed?.stars),
      forks: num(parsed?.forks),
      language: parsed?.language,
      url: parsed?.url,
      description: parsed?.description,
    };
  }

  if (name === 'get_gas_price') {
    const d = parsed?.data ?? parsed ?? {};
    const rows: { label: string; value: string }[] = [];
    const fmt = (v: unknown) => {
      const n = num(v);
      return n == null ? `${v} gwei` : `${Number(n.toFixed(6))} gwei`;
    };
    const add = (label: string, ...keys: string[]) => {
      for (const k of keys) {
        const v = pick(d, k);
        if (v != null) {
          rows.push({ label, value: fmt(v) });
          return;
        }
      }
    };
    add('Safe', 'safe_gwei', 'SafeGasPrice', 'safe', 'low');
    add('Standard', 'propose_gwei', 'selected_gwei', 'ProposeGasPrice', 'standard', 'propose');
    add('Fast', 'fast_gwei', 'FastGasPrice', 'fast');
    if (rows.length === 0 && typeof d === 'object') {
      for (const [k, v] of Object.entries(d).slice(0, 4)) {
        if (typeof v === 'object') continue;
        rows.push({ label: k, value: String(v) });
      }
    }
    return { kind: 'gas', title: 'Ethereum Gas', rows };
  }

  if (name === 'uniswap_quote_plan' || name === 'uniswap_swap_link') {
    const d = data;
    const deepLink = str(parsed?.deepLink) || str(pick(d, 'deepLink', 'execution_links.uniswap_app'));
    const tokenInSym = str(pick(d, 'tokenIn.symbol', 'token_in', 'tokenIn', 'apiTokenIn.symbol'));
    const tokenOutSym = str(pick(d, 'tokenOut.symbol', 'token_out', 'tokenOut', 'apiTokenOut.symbol'));
    const amountIn = str(pick(d, 'humanAmount', 'amount', 'amount_in', 'amountIn'));
    const amountOutRaw = pick(d, 'on_chain_quote.expected_output_if_no_slippage', 'coingecko_indicative.expected_output_usd_stable', 'amount_out');
    const amountOut = amountOutRaw == null ? undefined : String(typeof amountOutRaw === 'number' ? Number(amountOutRaw.toFixed(4)) : amountOutRaw);
    const price = str(pick(d, 'coingecko_indicative.eth_usd', 'on_chain_quote.expected_output_if_no_slippage', 'price'));
    const chain = str(pick(d, 'chain.key', 'chain', 'chain.chainId')) || 'ethereum';
    return {
      kind: 'swap',
      title: name === 'uniswap_swap_link' ? 'Uniswap Deep Link' : 'Uniswap Quote Plan',
      tokenIn: tokenInSym,
      tokenOut: tokenOutSym,
      amountIn,
      amountOut,
      price: price ? (String(price).includes(' ') ? price : `~${price}`) : undefined,
      chain,
      deepLink,
      note: deepLink ? 'Open Uniswap to review and sign — this agent does not broadcast.' : undefined,
    };
  }

  if (name === 'uniswap_il') {
    return {
      kind: 'generic',
      title: 'Impermanent Loss',
      summary: `IL ${str(pick(data, 'il_pct', 'ilPercent', 'impermanent_loss_pct', 'result.il_pct')) || 'computed'} · entry ${str(pick(data, 'price_entry', 'entry')) || '—'} → current ${str(pick(data, 'price_current', 'current')) || '—'}`,
      ok: true,
    };
  }

  if (name === 'uniswap_range_model') {
    const profiles = asList(pick(data, 'ranges', 'suggestions', 'profiles') || data).slice(0, 3);
    const items = profiles.map((p: any, i: number) => ({
      name: str(p?.name || p?.profile || p?.label) || `Profile ${i + 1}`,
      detail: str(p?.tick_lower != null ? `${p.tick_lower} → ${p.tick_upper}` : p?.range || p?.summary),
    }));
    return {
      kind: 'markets',
      title: 'LP Range Suggestions',
      items: items.length ? items : [{ name: 'Range model', detail: 'Profiles ready' }],
    };
  }

  if (name === 'hyperliquid_quote') {
    const d = data;
    const slipBps = num(pick(d, 'slippage_bps'));
    const maxBps = num(pick(d, 'max_slippage_bps'));
    const slip =
      slipBps != null
        ? `${(slipBps / 100).toFixed(4)}%${maxBps != null ? ` / max ${(maxBps / 100).toFixed(2)}%` : ''}`
        : str(pick(d, 'slippage_pct', 'slippage', 'max_slippage_pct'));
    const depthAsk = pick(d, 'book_depth_ask');
    const depthBid = pick(d, 'book_depth_bid');
    const depth =
      depthAsk != null || depthBid != null
        ? `ask ${depthAsk ?? '—'} · bid ${depthBid ?? '—'}`
        : str(pick(d, 'depth', 'filled_pct'));
    return {
      kind: 'perp',
      title: 'Hyperliquid L2 Quote',
      coin: str(pick(d, 'coin', 'symbol', 'asset')),
      side: str(pick(d, 'side')),
      sizeUsd: str(pick(d, 'size_usd', 'sizeUsd', 'notional')),
      avgPrice: str(pick(d, 'estimated_fill_price', 'mid_price', 'avg_price', 'fill_price')),
      slippage: slip,
      depth,
    };
  }

  if (name === 'polymarket_search') {
    const d = data;
    const events = asList(pick(d, 'events') || []);
    const items: { name: string; detail?: string; odds?: string }[] = [];
    for (const ev of events.slice(0, 5)) {
      items.push({
        name: str(ev?.title || ev?.ticker || ev?.slug) || 'Event',
        detail: str(ev?.slug || ev?.id),
        odds: ev?.volume24hr != null ? `24h vol ${Number(ev.volume24hr).toLocaleString()}` : str(ev?.volume),
      });
      for (const m of asList(ev?.markets).slice(0, 2)) {
        items.push({
          name: str(m?.question || m?.slug) || 'Market',
          detail: str(m?.slug || m?.id),
          odds: str(m?.outcomePrices?.[0] ?? m?.lastTradePrice ?? m?.bestBid),
        });
      }
    }
    if (items.length === 0) {
      const markets = asList(pick(d, 'markets', 'results') || d).slice(0, 5);
      for (const m of markets) {
        items.push({
          name: str(m?.question || m?.title || m?.name || m?.slug) || 'Market',
          detail: str(m?.slug || m?.id),
          odds: str(m?.outcomePrices?.[0] ?? m?.yes_price ?? m?.probability),
        });
      }
    }
    return {
      kind: 'markets',
      title: 'Polymarket Search',
      items: items.length ? items.slice(0, 6) : [{ name: 'No markets', detail: 'Empty result set' }],
    };
  }

  if (name === 'polymarket_market_snapshot') {
    return {
      kind: 'perp',
      title: 'Polymarket Snapshot',
      coin: str(pick(data, 'market', 'slug', 'question', 'token_id')),
      side: str(pick(data, 'outcome', 'outcome_index')),
      avgPrice: str(pick(data, 'mid', 'mid_price', 'price', 'book.mid')),
      slippage: str(pick(data, 'spread', 'max_spread', 'book.spread')),
      depth: str(pick(data, 'tradeable', 'valid') != null ? `tradeable=${String(pick(data, 'tradeable', 'valid'))}` : undefined),
    };
  }

  if (name === 'defi_doctor') {
    const checksRaw = asList(pick(data, 'checks', 'results', 'steps') || data);
    const checks = checksRaw.slice(0, 8).map((c: any, i: number) => {
      if (typeof c === 'string') return { label: c, ok: true };
      const ok = Boolean(
        c?.ok === true
        || c?.pass === true
        || c?.success === true
        || c?.healthy === true
        || c?.status === 'ok'
      );
      return {
        label: str(c?.name || c?.check || c?.label || c?.key) || `Check ${i + 1}`,
        ok,
        detail: str(c?.detail || c?.message || c?.reason || c?.value),
      };
    });
    if (checks.length === 0) {
      return {
        kind: 'generic',
        title: 'DeFi Doctor',
        summary: str(pick(data, 'summary', 'message')) || 'Preflight finished',
        ok: true,
      };
    }
    return { kind: 'doctor', title: 'DeFi Doctor Preflight', checks };
  }

  if (name === 'wallet_balance_scan' || name === 'wallet_approval_scan' || name === 'wallet_revoke_plan') {
    const assets = asList(pick(data, 'assets', 'balances', 'tokens', 'approvals', 'items') || []).slice(0, 6);
    const items = assets.map((a: any) => ({
      label: str(a?.symbol || a?.token || a?.name || a?.spender) || 'Item',
      value: str(a?.balance || a?.amount || a?.allowance || a?.value || a?.risk) || '—',
    }));
    return {
      kind: 'wallet',
      title:
        name === 'wallet_balance_scan'
          ? 'Wallet Balances'
          : name === 'wallet_approval_scan'
            ? 'Token Approvals'
            : 'Revoke Plan',
      items: items.length
        ? items
        : [{ label: 'Result', value: str(pick(data, 'summary', 'status')) || 'Ready' }],
      note: name === 'wallet_revoke_plan' ? 'Raw revoke payload — review before signing.' : undefined,
    };
  }

  const source = parsed?.source ? `via ${parsed.source}` : 'tool result ready';
  const link = str(parsed?.deepLink) || str(pick(data, 'deepLink', 'url', 'html_url'));
  return {
    kind: 'generic',
    title: name,
    summary: source,
    ok: true,
    link,
  };
}
