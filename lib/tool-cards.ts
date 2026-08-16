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
      kind: 'generic';
      title: string;
      summary: string;
      ok: boolean;
    };

function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
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
    const d = parsed?.data || {};
    const rows: { label: string; value: string }[] = [];
    const pick = (label: string, ...keys: string[]) => {
      for (const k of keys) {
        if (d?.[k] != null) {
          rows.push({ label, value: `${d[k]} gwei` });
          return;
        }
      }
    };
    pick('Safe', 'SafeGasPrice', 'safe', 'low');
    pick('Standard', 'ProposeGasPrice', 'standard', 'propose');
    pick('Fast', 'FastGasPrice', 'fast');
    if (rows.length === 0 && typeof d === 'object') {
      for (const [k, v] of Object.entries(d).slice(0, 4)) {
        rows.push({ label: k, value: String(v) });
      }
    }
    return { kind: 'gas', title: 'Ethereum Gas', rows };
  }

  const source = parsed?.source ? `via ${parsed.source}` : 'tool result ready';
  return {
    kind: 'generic',
    title: name,
    summary: source,
    ok: true,
  };
}
