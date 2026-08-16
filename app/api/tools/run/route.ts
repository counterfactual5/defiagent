import { executeTool } from '@/lib/execute-tool';
import { buildToolCard } from '@/lib/tool-cards';
import { toolLabel, toolSource } from '@/lib/tool-meta';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Re-run a single tool (used for per-tool retry in the UI). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const args = body?.args && typeof body.args === 'object' ? body.args : {};
    if (!name) {
      return Response.json({ error: 'Missing tool name' }, { status: 400 });
    }

    const started = Date.now();
    const result = await executeTool(name, args);
    const ms = Date.now() - started;
    const card = buildToolCard(name, result);
    let failed = false;
    try {
      failed = Boolean(JSON.parse(result)?.error);
    } catch {
      failed = false;
    }

    return Response.json({
      name,
      label: toolLabel(name),
      source: toolSource(name),
      status: failed ? 'error' : 'done',
      ms,
      card,
      args,
      result,
    });
  } catch (err: any) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
