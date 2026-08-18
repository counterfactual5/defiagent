/** Parse model tool syntax and always produce a user-visible briefing. */

import { buildToolCard, type ToolCard } from '@/lib/tool-cards';

export type ParsedToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

function parseValue(value: string, stringFlag?: string): unknown {
  const clean = value.trim();
  if (stringFlag === 'true') return clean;
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean);
  if (clean === 'true') return true;
  if (clean === 'false') return false;
  return clean;
}

export function parseDsmlToolCalls(content: string): ParsedToolCall[] {
  if (!content || !/[<]?[｜|]\s*DSML\s*[｜|]/i.test(content)) return [];
  const calls: ParsedToolCall[] = [];
  const invokeRe = /<[｜|]\s*DSML\s*[｜|]\s*invoke\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[｜|]\s*DSML\s*[｜|]\s*invoke\s*>/gi;
  let invoke: RegExpExecArray | null;
  while ((invoke = invokeRe.exec(content))) {
    const args: Record<string, unknown> = {};
    const paramRe = /<[｜|]\s*DSML\s*[｜|]\s*parameter\s+name=["']([^"']+)["'](?:\s+string=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/[｜|]\s*DSML\s*[｜|]\s*parameter\s*>/gi;
    let param: RegExpExecArray | null;
    while ((param = paramRe.exec(invoke[2]))) args[param[1]] = parseValue(param[3], param[2]);
    calls.push({
      id: `dsml_${calls.length}_${Date.now()}`,
      type: 'function',
      function: { name: invoke[1], arguments: JSON.stringify(args) },
    });
  }
  return calls;
}

export function stripInternalToolSyntax(text: string): string {
  return text
    .replace(/<[｜|]\s*DSML\s*[｜|]\s*tool_calls\s*>[\s\S]*?<\/[｜|]\s*DSML\s*[｜|]\s*tool_calls\s*>/gi, '')
    .replace(/<[｜|]\s*DSML\s*[｜|][^>]*>/gi, '')
    .replace(/<\/[｜|]\s*DSML\s*[｜|][^>]*>/gi, '')
    .replace(/```(?:json|tool_call|tool)?\s*\{[\s\S]*?"(name|tool)"[\s\S]*?\}\s*```/gi, '')
    .trim();
}

export function messageText(message: { content?: unknown } | null | undefined): string {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const row = part as { text?: unknown; content?: unknown };
          if (typeof row.text === 'string') return row.text;
          if (typeof row.content === 'string') return row.content;
        }
        return '';
      })
      .join('');
  }
  return '';
}

export function collectToolCalls(message: any): ParsedToolCall[] {
  const native = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
  const calls: ParsedToolCall[] = [];
  for (const [index, call] of native.entries()) {
    const name = String(call?.function?.name || call?.name || '').trim();
    if (!name) continue;
    const args = call?.function?.arguments ?? call?.arguments ?? '{}';
    calls.push({
      id: String(call?.id || `tool_${index}_${Date.now()}`),
      type: 'function',
      function: {
        name,
        arguments: typeof args === 'string' ? args : JSON.stringify(args || {}),
      },
    });
  }
  if (calls.length > 0) return calls;
  return parseDsmlToolCalls(messageText(message));
}

export function displayableText(raw: string): string {
  return stripInternalToolSyntax(raw).trim();
}

function cardEvidence(card: ToolCard): { bullets: string[]; next?: string } {
  switch (card.kind) {
    case 'price':
      return {
        bullets: card.items.map((item) => {
          const change = item.change24h == null ? '' : ` (${item.change24h > 0 ? '+' : ''}${item.change24h.toFixed(2)}% 24h)`;
          return `- **${item.id}**: $${item.usd ?? '—'}${change}`;
        }),
      };
    case 'tvl':
      return { bullets: [`- **${card.title}**: $${card.tvlUsd ?? '—'}`] };
    case 'repo':
      return {
        bullets: [`- **${card.title}**: ⭐ ${card.stars ?? '—'} · forks ${card.forks ?? '—'}`],
        next: card.url ? `[Open repository](${card.url})` : undefined,
      };
    case 'gas':
      return { bullets: card.rows.map((row) => `- **${row.label}**: ${row.value}`) };
    case 'swap': {
      const pair = [card.amountIn, card.tokenIn, card.tokenOut && '→', card.amountOut, card.tokenOut]
        .filter(Boolean)
        .join(' ');
      return {
        bullets: [`- **${card.title}**: ${pair}${card.price ? ` · ${card.price}` : ''}`],
        next: card.deepLink ? `[Open in Uniswap](${card.deepLink})` : undefined,
      };
    }
    case 'perp':
      return {
        bullets: [`- **${card.title}**: ${card.side || ''} ${card.coin || ''} · fill ${card.avgPrice || '—'} · slip ${card.slippage || '—'}`],
      };
    case 'markets':
      return {
        bullets: card.items.slice(0, 4).map((item) => {
          const link = item.href ? `[${item.name}](${item.href})` : item.name;
          return `- ${link}${item.odds ? ` · ${item.odds}` : ''}`;
        }),
      };
    case 'doctor':
      return {
        bullets: card.checks.slice(0, 6).map((check) => `- ${check.ok ? '✓' : '✗'} ${check.label}`),
      };
    case 'wallet':
      return {
        bullets: card.items.slice(0, 6).map((item) => `- **${item.label}**: ${item.value}`),
      };
    default:
      return {
        bullets: [`- **${card.title}**: ${card.summary}`],
        next: card.link ? `[Open link](${card.link})` : undefined,
      };
  }
}

export function fallbackBriefing(results: { name: string; result: string }[]): string {
  const evidence: string[] = [];
  const nextSteps: string[] = [];
  let failed = 0;

  for (const { name, result } of results) {
    const card = buildToolCard(name, result);
    if (!card) {
      evidence.push(`- **${name}**: result received`);
      continue;
    }
    if (card.kind === 'generic' && !card.ok) {
      failed += 1;
      evidence.push(`- **${card.title}**: ${card.summary}`);
      continue;
    }
    const { bullets, next } = cardEvidence(card);
    evidence.push(...bullets);
    if (next) nextSteps.push(next);
  }

  const finding = failed === results.length && results.length > 0
    ? '**Finding:** Live tools ran, but every call failed — see receipts below.'
    : '**Finding:** Live tools finished; the model did not write a briefing, so this is the receipt summary.';

  const parts = [finding, '', '**Evidence:**', ...(evidence.length ? evidence : ['- No structured card was produced.'])];
  if (nextSteps.length) {
    parts.push('', '**Next step:**', `- ${nextSteps[0]} — review in your own wallet or browser. This agent does not broadcast.`);
  }
  return parts.join('\n');
}

/** Keep result cards on the query rail until an assistant Finding exists. */
export function showRailResultCards(hasAssistantMessage: boolean): boolean {
  return !hasAssistantMessage;
}
