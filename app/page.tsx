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
  X,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { RepoPanel } from '@/components/RepoPanel';
import { ToolActivityRail, type PhaseEvent, type ToolEvent } from '@/components/ToolActivityRail';
import { LIVE_TOOLS } from '@/lib/live-tools';

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

export default function AgentPage() {
  const [selectedModel, setSelectedModel] = useState('deepseek-v4-flash-200k');
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState<ArmedPrompt | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    data,
    setData,
  } = useChat({
    api: '/api/chat',
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

  const { phase, tools } = useMemo(() => {
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
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, tools, phase]);

  const startRun = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || isLoading) return;
    setArmed(null);
    setMobileOpen(false);
    setError(null);
    setData(undefined);
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

  return (
    <div className="flex h-screen flex-col text-slate-900 selection:bg-blue-100/70">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:border-blue-300 lg:inline-flex"
              onClick={() => setRailOpen((v) => !v)}
              aria-label={railOpen ? 'Collapse context rail' : 'Expand context rail'}
            >
              {railOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex rounded-lg border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:border-blue-300 lg:hidden"
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
                Operator console · order books, LP risk, RPC preflight, market validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="max-w-[140px] cursor-pointer rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:max-w-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <a
              href="https://defiagent.llm.christmas"
              target="_blank"
              rel="noreferrer"
              className="brand-gradient hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:brightness-105 sm:flex"
            >
              Gateway <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Desktop rail */}
        <aside
          className={`hidden shrink-0 border-r border-slate-200/70 bg-white/35 backdrop-blur-md transition-[width] duration-200 lg:flex ${
            railOpen ? 'w-[320px]' : 'w-[64px]'
          }`}
        >
          <div className="flex h-full w-full flex-col p-3">
            <RepoPanel onInvoke={handleInvoke} compact={!railOpen} />
          </div>
        </aside>

        {/* Mobile sheet */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-900/35" aria-label="Close" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-2xl bg-[#eef2f7] p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-slate-800">Tools & Projects</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[68vh]">
                <RepoPanel onInvoke={handleInvoke} />
              </div>
            </div>
          </div>
        )}

        <section className="relative flex min-w-0 flex-1 flex-col bg-white/40">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-2.5 lg:px-6">
            <div className="text-sm font-semibold text-slate-700">Briefing</div>
            <div className="text-[11px] font-medium text-slate-400">
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isLoading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
              {isLoading ? (phase?.label || 'Working…') : `Live · ${selectedModel}`}
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
                <div className="flex min-h-[55vh] flex-col items-center justify-center px-2 text-center">
                  <div className="brand-gradient mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md shadow-blue-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    Live on-chain tools, one click away
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Open the left rail (or Tools on mobile) and run a live tool or project brief. No duplicate prompt cards here — the rail is the onboarding funnel.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {LIVE_TOOLS.slice(0, 3).map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => handleInvoke(tool.sample, { label: tool.label })}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300"
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
                      const isUser = m.role === 'user';
                      if (isUser) {
                        return (
                          <div key={m.id}>
                            <div className="briefing-query">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Query</div>
                              <div className="whitespace-pre-wrap rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-[13.5px] leading-relaxed text-slate-800">
                                {m.content}
                              </div>
                            </div>
                            {index === lastUserIndex && (
                              <div className="mt-4">
                                <ToolActivityRail phase={phase} tools={tools} isLoading={isLoading} />
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

              {messages.length === 0 && (isLoading || tools.length > 0) && (
                <ToolActivityRail phase={phase} tools={tools} isLoading={isLoading} />
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={onComposerSubmit} className="border-t border-slate-100/80 bg-white/55 p-4 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              {armed && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-900">
                  <div className="min-w-0">
                    <span className="font-bold">Armed:</span>{' '}
                    <span className="font-semibold">{armed.label}</span>
                    <span className="ml-2 truncate text-blue-700/80">{armed.prompt.slice(0, 80)}{armed.prompt.length > 80 ? '…' : ''}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" className="rounded-md px-2 py-1 font-semibold hover:bg-white/70" onClick={() => void startRun(armed.prompt)}>
                      Send
                    </button>
                    <button type="button" className="rounded-md p-1 hover:bg-white/70" onClick={() => setArmed(null)} aria-label="Clear armed prompt">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="brand-ring flex items-end gap-3 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm transition-shadow focus-within:border-blue-400">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  rows={1}
                  placeholder="Ask about prices, TVL, repos, gas — or run a tool from the rail..."
                  className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
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
                  className="brand-gradient inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="ml-0.5 h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-center text-[10.5px] font-medium text-slate-400">
                Enter to send · Shift+Enter newline · Tool receipts stream above the answer
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
