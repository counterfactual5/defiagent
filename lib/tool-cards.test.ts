import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildToolCard } from './tool-cards.ts';
import { clearSession, loadSession, saveSession, SESSION_KEY } from './session.ts';
import { exportBriefingMarkdown } from './export-briefing.ts';

const root = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(root, 'fixtures', `${name}.json`), 'utf8');

describe('buildToolCard calibrated fixtures', () => {
  it('maps hyperliquid quote fields', () => {
    const card = buildToolCard('hyperliquid_quote', fixture('hyperliquid_quote'));
    assert.equal(card?.kind, 'perp');
    if (card?.kind !== 'perp') return;
    assert.equal(card.coin, 'BTC');
    assert.equal(card.side, 'buy');
    assert.ok(card.avgPrice);
    assert.ok(card.slippage?.includes('%'));
  });

  it('maps uniswap quote plan with deep link', () => {
    const card = buildToolCard('uniswap_quote_plan', fixture('uniswap_quote_plan'));
    assert.equal(card?.kind, 'swap');
    if (card?.kind !== 'swap') return;
    assert.equal(card.tokenIn, 'ETH');
    assert.equal(card.tokenOut, 'USDC');
    assert.ok(card.deepLink?.includes('app.uniswap.org'));
    assert.ok(card.amountOut || card.price);
  });

  it('maps defi doctor checks', () => {
    const card = buildToolCard('defi_doctor', fixture('defi_doctor'));
    assert.equal(card?.kind, 'doctor');
    if (card?.kind !== 'doctor') return;
    assert.ok(card.checks.length >= 3);
    assert.ok(card.checks.some((c) => c.label === 'rpc_chain_id'));
  });

  it('maps gas oracle gwei fields', () => {
    const card = buildToolCard('get_gas_price', fixture('get_gas_price'));
    assert.equal(card?.kind, 'gas');
    if (card?.kind !== 'gas') return;
    assert.equal(card.rows.length, 3);
    assert.ok(card.rows[0].value.includes('gwei'));
  });

  it('maps polymarket search events', () => {
    const card = buildToolCard('polymarket_search', fixture('polymarket_search'));
    assert.equal(card?.kind, 'markets');
    if (card?.kind !== 'markets') return;
    assert.ok(card.items.length >= 1);
    assert.ok(card.items[0].name.length > 3);
  });

  it('keeps errors as failed generic cards', () => {
    const card = buildToolCard('hyperliquid_quote', JSON.stringify({ error: 'boom', tool: 'hyperliquid_quote' }));
    assert.equal(card?.kind, 'generic');
    if (card?.kind !== 'generic') return;
    assert.equal(card.ok, false);
    assert.match(card.summary, /boom/);
  });
});

describe('session persistence', () => {
  it('round-trips messages and receipts in localStorage', () => {
    const store = new Map<string, string>();
    // @ts-expect-error test shim
    globalThis.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
      },
    };
    // @ts-expect-error test shim
    globalThis.localStorage = globalThis.window.localStorage;

    saveSession({
      selectedModel: 'deepseek-v4-flash',
      messages: [{ id: 'u1', role: 'user', content: 'hi' } as any],
      receiptsByTurn: {
        u1: { tools: [{ type: 'tool', name: 'get_gas_price', status: 'done' }] },
      },
    });
    const loaded = loadSession();
    assert.ok(loaded);
    assert.equal(loaded?.selectedModel, 'deepseek-v4-flash');
    assert.equal(loaded?.messages[0].id, 'u1');
    assert.equal(loaded?.receiptsByTurn.u1.tools[0].name, 'get_gas_price');
    clearSession();
    assert.equal(loadSession(), null);
    assert.equal(store.has(SESSION_KEY), false);
  });
});

describe('exportBriefingMarkdown', () => {
  it('includes query, receipts, and finding', () => {
    const md = exportBriefingMarkdown(
      [
        { id: 'u1', role: 'user', content: 'price of eth?' } as any,
        { id: 'a1', role: 'assistant', content: 'ETH is around $1,800.' } as any,
      ],
      {
        u1: {
          tools: [{
            type: 'tool',
            name: 'get_token_price',
            label: 'Token Price',
            status: 'done',
            source: 'CoinGecko',
            card: { kind: 'price', title: 'Token Price', items: [{ id: 'ethereum', usd: 1800, change24h: 1.2 }] },
          }],
        },
      }
    );
    assert.match(md, /## Query/);
    assert.match(md, /price of eth/);
    assert.match(md, /Token Price/);
    assert.match(md, /## Finding/);
    assert.match(md, /1,800/);
  });
});
