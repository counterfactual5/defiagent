'use client';

import { useChat } from 'ai/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  X,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { RepoPanel } from '@/components/RepoPanel';
import { ToolActivityRail, type PhaseEvent, type ToolEvent } from '@/components/ToolActivityRail';
import { LIVE_TOOLS } from '@/lib/live-tools';
import { clearSession, loadSession, saveSession, type SessionSnapshot, type TurnReceipt } from '@/lib/session';

const MODELS = [
  { id: 'deepseek-v4-flash-200k', label: 'DeepSeek V4 Flash 200K' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'glm-5.2-free', label: 'GLM 5.2 Free' },
  { id: 'minimax-m3-free', label: 'MiniMax M3 Free' },
  { id: 'mimo-v2.5-free', label: 'MiMo V2.5 Free' },
  { id: 'nemotron-3-ultra-free', label: 'Nemotron 3 Ultra Free' },
  { id: 'cursor-auto', label: 'Cursor Auto' },
];

type ArmedPrompt = { prompt: string; label: string };

function parseLiveData(data: unknown[] | undefined) {
  let latestPhase: PhaseEvent | null = null;
  const toolMap = new Map<string, ToolEvent>();
  for (const item of data || []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as any;
    if (row.type === 'phase') {
      latestPhase = row as PhaseEvent;
    } else if (row.type === 'tool' && row.name) {
      const key = String(row.id || row.name);
      toolMap.set(key, { ...(toolMap.get(key) || {}), ...row } as ToolEvent);
    }
  }
  return { phase: latestPhase, tools: Array.from(toolMap.values()) };
}

export default function AgentPage() {
  const [boot, setBoot] = useState<SessionSnapshot | null | undefined>(undefined);

  useEffect(() => {
    setBoot(loadSession());
  }, []);

  if (boot === undefined) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#eef2f7] text-sm text-slate-500">
        Restoring session…
      </div>
    );
  }

  return <AgentConsole boot={boot} />;
}

function AgentConsole({ boot }: { boot: SessionSnapshot | null }) {
  const [selectedModel, setSelectedModel] = useState(boot?.selectedModel || 'deepseek-v4-flash-200k');
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState<ArmedPrompt | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [receiptsByTurn, setReceiptsByTurn] = useState<Record<string, TurnReceipt>>(boot?.receiptsByTurn || {});
  const [composerPad, setComposerPad] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeTurnRef = useRef<string | null>(null);

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    isLoading,
    append,
    data,
    setData,
  } = useChat({
    api: '/api/chat',
    initialMessages: boot?.messages || [],
    body: { model: selectedModel },
    onError: (err) => setError(err.message || 'Chat request failed'),
    onResponse: (res) => {
      if (!res.ok) {
        res.clone().json().then((d) => setError(d?.error || res.statusText)).catch(() => setError(res.statusText));
      } else {
        setError(null);
      }
    },
  });

  const live = useMemo(() => parseLiveData(data as unknown[] | undefined), [data]);

  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser && isLoading) activeTurnRef.current = lastUser.id;
    const turnId = activeTurnRef.current || lastUser?.id;
    if (!turnId) return;
    if (!live.phase && live.tools.length === 0) return;
    setReceiptsByTurn((prev) => ({
      ...prev,
      [turnId]: {
        phase: live.phase,
        tools: live.tools,
      },
    }));
  }, [messages, isLoading, live.phase, live.tools]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, live.tools, live.phase]);

  useEffect(() => {
    saveSession({
      selectedModel,
      messages,
      receiptsByTurn,
    });
  }, [selectedModel, messages, receiptsByTurn]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const occluded = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setComposerPad(occluded > 40 ? occluded : 0);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  const startRun = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || isLoading) return;
    setArmed(null);
    setMobileOpen(false);
    setError(null);
    setData(undefined);
    activeTurnRef.current = null;
    await append({ role: 'user', content: text });
  };

  const handleInvoke = (prompt: string, meta?: { label: string }) => {
    if (input.trim() && input.trim() !== prompt.trim()) {
      setArmed({ prompt, label: meta?.label || 'Armed prompt' });
      setMobileOpen(false);
      return;
    }
    void startRun(prompt);
  };

  const onComposerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = armed?.prompt || input;
    if (!prompt.trim() || isLoading) return;
    setInput('');
    void startRun(prompt);
  };

  const clearChat = () => {
    if (isLoading) return;
    setMessages([]);
    setReceiptsByTurn({});
    setData(undefined);
    setArmed(null);
    setError(null);
    activeTurnRef.current = null;
    clearSession();
  };

  const receiptFor = (userMessageId: string, isActive: boolean): TurnReceipt => {
    if (isActive && (live.tools.length > 0 || live.phase)) {
      return { phase: live.phase, tools: live.tools };
    }
    return receiptsByTurn[userMessageId] || { tools: [] };
  };

  return (
    <div className="flex h-[100dvh] flex-col text-slate-900 selection:bg-blue-100/70">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:border-blue-300 lg:inline-flex"
              onClick={() => setRailOpen((v) => !v)}
              aria-label={railOpen ? 'Collapse context rail' : 'Expand context rail'}
            >
              {railOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:border-blue-300 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open tools"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-sm shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-slate-800">
                <span className="brand-text">DeFi Agent</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Live Tools
                </span>
              </h1>
              <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Operator console · receipts stay with each finding
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="max-w-[132px] cursor-pointer rounded-lg border border-slate-200 bg-white/80 px-2.5 py-2 text-xs text-slate-700 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:max-w-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={clearChat}
              disabled={isLoading || messages.length === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              title="Clear local session"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <a
              href="https://defiagent.llm.christmas"
              target="_blank"
              rel="noreferrer"
              className="brand-gradient hidden min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:brightness-105 sm:inline-flex"
            >
              Gateway <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`hidden shrink-0 border-r border-slate-200/70 bg-white/35 backdrop-blur-md transition-[width] duration-200 lg:flex ${
            railOpen ? 'w-[320px]' : 'w-[64px]'
          }`}
        >
          <div className="flex h-full w-full flex-col p-3">
            <RepoPanel onInvoke={handleInvoke} compact={!railOpen} />
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setMobileOpen(false)} />
            <div
              className="absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-2xl bg-[#eef2f7] shadow-2xl"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-center pt-2">
                <div className="h-1.5 w-10 rounded-full bg-slate-300" />
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-slate-800">Tools & Projects</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3">
                <div className="h-[min(68dvh,560px)]">
                  <RepoPanel onInvoke={handleInvoke} />
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="relative flex min-w-0 flex-1 flex-col bg-white/40">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-2.5 lg:px-6">
            <div className="text-sm font-semibold text-slate-700">Briefing</div>
            <div className="text-[11px] font-medium text-slate-400">
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isLoading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
              {isLoading ? (live.phase?.label || 'Working…') : `Live · ${selectedModel}`}
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              {error && (
                <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Request failed</p>
                    <p className="mt-0.5 break-all opacity-90">{error}</p>
                  </div>
                </div>
              )}

              {messages.length === 0 && !error ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center px-2 text-center">
                  <div className="brand-gradient mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md shadow-blue-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    Live on-chain tools, one click away
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Sessions autosave in this browser. Open Tools to run a live call — receipts stay attached to each finding.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {LIVE_TOOLS.slice(0, 3).map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => handleInvoke(tool.sample, { label: tool.label })}
                        className="min-h-11 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300"
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 pb-4">
                  {(() => {
                    let lastUserIndex = -1;
                    for (let i = messages.length - 1; i >= 0; i -= 1) {
                      if (messages[i].role === 'user') {
                        lastUserIndex = i;
                        break;
                      }
                    }
                    return messages.map((m, index) => {
                      if (m.role === 'user') {
                        const active = index === lastUserIndex;
                        const receipt = receiptFor(m.id, active);
                        return (
                          <div key={m.id}>
                            <div className="briefing-query">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Query</div>
                              <div className="whitespace-pre-wrap rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-[13.5px] leading-relaxed text-slate-800">
                                {m.content}
                              </div>
                            </div>
                            {(receipt.tools.length > 0 || receipt.phase || (active && isLoading)) && (
                              <div className="mt-4">
                                <ToolActivityRail
                                  phase={receipt.phase}
                                  tools={receipt.tools}
                                  isLoading={active && isLoading}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={m.id} className="briefing-finding">
                          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            <span className="brand-gradient inline-flex h-5 w-5 items-center justify-center rounded-md">
                              <Bot className="h-3 w-3 text-white" />
                            </span>
                            Finding
                          </div>
                          <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 text-[13.5px] leading-relaxed text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                            <Markdown>{m.content || ''}</Markdown>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form
            onSubmit={onComposerSubmit}
            className="border-t border-slate-100/80 bg-white/70 p-4 backdrop-blur-md lg:px-8"
            style={{ paddingBottom: `max(1rem, calc(1rem + ${composerPad}px))` }}
          >
            <div className="mx-auto w-full max-w-3xl">
              {armed && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-900">
                  <div className="min-w-0">
                    <span className="font-bold">Armed:</span>{' '}
                    <span className="font-semibold">{armed.label}</span>
                    <span className="ml-2 truncate text-blue-700/80">
                      {armed.prompt.slice(0, 80)}{armed.prompt.length > 80 ? '…' : ''}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" className="min-h-9 rounded-md px-2 py-1 font-semibold hover:bg-white/70" onClick={() => void startRun(armed.prompt)}>
                      Send
                    </button>
                    <button type="button" className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md hover:bg-white/70" onClick={() => setArmed(null)} aria-label="Clear armed prompt">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="brand-ring flex items-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm transition-shadow focus-within:border-blue-400">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  rows={1}
                  placeholder="Ask about prices, TVL, repos, gas — or run a tool from the rail..."
                  className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onComposerSubmit(e as any);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !armed)}
                  className="brand-gradient inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="ml-0.5 h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-center text-[10.5px] font-medium text-slate-400">
                Enter to send · drafts arm instead of overwrite · session saved locally
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
