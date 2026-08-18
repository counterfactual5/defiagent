'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function collectText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (typeof node === 'object' && node !== null && 'props' in node) {
    return collectText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

function citationLabel(href?: string): string | null {
  if (!href) return null;
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    if (host.includes('coingecko')) return 'CoinGecko';
    if (host.includes('llama.fi') || host.includes('defillama')) return 'DefiLlama';
    if (host.includes('github.com')) return 'GitHub';
    if (host.includes('etherscan')) return 'Etherscan';
    if (host.includes('uniswap.org')) return 'Uniswap';
    if (host.includes('hyperliquid')) return 'Hyperliquid';
    if (host.includes('polymarket')) return 'Polymarket';
    return null;
  } catch {
    return null;
  }
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
          h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
          p: ({ children }) => <p className="md-p">{children}</p>,
          ul: ({ children }) => <ul className="md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="md-ol">{children}</ol>,
          li: ({ children }) => <li className="md-li">{children}</li>,
          a: ({ href, children }) => {
            const chip = citationLabel(href);
            const label = collectText(children).trim();
            const redundant = chip && label.toLowerCase().includes(chip.toLowerCase());
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="md-a"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{children}</span>
                {chip && !redundant ? <span className="md-cite-chip">{chip}</span> : null}
              </a>
            );
          },
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code className={`md-code-block ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="md-code-inline" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="md-pre">{children}</pre>,
          table: ({ children }) => (
            <div className="md-table-wrap">
              <table className="md-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="md-th">{children}</th>,
          td: ({ children }) => <td className="md-td">{children}</td>,
          blockquote: ({ children }) => <blockquote className="md-quote">{children}</blockquote>,
          hr: () => <hr className="md-hr" />,
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
