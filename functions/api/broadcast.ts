export interface Env {
  TELEGRAM_BOT_TOKEN: string;
}

export const onRequestOptions: any = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { userIds, photoUrl, caption, appUrl } = body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Response(JSON.stringify({ error: "No user IDs provided" }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '8628933356:AAHJpX7FI4OMBZfMaB-pc4q9uwO0NLW3Ps0';

  if (!TELEGRAM_BOT_TOKEN) {
     console.error("Missing TELEGRAM_BOT_TOKEN environment variable in Cloudflare.");
     return new Response(JSON.stringify({ error: "Server Configuration Error" }), { 
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
  }

  let successCount = 0;
  let failCount = 0;

  // Telegram API rate limits: max 30 messages per second.
  // We use context.waitUntil to avoid worker timeouts
  context.waitUntil((async () => {
    for (const userId of userIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            photo: photoUrl,
            caption: caption,
            reply_markup: {
              inline_keyboard: [[{ text: "Open Web App", web_app: { url: appUrl } }]]
            }
          })
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Delay for rate limiting
        await new Promise(r => setTimeout(r, 40));
      } catch (err) {
        failCount++;
      }
    }
  })());

  return new Response(JSON.stringify({ success: true, message: "Broadcast started in background", targeted: userIds.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};
