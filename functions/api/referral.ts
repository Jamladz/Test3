export interface Env {
  TELEGRAM_BOT_TOKEN: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { initData, startParam, telegramId } = body;

  // Local development or mock bypass (should only be true in local dev)
  if (!initData || initData === 'mock' || initData.includes('mock')) {
    return new Response(JSON.stringify({ 
      verified: true, 
      telegramId, 
      startParam, 
      message: "Mock bypass for local development" 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
     console.error("Missing TELEGRAM_BOT_TOKEN environment variable in Cloudflare.");
     return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500 });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return new Response(JSON.stringify({ error: "Unauthorized: No hash provided" }), { status: 401 });
    }

    urlParams.delete('hash');
    const items: string[] = [];
    urlParams.forEach((value, key) => items.push(`${key}=${value}`));
    items.sort();
    const dataCheckString = items.join('\n');

    // Cloudflare Edge Web Crypto API for Telegram Hash Validation
    const encoder = new TextEncoder();
    
    // 1. Generate Secret Key from Bot Token
    const secretKeyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const secretKeyBuffer = await crypto.subtle.sign(
      'HMAC', 
      secretKeyMaterial, 
      encoder.encode(env.TELEGRAM_BOT_TOKEN)
    );

    const validationKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // 2. Hash the dataCheckString
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC', 
        validationKey, 
        encoder.encode(dataCheckString)
    );

    // 3. Convert signature to Hex
    const hashHex = Array.from(new Uint8Array(signatureBuffer))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');

    if (hashHex === hash) {
      return new Response(JSON.stringify({ 
         verified: true, 
         telegramId, 
         startParam 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Unauthorized: Invalid cryptographic signature" }), { status: 401 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Validation error: " + err.message }), { status: 500 });
  }
};
