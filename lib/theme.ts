export const THEME_KEY = 'defiagent.theme.v1';

export type Theme = 'light' | 'dark' | 'system';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return isTheme(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function prefersDark(query?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia(query || '(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function resolveTheme(theme: Theme, systemDark = prefersDark()): 'light' | 'dark' {
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.dataset.theme = resolved;
}

export function cycleTheme(theme: Theme): Theme {
  if (theme === 'system') return 'light';
  if (theme === 'light') return 'dark';
  return 'system';
}
