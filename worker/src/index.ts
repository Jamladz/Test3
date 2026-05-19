/**
 * Cloudflare Worker for Telegram Web App Game
 * Handles:
 * - Bot Webhooks
 * - TWA Authentication validation via Telegram InitData
 * - User state sync (Taps, Energy, Upgrades)
 * - Leaderboard
 */

export interface Env {
  DB: D1Database;
  GAME_CACHE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Telegram Bot Webhook
    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleWebhook(request, env);
    }

    // API Routes (Require Auth)
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    return new Response('Tap Game API Ready', { status: 200 });
  },
};

// Simplified Handlers for Example

async function handleWebhook(request: Request, env: Env) {
  // Parse incoming Telegram update
  const payload = await request.json();
  // Handle start commands, send inline button to open TWA
  return new Response("OK", { status: 200 });
}

async function handleApiRequest(request: Request, env: Env) {
  // 1. Verify Telegram InitData (Authentication)
  // Extract initData from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  // 2. Route request
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/api/user') {
      return handleGetUser(request, env);
    } else if (path === '/api/sync') {
      return handleSync(request, env);
    } else if (path === '/api/upgrade') {
      return handleUpgrade(request, env);
    } else if (path === '/api/leaderboard') {
      return handleLeaderboard(request, env);
    }
  } catch(e) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }

  return new Response('Not Found', { status: 404 });
}

async function handleGetUser(request: Request, env: Env) {
  // Read from D1 DB
  // const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return new Response(JSON.stringify({ balance: 0, energy: 1000 }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleSync(request: Request, env: Env) {
  // Sync taps and energy back to DB
  return new Response(JSON.stringify({ success: true }));
}

async function handleUpgrade(request: Request, env: Env) {
  // Deduct balance, increase PPH
  return new Response(JSON.stringify({ success: true }));
}

async function handleLeaderboard(request: Request, env: Env) {
  // Fetch from D1 or KV cache
  return new Response(JSON.stringify([]));
}
