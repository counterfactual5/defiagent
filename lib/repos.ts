// Static metadata for the showcased GitHub projects.
// Live stats (stars/forks) are fetched separately via /api/repos.

export interface RepoMeta {
  name: string;
  tag: string;
  desc: string;
  url: string;
  badge: string;
  /** Prefill prompt when the user clicks the project in the sidebar. */
  demoPrompt: string;
}

export const REPOS: RepoMeta[] = [
  {
    name: 'uni-exec-engine',
    tag: 'Core Execution Engine',
    desc: 'Uniswap v2/v3/v4 execution engine: quote → approve → sign → broadcast, plus LP auto-rebalance (13K LOC, 99 tests).',
    url: 'https://github.com/counterfactual5/uni-exec-engine',
    badge: 'Python',
    demoPrompt:
      'Use uni-exec-engine to build a quote request plan for swapping 1 ETH to USDC on Ethereum. Do not invent an output amount.',
  },
  {
    name: 'defi-omni-cli',
    tag: 'Multi-Protocol CLI',
    desc: 'One CLI for Morpho Blue, Moonwell, Aave V3, Uniswap V3, 1inch, Lido, Compound, CCTP, and deBridge.',
    url: 'https://github.com/counterfactual5/defi-omni-cli',
    badge: 'Python',
    demoPrompt:
      'Run the defi-omni-cli doctor on Ethereum mainnet and explain each RPC and gas preflight check.',
  },
  {
    name: 'hl-trade-flow',
    tag: 'Perp DEX Trading',
    desc: 'Practical trading flow on top of official Hyperliquid SDK: quotes, slippage, positions, and orderbook.',
    url: 'https://github.com/counterfactual5/hl-trade-flow',
    badge: 'Python',
    demoPrompt:
      'Use hl-trade-flow to estimate a $10,000 BTC buy from the live Hyperliquid L2 book with a 0.5% slippage limit.',
  },
  {
    name: 'polymarket-py',
    tag: 'Prediction Market SDK',
    desc: 'The Python client Polymarket never shipped: zero-dep market data + CLOB trading (EIP-191), 25+ endpoints.',
    url: 'https://github.com/counterfactual5/polymarket-py',
    badge: 'Python',
    demoPrompt:
      'Use polymarket-py to search for active Bitcoin prediction markets and summarize their live outcome prices.',
  },
  {
    name: 'agent-delegate',
    tag: 'Multi-Agent Orchestration',
    desc: 'Production-grade multi-agent router with intelligent routing, fallback chains, and pipeline workers.',
    url: 'https://github.com/counterfactual5/agent-delegate',
    badge: 'Python',
    demoPrompt:
      'Explain how agent-delegate routes a DeFi research task across workers with a fallback chain.',
  },
  {
    name: 'Claude-Science-Proxy',
    tag: 'Tauri Desktop App',
    desc: 'Run Claude Science on your own model APIs with local sandbox, Skills/MCP managers, and web-search.',
    url: 'https://github.com/counterfactual5/Claude-Science-Proxy',
    badge: 'Rust / Tauri',
    demoPrompt:
      'Summarize what Claude-Science-Proxy offers for local sandboxing, Skills/MCP, and bringing your own model APIs.',
  },
];
