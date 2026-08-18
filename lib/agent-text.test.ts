import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  collectToolCalls,
  displayableText,
  fallbackBriefing,
  looksLikeToolSyntax,
  parseDsmlToolCalls,
  showRailResultCards,
} from './agent-text.ts';

const root = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(root, 'fixtures', `${name}.json`), 'utf8');

describe('DSML and displayable text', () => {
  it('parses DSML invoke blocks into tool calls', () => {
    const content = `<｜DSML｜tool_calls>
<｜DSML｜invoke name="get_gas_price">
<｜DSML｜parameter name="chain" string="true">ethereum</｜DSML｜parameter>
</｜DSML｜invoke>
</｜DSML｜tool_calls>`;
    const calls = parseDsmlToolCalls(content);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].function.name, 'get_gas_price');
    assert.equal(JSON.parse(calls[0].function.arguments).chain, 'ethereum');
  });

  it('does not treat a Finding as tool syntax', () => {
    assert.equal(looksLikeToolSyntax('**Finding:** Ethereum gas is cheap enough to transact.'), false);
    assert.equal(looksLikeToolSyntax('<｜DSML｜invoke name="get_gas_price">'), true);
  });

  it('strips DSML so a tool-only message is not displayable', () => {
    const raw = `<｜DSML｜invoke name="uniswap_quote_plan"><｜DSML｜parameter name="token_in">ETH</｜DSML｜parameter></｜DSML｜invoke>`;
    assert.equal(displayableText(raw), '');
    assert.ok(parseDsmlToolCalls(raw).length === 1);
  });

  it('collects native OpenAI tool_calls first', () => {
    const calls = collectToolCalls({
      content: null,
      tool_calls: [{
        id: 'call_1',
        type: 'function',
        function: { name: 'get_token_price', arguments: '{"ids":"ethereum"}' },
      }],
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].id, 'call_1');
    assert.equal(calls[0].function.name, 'get_token_price');
  });
});

describe('fallback briefing', () => {
  it('keeps the Uniswap deep link tappable in markdown', () => {
    const md = fallbackBriefing([{ name: 'uniswap_quote_plan', result: fixture('uniswap_quote_plan') }]);
    assert.match(md, /\*\*Finding:\*\*/);
    assert.match(md, /is ready/);
    assert.doesNotMatch(md, /did not write/);
    assert.match(md, /app\.uniswap\.org/);
  });

  it('writes a real gas finding instead of a silent tool dump', () => {
    const md = fallbackBriefing([{ name: 'get_gas_price', result: fixture('get_gas_price') }]);
    assert.match(md, /\*\*Finding:\*\*/);
    assert.match(md, /gwei/i);
    assert.doesNotMatch(md, /did not write/);
  });

  it('summarizes failed tools instead of going silent', () => {
    const md = fallbackBriefing([{ name: 'get_gas_price', result: JSON.stringify({ error: 'timeout', tool: 'get_gas_price' }) }]);
    assert.match(md, /failed/i);
    assert.match(md, /timeout/);
  });
});

describe('rail card visibility', () => {
  it('keeps receipts visible after a run if no Finding exists', () => {
    assert.equal(showRailResultCards(false), true);
    assert.equal(showRailResultCards(true), false);
  });
});
