/** Shared tool-bridge execution used by /api/chat and /api/tools/run. */

const TOOL_BASE_URL = (process.env.TOOL_BRIDGE_BASE_URL || 'https://tools.defiagent.llm.christmas/tools').replace(/\/$/, '');

const FETCH_TIMEOUT_MS = 15_000;
async function fetchJson(url: string, init: RequestInit = {}): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const body = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 500)}`);
    return body ? JSON.parse(body) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function postTool(path: string, body: Record<string, unknown>) {
  return fetchJson(`${TOOL_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function executeTool(name: string, args: any): Promise<string> {
  try {
    if (name === 'uniswap_quote_plan') {
      const data = await postTool('/uniswap/quote-plan', {
        token_in: args.token_in || 'ETH', token_out: args.token_out || 'USDC',
        amount_in: String(args.amount_in || '1'), chain: args.chain || 'ethereum',
        slippage_pct: Number(args.slippage_pct ?? 0.5),
      });
      return JSON.stringify({
        source: 'uni-exec-engine.prepare_quote_request_data + deep_link',
        data,
        deepLink: data?.deepLink || data?.execution_links?.uniswap_app || null,
      });
    }
    if (name === 'uniswap_swap_link') {
      const data = await postTool('/uniswap/swap-link', {
        token_in: args.token_in || 'ETH',
        token_out: args.token_out || 'USDC',
        amount_in: String(args.amount_in || '1'),
        chain: args.chain || 'ethereum',
      });
      return JSON.stringify({
        source: 'uni-exec-engine.swap.links.deep_link',
        data,
        deepLink: data?.deepLink || data?.execution_links?.uniswap_app || null,
      });
    }
    if (name === 'uniswap_il') {
      const data = await postTool('/uniswap/il', args);
      return JSON.stringify({ source: 'uni-exec-engine.calculate_il', data });
    }
    if (name === 'uniswap_range_model') {
      const data = await postTool('/uniswap/range-model', args);
      return JSON.stringify({ source: 'uni-exec-engine.calculate_range_suggestions', data });
    }
    if (name === 'polymarket_search') {
      const q = String(args.query || args.q || '').trim();
      const limit = Number(args.limit || 5);
      const data = await fetchJson(`${TOOL_BASE_URL}/polymarket/search?q=${encodeURIComponent(q)}&limit=${limit}`);
      return JSON.stringify({ source: 'polymarket-sdk.search', data });
    }
    if (name === 'polymarket_market_snapshot') {
      const params = new URLSearchParams({
        market: String(args.market || ''), outcome_index: String(args.outcome_index ?? 0),
        max_spread: String(args.max_spread ?? 0.1),
      });
      const data = await fetchJson(`${TOOL_BASE_URL}/polymarket/market-snapshot?${params}`);
      return JSON.stringify({ source: 'polymarket-sdk orderbook + snapshot validator', data });
    }
    if (name === 'hyperliquid_quote') {
      const params = new URLSearchParams({
        coin: String(args.coin || args.symbol || 'BTC'), side: String(args.side || 'buy'),
        size_usd: String(args.size_usd || 100), max_slippage_pct: String(args.max_slippage_pct ?? 0.5),
      });
      const data = await fetchJson(`${TOOL_BASE_URL}/hyperliquid/quote?${params}`);
      return JSON.stringify({ source: 'hl-trade-flow.prepare_quote', data });
    }
    if (name === 'defi_doctor') {
      const params = new URLSearchParams({
        chain_id: String(args.chain_id || 1), policy_check: String(Boolean(args.policy_check)),
      });
      if (args.wallet) params.set('wallet', String(args.wallet));
      if (args.amount) params.set('amount', String(args.amount));
      const data = await fetchJson(`${TOOL_BASE_URL}/defi/doctor?${params}`);
      return JSON.stringify({ source: 'defi-omni-cli.run_doctor', data });
    }
    if (name === 'wallet_balance_scan') {
      const data = await fetchJson(`${TOOL_BASE_URL}/wallet/balance-scan?wallet=${encodeURIComponent(args.wallet)}&chain=${encodeURIComponent(args.chain || 'ethereum')}`);
      return JSON.stringify({ source: 'evm-wallet-scanner.query_chain_assets', data });
    }
    if (name === 'wallet_approval_scan') {
      const data = await fetchJson(`${TOOL_BASE_URL}/wallet/approval-scan?wallet=${encodeURIComponent(args.wallet)}&chain=${encodeURIComponent(args.chain || 'ethereum')}`);
      return JSON.stringify({ source: 'erc20-checker.scan_approvals', data });
    }
    if (name === 'wallet_revoke_plan') {
      const data = await postTool('/wallet/revoke-plan', {
        token: args.token,
        spender: args.spender,
        chain: args.chain || 'ethereum',
      });
      return JSON.stringify({ source: 'erc20-checker.build_revoke_tx', data });
    }
    if (name === 'get_token_price') {
      const raw = String(args.ids || args.token || '').trim();
      const aliases: Record<string, string> = { eth: 'ethereum', ethereum: 'ethereum', btc: 'bitcoin', bitcoin: 'bitcoin', sol: 'solana' };
      const ids = raw.split(',').map((v) => aliases[v.trim().toLowerCase()] || v.trim()).filter(Boolean).join(',');
      const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`);
      return JSON.stringify({ source: 'CoinGecko', data });
    }
    if (name === 'get_defi_tvl') {
      const protocol = String(args.protocol || '').trim();
      const data = await fetchJson(`https://api.llama.fi/protocol/${encodeURIComponent(protocol)}`);
      return JSON.stringify({ source: 'DefiLlama', protocol: data?.name || protocol, tvlUsd: data?.tvl, chainTvls: data?.chainTvls });
    }
    if (name === 'get_github_repo') {
      const repo = String(args.repo || '').trim();
      const data = await fetchJson(`https://api.github.com/repos/${repo.split('/').map(encodeURIComponent).join('/')}`);
      return JSON.stringify({ source: 'GitHub', name: data.full_name, stars: data.stargazers_count, forks: data.forks_count, language: data.language, description: data.description, url: data.html_url });
    }
    if (name === 'get_gas_price') {
      // Prefer DeFi Agent tool-bridge (Etherscan API V2). Never call Etherscan V1.
      try {
        const chain = String(args.chain || 'ethereum');
        const speed = String(args.speed || 'standard');
        const params = new URLSearchParams({ chain, speed });
        const data = await fetchJson(`${TOOL_BASE_URL}/gas/price?${params}`);
        return JSON.stringify({ source: 'tools.defiagent.llm.christmas/gas/price', data });
      } catch (bridgeErr: any) {
        const key = (process.env.ETHERSCAN_API_KEY || '').trim();
        const params = new URLSearchParams({
          chainid: '1',
          module: 'gastracker',
          action: 'gasoracle',
        });
        if (key) params.set('apikey', key);
        const data = await fetchJson(`https://api.etherscan.io/v2/api?${params}`);
        if (String(data?.status) === '0' || String(data?.message || '').toUpperCase() === 'NOTOK') {
          throw new Error(String(data?.result || data?.message || 'Etherscan gas oracle failed'));
        }
        return JSON.stringify({
          source: 'Etherscan API V2',
          data: data?.result,
          bridge_fallback: String(bridgeErr?.message || bridgeErr),
        });
      }
    }
    return JSON.stringify({ error: `unknown tool: ${name}` });
  } catch (err: any) {
    return JSON.stringify({ error: String(err?.message || err), tool: name });
  }
}
