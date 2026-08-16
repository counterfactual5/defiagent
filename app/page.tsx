'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Activity,
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { RepoPanel } from '@/components/RepoPanel';
import { REPOS } from '@/lib/repos';

/** Free models on llm.christmas (model_ratio=0 or id ends with -free). Source: /api/pricing */
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

const EMPTY_PROMPTS = [
  REPOS.find((r) => r.name === 'hl-trade-flow')!,
  REPOS.find((r) => r.name === 'uni-exec-engine')!,
  REPOS.find((r) => r.name === 'defi-omni-cli')!,
];

export default function AgentPage() {
  const [selectedModel, setSelectedModel] = useState('deepseek-v4-flash-200k');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
    onError: (err) => setError(err.message || 'Chat request failed'),
    onResponse: (res) => {
      if (!res.ok) {
        res.clone().json().then((data) => setError(data?.error || res.statusText)).catch(() => setError(res.statusText));
      } else {
        setError(null);
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen text-slate-900 selection:bg-blue-100/70">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
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
              <p className="text-[11px] font-medium text-slate-500">
                Live package tools: order books, LP risk, RPC preflight, and market validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

      <main className="mx-auto flex h-[calc(100vh-65px)] max-w-[1200px] flex-col gap-6 px-5 py-6 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col overflow-hidden lg:w-[320px]">
          <RepoPanel onSuggest={setInput} />
        </aside>

        <section className="glass-panel-strong relative flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 bg-white/40 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Conversation
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live Model: {selectedModel}
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6">
            {error && (
              <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Request failed</p>
                  <p className="mt-0.5 break-all opacity-90">{error}</p>
                </div>
              </div>
            )}

            {messages.length === 0 && !error ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="brand-gradient mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md shadow-blue-500/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-800">
                  DeFi Agent with Live On-Chain Tools
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  The agent invokes the published Python packages on a read-only VPS bridge. Try a real package workflow:
                </p>
                <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {EMPTY_PROMPTS.slice(0, 2).map((repo) => (
                    <button
                      key={repo.name}
                      type="button"
                      onClick={() => setInput(repo.demoPrompt)}
                      className="flex flex-col rounded-xl border border-slate-200/90 bg-white/70 p-4 text-left transition hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)]"
                    >
                      <span className="mb-1 text-xs font-bold text-slate-700">{repo.tag}</span>
                      <span className="text-[11px] leading-relaxed text-slate-500">{repo.desc}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInput(EMPTY_PROMPTS[2].demoPrompt)}
                    className="flex flex-col rounded-xl border border-slate-200/90 bg-white/70 p-4 text-left transition hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)] sm:col-span-2"
                  >
                    <span className="mb-1 text-xs font-bold text-slate-700">{EMPTY_PROMPTS[2].tag}</span>
                    <span className="text-[11px] leading-relaxed text-slate-500">{EMPTY_PROMPTS[2].desc}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={`flex max-w-[85%] gap-3 ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm ${
                          isUser
                            ? 'border-slate-200 bg-slate-100'
                            : 'brand-gradient border-transparent'
                        }`}
                      >
                        {isUser ? (
                          <span className="text-[11px] font-bold text-slate-500">YOU</span>
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div
                        className={`relative px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${
                          isUser
                            ? 'rounded-2xl rounded-tr-sm border border-slate-200 bg-slate-100 text-slate-800'
                            : 'rounded-2xl rounded-tl-sm border border-slate-200/90 bg-white/90 text-slate-700'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <Markdown>{m.content || ''}</Markdown>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isLoading && (
              <div className="mt-4 flex items-center gap-2 pl-11 text-xs text-slate-400">
                <Activity className="h-4 w-4 animate-spin text-blue-600" />
                <span className="animate-pulse">Agent is thinking and processing tools...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100/80 bg-white/45 p-4">
            <div className="brand-ring mx-auto flex items-end gap-3 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm transition-shadow focus-within:border-blue-400">
              <textarea
                value={input}
                onChange={handleInputChange}
                rows={1}
                placeholder="Ask about prices, TVL, repos, gas — or click a tool / project on the left..."
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && input.trim()) handleSubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="brand-gradient inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="ml-0.5 h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-center text-[10.5px] font-medium text-slate-400">
              Enter to send · Shift+Enter newline · Tools run server-side via free public APIs
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
