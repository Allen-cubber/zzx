const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

function pickNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json({ error: 'DEEPSEEK_API_KEY is not configured on Vercel.' }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return json({ error: 'messages must be a non-empty array.' }, 400);
    }

    const apiBaseUrl = (process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
    const endpoint = apiBaseUrl.endsWith('/chat/completions')
      ? apiBaseUrl
      : `${apiBaseUrl}/chat/completions`;

    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || payload.model || 'deepseek-v4-flash',
          messages: payload.messages,
          temperature: pickNumber(payload.temperature, 0.7),
          max_tokens: pickNumber(payload.max_tokens, 500),
          stream: false
        })
      });

      const body = await upstream.text();

      return new Response(body, {
        status: upstream.status,
        headers: {
          ...jsonHeaders,
          'content-type': upstream.headers.get('content-type') || jsonHeaders['content-type']
        }
      });
    } catch {
      return json({ error: 'DeepSeek upstream request failed.' }, 502);
    }
  }
};
