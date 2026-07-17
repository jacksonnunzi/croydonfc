export default {
  async fetch(request, env) {
    // CORS headers for the admin page
    const cors = {
      'Access-Control-Allow-Origin': 'https://croydonfootballclub.com.au',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/auth') {
      try {
        const { hash } = await request.json();
        if (hash === env.PASSWORD_HASH) {
          return Response.json({ token: env.GITHUB_PAT }, { headers: cors });
        }
        return Response.json({ error: 'Wrong password' }, { status: 401, headers: cors });
      } catch {
        return Response.json({ error: 'Bad request' }, { status: 400, headers: cors });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
