/** Built-in live tools the agent can call mid-conversation. */
export const LIVE_TOOLS = [
  {
    name: 'get_token_price',
    label: 'Token Price',
    source: 'CoinGecko',
    sample: 'ETH vs BTC over the last 24h — who led, is the move large, and does that change whether I should swap today?',
  },
  {
    name: 'get_defi_tvl',
    label: 'Protocol TVL',
    source: 'DefiLlama',
    sample: "Uniswap TVL by chain — where is liquidity concentrated, and what does that imply for routing a 1 ETH swap?",
  },
  {
    name: 'get_github_repo',
    label: 'Repo Stats',
    source: 'GitHub API',
    sample: 'Is uni-exec-engine active enough to trust as the quote path, and what should I actually use it for?',
  },
  {
    name: 'get_gas_price',
    label: 'Gas Price',
    source: 'tools.defiagent · Etherscan V2',
    sample: 'Is Ethereum gas cheap enough to transact now, or should I wait? Compare safe / standard / fast.',
  },
] as const;
