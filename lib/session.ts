import type { Message } from 'ai';
import type { PhaseEvent, ToolEvent } from '@/components/ToolActivityRail';

export const SESSION_KEY = 'defiagent.session.v1';
export const WORKBENCH_KEY = 'defiagent.workbench.v1';

export type TurnReceipt = {
  phase?: PhaseEvent | null;
  tools: ToolEvent[];
};

export type SessionSnapshot = {
  version: 1;
  selectedModel: string;
  messages: Message[];
  receiptsByTurn: Record<string, TurnReceipt>;
  updatedAt: number;
};

export type PromptHistoryItem = {
  prompt: string;
  label?: string;
  at: number;
};

export type WorkbenchSnapshot = {
  version: 1;
  promptHistory: PromptHistoryItem[];
  updatedAt: number;
};

export function loadSession(): SessionSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (parsed?.version !== 1 || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(snapshot: Omit<SessionSnapshot, 'version' | 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: SessionSnapshot = {
      version: 1,
      updatedAt: Date.now(),
      ...snapshot,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadWorkbench(): WorkbenchSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WORKBENCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkbenchSnapshot;
    if (parsed?.version !== 1 || !Array.isArray(parsed.promptHistory)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkbench(promptHistory: PromptHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const payload: WorkbenchSnapshot = {
      version: 1,
      promptHistory: promptHistory.slice(0, 12),
      updatedAt: Date.now(),
    };
    localStorage.setItem(WORKBENCH_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function pushPromptHistory(
  current: PromptHistoryItem[],
  item: PromptHistoryItem,
): PromptHistoryItem[] {
  const trimmed = item.prompt.trim();
  if (!trimmed) return current;
  const next = [
    { ...item, prompt: trimmed, at: item.at || Date.now() },
    ...current.filter((x) => x.prompt.trim() !== trimmed),
  ];
  return next.slice(0, 12);
}

export function clearWorkbench() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WORKBENCH_KEY);
  } catch {
    // ignore
  }
}
