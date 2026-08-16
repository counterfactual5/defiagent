import type { Message } from 'ai';
import type { TurnReceipt } from '@/lib/session';
import type { ToolCard } from '@/lib/tool-cards';

function cardLines(card: ToolCard): string[] {
  switch (card.kind) {
    case 'price':
      return card.items.map((i) => `- ${i.id}: $${i.usd ?? '—'} (${i.change24h ?? '—'}% 24h)`);
    case 'tvl':
      return [`- ${card.title}: $${card.tvlUsd ?? '—'}`];
    case 'repo':
      return [`- ${card.title}: ⭐ ${card.stars ?? '—'} · forks ${card.forks ?? '—'}`];
    case 'gas':
      return card.rows.map((r) => `- ${r.label}: ${r.value}`);
    case 'swap':
      return [
        `- ${card.amountIn || ''} ${card.tokenIn || ''} → ${card.amountOut || ''} ${card.tokenOut || ''}`.trim(),
        card.deepLink ? `- Deep link: ${card.deepLink}` : '',
      ].filter(Boolean);
    case 'perp':
      return [
        `- ${card.side || ''} ${card.coin || ''} · size ${card.sizeUsd || '—'}`,
        `- fill ${card.avgPrice || '—'} · slip ${card.slippage || '—'}`,
      ];
    case 'markets':
      return card.items.map((i) => `- ${i.name}${i.odds ? ` (${i.odds})` : ''}`);
    case 'doctor':
      return card.checks.map((c) => `- ${c.ok ? '✓' : '✗'} ${c.label}${c.detail ? `: ${c.detail}` : ''}`);
    case 'wallet':
      return card.items.map((i) => `- ${i.label}: ${i.value}`);
    case 'generic':
      return [`- ${card.title}: ${card.summary}`];
    default:
      return [];
  }
}

/** Build a shareable Markdown snapshot of the briefing (optionally one turn). */
export function exportBriefingMarkdown(
  messages: Message[],
  receiptsByTurn: Record<string, TurnReceipt>,
  opts?: { turnUserId?: string }
): string {
  const parts: string[] = ['# DeFi Agent Briefing', ''];

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    if (m.role === 'user') {
      if (opts?.turnUserId && m.id !== opts.turnUserId) {
        // skip until matching turn; still allow later assistant only if we skip whole turns
        const next = messages[i + 1];
        if (next?.role === 'assistant') i += 1;
        continue;
      }
      parts.push('## Query', '', String(m.content || ''), '');
      const receipt = receiptsByTurn[m.id];
      if (receipt?.tools?.length) {
        parts.push('### Tool receipts', '');
        for (const t of receipt.tools) {
          parts.push(`- **${t.label || t.name}** (${t.status}${t.ms != null ? `, ${t.ms}ms` : ''}) — ${t.source || ''}`);
          if (t.card) parts.push(...cardLines(t.card));
        }
        parts.push('');
      }
    } else if (m.role === 'assistant') {
      const prev = messages[i - 1];
      if (opts?.turnUserId && prev?.id !== opts.turnUserId) continue;
      parts.push('## Finding', '', String(m.content || ''), '');
    }
  }

  return parts.join('\n').trim() + '\n';
}
