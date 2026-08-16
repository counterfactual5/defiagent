import type { Message } from 'ai';
import type { TurnReceipt } from '@/lib/session';
import type { ToolCard } from '@/lib/tool-cards';
import { formatFetchedAt, formatIso } from '@/lib/format-time';

function cardLines(card: ToolCard): string[] {
  switch (card.kind) {
    case 'price':
      return card.items.map(
        (i) =>
          `- ${i.id}: $${i.usd ?? '—'} (${i.change24h == null ? '—' : `${i.change24h > 0 ? '+' : ''}${i.change24h}%`} 24h)`,
      );
    case 'tvl': {
      const lines = [`- ${card.title}: $${card.tvlUsd ?? '—'}`];
      if (card.chains?.length) {
        for (const c of card.chains.slice(0, 6)) {
          lines.push(`  - ${c.name}: $${c.tvl}`);
        }
      }
      return lines;
    }
    case 'repo':
      return [
        `- ${card.title}: ⭐ ${card.stars ?? '—'} · forks ${card.forks ?? '—'}`,
        card.language ? `- Language: ${card.language}` : '',
        card.url ? `- URL: ${card.url}` : '',
        card.description ? `- ${card.description}` : '',
      ].filter(Boolean);
    case 'gas':
      return card.rows.map((r) => `- ${r.label}: ${r.value}`);
    case 'swap':
      return [
        `- ${card.title}`,
        `- ${(card.amountIn || '').trim()} ${(card.tokenIn || '').trim()} → ${(card.amountOut || '').trim()} ${(card.tokenOut || '').trim()}`.replace(/\s+/g, ' ').trim(),
        card.price ? `- Price: ${card.price}` : '',
        card.chain ? `- Chain: ${card.chain}` : '',
        card.note ? `- Note: ${card.note}` : '',
        card.deepLink ? `- Deep link: ${card.deepLink}` : '',
      ].filter(Boolean);
    case 'perp':
      return [
        `- ${card.title}`,
        `- ${card.side || ''} ${card.coin || ''} · size ${card.sizeUsd || '—'}`.trim(),
        `- fill ${card.avgPrice || '—'} · slip ${card.slippage || '—'} · depth ${card.depth || '—'}`,
      ];
    case 'markets':
      return [
        `- ${card.title}`,
        ...card.items.map((i) => `- ${i.name}${i.odds ? ` (${i.odds})` : ''}${i.detail ? ` — ${i.detail}` : ''}`),
      ];
    case 'doctor':
      return [
        `- ${card.title}`,
        ...card.checks.map((c) => `- ${c.ok ? '✓' : '✗'} ${c.label}${c.detail ? `: ${c.detail}` : ''}`),
      ];
    case 'wallet':
      return [
        `- ${card.title}`,
        ...card.items.map((i) => `- ${i.label}: ${i.value}`),
        card.note ? `- Note: ${card.note}` : '',
      ].filter(Boolean);
    case 'generic':
      return [
        `- ${card.title}: ${card.summary}`,
        card.link ? `- Link: ${card.link}` : '',
      ].filter(Boolean);
    default:
      return [];
  }
}

/** Build a shareable Markdown snapshot of the briefing (optionally one turn). */
export function exportBriefingMarkdown(
  messages: Message[],
  receiptsByTurn: Record<string, TurnReceipt>,
  opts?: { turnUserId?: string; now?: number },
): string {
  const now = opts?.now ?? Date.now();
  const parts: string[] = ['# DeFi Agent Briefing', '', `_Exported ${formatIso(now) || new Date(now).toISOString()}_`, ''];

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    if (m.role === 'user') {
      if (opts?.turnUserId && m.id !== opts.turnUserId) {
        const next = messages[i + 1];
        if (next?.role === 'assistant') i += 1;
        continue;
      }
      parts.push('## Query', '', String(m.content || ''), '');
      const receipt = receiptsByTurn[m.id];
      if (receipt?.tools?.length) {
        parts.push('### Tool receipts', '');
        for (const t of receipt.tools) {
          const fresh = formatFetchedAt(t.completedAt, now);
          const meta = [
            t.status,
            t.ms != null ? `${t.ms}ms` : null,
            t.source || null,
            fresh ? `fetched ${fresh}` : null,
            t.completedAt ? formatIso(t.completedAt) : null,
          ]
            .filter(Boolean)
            .join(', ');
          parts.push(`- **${t.label || t.name}** (${meta})`);
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
