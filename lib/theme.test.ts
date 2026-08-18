import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cycleTheme, isTheme, resolveTheme } from './theme.ts';

describe('theme', () => {
  it('resolves system from prefers-color-scheme', () => {
    assert.equal(resolveTheme('system', true), 'dark');
    assert.equal(resolveTheme('system', false), 'light');
    assert.equal(resolveTheme('dark', false), 'dark');
    assert.equal(resolveTheme('light', true), 'light');
  });

  it('cycles system → light → dark → system', () => {
    assert.equal(cycleTheme('system'), 'light');
    assert.equal(cycleTheme('light'), 'dark');
    assert.equal(cycleTheme('dark'), 'system');
  });

  it('validates stored values', () => {
    assert.equal(isTheme('dark'), true);
    assert.equal(isTheme('neon'), false);
  });
});
