'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import type { Theme } from '@/lib/theme';

const LABEL: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

export function ThemeToggle({
  theme,
  onCycle,
}: {
  theme: Theme;
  onCycle: () => void;
}) {
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <button
      type="button"
      onClick={onCycle}
      className="ui-icon-btn"
      title={LABEL[theme]}
      aria-label={LABEL[theme]}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
