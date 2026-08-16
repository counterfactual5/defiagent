/** Built-in live tools the agent can call mid-conversation. */
export const LIVE_TOOLS = [
  {
    name: 'get_token_price',
    label: 'Token Price',
    source: 'CoinGecko',
    sample: 'What is the current price of ETH and BTC? Include the 24h change.',
  },
  {
    name: 'get_defi_tvl',
    label: 'Protocol TVL',
    source: 'DefiLlama',
    sample: "What is Uniswap's current TVL? Break it down by chain.",
  },
  {
    name: 'get_github_repo',
    label: 'Repo Stats',
    source: 'GitHub API',
    sample: 'How many stars does uni-exec-engine have, and what does the repo do?',
  },
  {
    name: 'get_gas_price',
    label: 'Gas Price',
    source: 'tools.defiagent · Etherscan V2',
    sample: 'What is Ethereum gas right now? Is it a good time to transact?',
  },
] as const;
