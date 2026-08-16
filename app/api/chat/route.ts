import OpenAI from 'openai';
import { buildToolCard } from '@/lib/tool-cards';
import { executeTool } from '@/lib/execute-tool';
import { toolLabel, toolSource } from '@/lib/tool-meta';
import { POST_TOOL_SYSTEM, SYSTEM_PROMPT } from '@/lib/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'uniswap_quote_plan',
      description: 'Use uni-exec-engine to build a Uniswap quote/plan, read live reference prices, and return an app.uniswap.org deep link (deepLink / execution_links) so the user can open Uniswap and sign. Complements uniswap-ai style linking with real package-backed pricing.',
      parameters: {
        type: 'object',
        properties: {
          token_in: { type: 'string', description: 'Input token symbol or address, e.g. "ETH".' },
          token_out: { type: 'string', description: 'Output token symbol or address, e.g. "USDC".' },
          amount_in: { type: 'string', description: 'Human-readable input amount, e.g. "1".' },
          chain: { type: 'string', description: 'Chain name, default ethereum.' },
          slippage_pct: { type: 'number', description: 'Maximum slippage percentage, default 0.5.' },
        },
        required: ['token_in', 'token_out', 'amount_in'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'uniswap_swap_link',
      description: 'Build a prefilled app.uniswap.org swap deep link (official uniswap-ai style). User opens the link and signs in their wallet. No broadcast by the agent.',
      parameters: {
        type: 'object',
        properties: {
          token_in: { type: 'string', description: 'Input token symbol or address, e.g. "ETH".' },
          token_out: { type: 'string', description: 'Output token symbol or address, e.g. "USDC".' },
          amount_in: { type: 'string', description: 'Human-readable input amount, e.g. "1".' },
          chain: { type: 'string', description: 'Chain name, default ethereum.' },
        },
        required: ['token_in', 'token_out', 'amount_in'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'uniswap_il',
      description: 'Calculate Uniswap V3 concentrated-liquidity impermanent loss via uni-exec-engine.',
      parameters: {
        type: 'object',
        properties: {
          price_entry: { type: 'number' }, price_current: { type: 'number' },
          tick_lower: { type: 'integer' }, tick_upper: { type: 'integer' },
          decimals0: { type: 'integer', default: 18 }, decimals1: { type: 'integer', default: 6 },
          liquidity: { type: 'integer', default: 1000000000000000000 },
        },
        required: ['price_entry', 'price_current', 'tick_lower', 'tick_upper'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'uniswap_range_model',
      description: 'Generate conservative, moderate, and aggressive LP ranges via uni-exec-engine.',
      parameters: {
        type: 'object',
        properties: {
          current_tick: { type: 'integer' }, tick_spacing: { type: 'integer' },
          decimals0: { type: 'integer', default: 18 }, decimals1: { type: 'integer', default: 6 },
          pair_type: { type: 'string', enum: ['stable_stable', 'correlated', 'major_volatile', 'volatile'] },
          price_change_24h: { type: 'number' },
        },
        required: ['current_tick', 'tick_spacing', 'pair_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'polymarket_search',
      description: 'Search live Polymarket events and markets via polymarket-sdk.',
      parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', default: 5 } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'polymarket_market_snapshot',
      description: 'Fetch and validate a live Polymarket outcome-token order book via polymarket-sdk.',
      parameters: {
        type: 'object',
        properties: {
          market: { type: 'string', description: 'Market slug or id.' },
          outcome_index: { type: 'integer', default: 0 },
          max_spread: { type: 'number', default: 0.1 },
        },
        required: ['market'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hyperliquid_quote',
      description: 'Walk the live Hyperliquid L2 book and calculate an estimated fill via hl-trade-flow.',
      parameters: {
        type: 'object',
        properties: {
          coin: { type: 'string', description: 'BTC, ETH, etc.' },
          side: { type: 'string', enum: ['buy', 'sell'] },
          size_usd: { type: 'number' },
          max_slippage_pct: { type: 'number', default: 0.5 },
        },
        required: ['coin', 'side', 'size_usd'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'defi_doctor',
      description: 'Run a read-only chain/RPC/gas/wallet/policy preflight via defi-omni-cli.',
      parameters: {
        type: 'object',
        properties: {
          chain_id: { type: 'integer', default: 1 }, wallet: { type: 'string' },
          policy_check: { type: 'boolean', default: false }, amount: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wallet_balance_scan',
      description: 'Scan native and ERC20 token balances for a wallet via evm-wallet-scanner.',
      parameters: {
        type: 'object',
        properties: {
          wallet: { type: 'string', description: 'EVM address to scan.' },
          chain: { type: 'string', default: 'ethereum' },
        },
        required: ['wallet'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wallet_approval_scan',
      description: 'Scan active token approvals and spenders for a wallet via erc20-checker.',
      parameters: {
        type: 'object',
        properties: {
          wallet: { type: 'string', description: 'EVM address to scan.' },
          chain: { type: 'string', default: 'ethereum' },
        },
        required: ['wallet'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wallet_revoke_plan',
      description: 'Build a raw revoke transaction payload to set a spender allowance to 0 via erc20-checker.',
      parameters: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Token contract address.' },
          spender: { type: 'string', description: 'Spender contract address to revoke.' },
          chain: { type: 'string', default: 'ethereum' },
        },
        required: ['token', 'spender'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_token_price',
      description: 'Get current USD prices and 24h changes via CoinGecko.',
      parameters: { type: 'object', properties: { ids: { type: 'string', description: 'Comma-separated CoinGecko ids.' } }, required: ['ids'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_defi_tvl',
      description: 'Get protocol TVL via DefiLlama.',
      parameters: { type: 'object', properties: { protocol: { type: 'string' } }, required: ['protocol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_github_repo',
      description: 'Get GitHub repository stats.',
      parameters: { type: 'object', properties: { repo: { type: 'string' } }, required: ['repo'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_gas_price',
      description: 'Get current gas prices via DeFi Agent tool-bridge (Etherscan API V2 gasoracle).',
      parameters: {
        type: 'object',
        properties: {
          chain: { type: 'string', description: 'ethereum/base/arbitrum/optimism/polygon', default: 'ethereum' },
          speed: { type: 'string', description: 'slow/standard/fast', default: 'standard' },
        },
      },
    },
  },
];

function parseValue(value: string, stringFlag?: string): unknown {
  const clean = value.trim();
  if (stringFlag === 'true') return clean;
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean);
  if (clean === 'true') return true;
  if (clean === 'false') return false;
  return clean;
}

function parseDsmlToolCalls(content: string): any[] {
  if (!content || !/[<]?[｜|]\s*DSML\s*[｜|]/i.test(content)) return [];
  const calls: any[] = [];
  const invokeRe = /<[｜|]\s*DSML\s*[｜|]\s*invoke\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[｜|]\s*DSML\s*[｜|]\s*invoke\s*>/gi;
  let invoke: RegExpExecArray | null;
  while ((invoke = invokeRe.exec(content))) {
    const args: Record<string, unknown> = {};
    const paramRe = /<[｜|]\s*DSML\s*[｜|]\s*parameter\s+name=["']([^"']+)["'](?:\s+string=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/[｜|]\s*DSML\s*[｜|]\s*parameter\s*>/gi;
    let param: RegExpExecArray | null;
    while ((param = paramRe.exec(invoke[2]))) args[param[1]] = parseValue(param[3], param[2]);
    calls.push({ id: `dsml_${calls.length}_${Date.now()}`, type: 'function', function: { name: invoke[1], arguments: JSON.stringify(args) } });
  }
  return calls;
}

function stripInternalToolSyntax(text: string): string {
  return text
    .replace(/<[｜|]\s*DSML\s*[｜|]\s*tool_calls\s*>[\s\S]*?<\/[｜|]\s*DSML\s*[｜|]\s*tool_calls\s*>/gi, '')
    .replace(/<[｜|]\s*DSML\s*[｜|][^>]*>/gi, '')
    .replace(/<\/[｜|]\s*DSML\s*[｜|][^>]*>/gi, '')
    .trim();
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}

async function* chunkText(text: string) {
  for (const chunk of text.match(/[\s\S]{1,48}/g) || [text]) {
    yield chunk;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

type StreamController = ReadableStreamDefaultController<Uint8Array>;

function createStreamHelpers(controller: StreamController) {
  const encoder = new TextEncoder();
  return {
    sendData(payload: Record<string, unknown>) {
      controller.enqueue(encoder.encode(`2:${JSON.stringify([payload])}\n`));
    },
    sendText(chunk: string) {
      if (chunk) controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
    },
    finish(reason: 'stop' | 'error' = 'stop', error?: string) {
      const body = error ? { finishReason: reason, error } : { finishReason: reason };
      controller.enqueue(encoder.encode(`d:${JSON.stringify(body)}\n`));
    },
  };
}

function agentDataStream(work: (helpers: ReturnType<typeof createStreamHelpers>) => Promise<void>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const helpers = createStreamHelpers(controller);
      try {
        await work(helpers);
        helpers.finish('stop');
      } catch (error) {
        helpers.finish('error', String((error as any)?.message || error));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-v4-flash-200k' } = await req.json();
    const apiKey = process.env.LLM_CHRISTMAS_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = (process.env.LLM_CHRISTMAS_BASE_URL || 'https://api.llm.christmas/v1').replace(/\/$/, '');
    if (!apiKey) return jsonError('Missing LLM_CHRISTMAS_API_KEY in Vercel environment variables.');
    if (!Array.isArray(messages)) return jsonError('Invalid request: messages must be an array.', 400);

    const openai = new OpenAI({ apiKey, baseURL });
    const baseMessages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const stream = agentDataStream(async ({ sendData, sendText }) => {
      sendData({ type: 'phase', phase: 'routing', label: 'Routing intent' });

      const first: any = await openai.chat.completions.create({
        model, stream: false, messages: baseMessages, tools: TOOL_DEFINITIONS as any, tool_choice: 'auto',
      } as any);
      const firstMsg: any = first.choices?.[0]?.message || {};
      let toolCalls: any[] = firstMsg.tool_calls || [];
      if (toolCalls.length === 0) toolCalls = parseDsmlToolCalls(String(firstMsg.content || ''));

      if (toolCalls.length === 0) {
        sendData({ type: 'phase', phase: 'answer', label: 'Writing answer' });
        const text = stripInternalToolSyntax(String(firstMsg.content || '')) || 'The model returned no displayable response.';
        for await (const chunk of chunkText(text)) sendText(chunk);
        return;
      }

      sendData({ type: 'phase', phase: 'tools', label: `Running ${toolCalls.length} tool${toolCalls.length > 1 ? 's' : ''}` });

      const assistantToolMessage = { role: 'assistant', content: null, tool_calls: toolCalls };
      const conversation: any[] = [...baseMessages, assistantToolMessage];

      // Mark all tools running immediately for faster UI feedback, then execute in parallel.
      for (const call of toolCalls) {
        const name = String(call.function?.name || 'tool');
        sendData({
          type: 'tool',
          id: call.id,
          name,
          label: toolLabel(name),
          source: toolSource(name),
          status: 'running',
        });
      }

      const toolResults = await Promise.all(
        toolCalls.map(async (call) => {
          const name = String(call.function?.name || 'tool');
          let toolArgs: any = {};
          try { toolArgs = JSON.parse(call.function?.arguments || '{}'); } catch { toolArgs = {}; }
          const started = Date.now();
          const result = await executeTool(name, toolArgs);
          const ms = Date.now() - started;
          const card = buildToolCard(name, result);
          const failed = (() => {
            try { return Boolean(JSON.parse(result)?.error); } catch { return false; }
          })();
          sendData({
            type: 'tool',
            id: call.id,
            name,
            label: toolLabel(name),
            source: toolSource(name),
            status: failed ? 'error' : 'done',
            ms,
            completedAt: Date.now(),
            card,
            args: toolArgs,
          });
          return { call, result };
        })
      );

      for (const { call, result } of toolResults) {
        conversation.push({ role: 'tool', tool_call_id: call.id, content: result });
      }

      conversation.push({
        role: 'system',
        content: POST_TOOL_SYSTEM,
      });

      sendData({ type: 'phase', phase: 'synthesize', label: 'Synthesizing answer' });
      const response = await openai.chat.completions.create({ model, stream: true, messages: conversation } as any);

      let sawText = false;
      let raw = '';
      for await (const chunk of response as any) {
        const delta = chunk?.choices?.[0]?.delta?.content || '';
        if (!delta) continue;
        raw += delta;
        if (!sawText) {
          sawText = true;
          sendData({ type: 'phase', phase: 'answer', label: 'Streaming answer' });
        }
        // Second-pass answers should not include DSML; stream live for first-token latency.
        sendText(delta);
      }

      if (!sawText) {
        const clean = stripInternalToolSyntax(raw) || 'The model returned no displayable response.';
        for await (const piece of chunkText(clean)) sendText(piece);
      } else if (/[<]?[｜|]\s*DSML\s*[｜|]/i.test(raw)) {
        // Rare: if model still emitted tool syntax, replace stream is already out —
        // client sees it; we still finish normally.
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
    });
  } catch (err: any) {
    console.error('chat route error:', err);
    const status = err?.status || err?.statusCode || err?.response?.status;
    const detail = err?.error?.message || err?.message || String(err || 'Upstream model request failed.');
    return jsonError(`${detail}${status ? ` (HTTP ${status})` : ''}`);
  }
}
