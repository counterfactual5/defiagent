/** Display metadata for live tools shown in the activity rail. */
export const TOOL_META: Record<string, { label: string; source: string }> = {
  uniswap_quote_plan: { label: 'Uniswap Quote Plan', source: 'uni-exec-engine' },
  uniswap_swap_link: { label: 'Uniswap Deep Link', source: 'uni-exec-engine' },
  uniswap_il: { label: 'Impermanent Loss', source: 'uni-exec-engine' },
  uniswap_range_model: { label: 'LP Range Model', source: 'uni-exec-engine' },
  polymarket_search: { label: 'Polymarket Search', source: 'polymarket-sdk' },
  polymarket_market_snapshot: { label: 'Polymarket Snapshot', source: 'polymarket-sdk' },
  hyperliquid_quote: { label: 'Hyperliquid Quote', source: 'hl-trade-flow' },
  defi_doctor: { label: 'DeFi Doctor', source: 'defi-omni-cli' },
  wallet_balance_scan: { label: 'Wallet Balance Scan', source: 'evm-wallet-scanner' },
  wallet_approval_scan: { label: 'Approval Scan', source: 'erc20-checker' },
  wallet_revoke_plan: { label: 'Revoke Plan', source: 'erc20-checker' },
  get_token_price: { label: 'Token Price', source: 'CoinGecko' },
  get_defi_tvl: { label: 'Protocol TVL', source: 'DefiLlama' },
  get_github_repo: { label: 'Repo Stats', source: 'GitHub' },
  get_gas_price: { label: 'Gas Price', source: 'Etherscan / tool-bridge' },
};

export function toolLabel(name: string) {
  return TOOL_META[name]?.label || name;
}

export function toolSource(name: string) {
  return TOOL_META[name]?.source || 'tool-bridge';
}
