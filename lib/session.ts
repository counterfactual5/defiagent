import type { Message } from 'ai';
import type { PhaseEvent, ToolEvent } from '@/components/ToolActivityRail';

export const SESSION_KEY = 'defiagent.session.v1';

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
